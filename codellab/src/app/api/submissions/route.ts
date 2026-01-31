import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runTestCases, formatTestCaseResults } from "@/lib/judge";
import { z } from "zod";
import { auth } from "@/auth";

const SubmissionSchema = z.object({
    code: z.string(),
    language: z.string(),
    questionId: z.string(),
    contestId: z.string().optional(),
    events: z.array(z.object({
        type: z.string(),
        deltaLength: z.number(),
        timestamp: z.string(),
        metadata: z.any().optional(),
    })).optional(),
    mode: z.enum(["run", "submit"]).optional().default("submit"),
    customInput: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;

        const body = await req.json();
        const { code, language, questionId, contestId, events, mode, customInput } = SubmissionSchema.parse(body);

        // 1. Get question with test cases and input/output definitions
        const question = await prisma.question.findUnique({
            where: { id: questionId },
            include: {
                testCases: true,
                inputs: { orderBy: { order: 'asc' } },
                output: true
            },
        });

        if (!question) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        // --- RUN MODE (Ephemeral) ---
        if (mode === "run") {
            let casesToRun = question.testCases.filter(tc => tc.visibility === "PUBLIC");

            if (customInput) {
                // If custom input provided, create a temporary test case
                // Expected output is unknown/not validated for custom runs usually,
                // but our runner might need the field.
                casesToRun = [{
                    id: "custom",
                    questionId: question.id,
                    inputs: JSON.parse(customInput), // Assuming custom input is structured
                    expected_output: null, // No expected output for custom run
                    visibility: "PUBLIC",
                } as any];
            } else if (casesToRun.length === 0) {
                casesToRun = question.testCases.slice(0, 2);
            }

            console.log(`[Judge] running ${customInput ? 'custom input' : 'sample tests'} for question ${questionId}`);

            try {
                // Transform test cases to the format expected by runTestCases
                const transformedCasesToRun = casesToRun.map(tc => ({
                    inputs: (tc.inputs && typeof tc.inputs === 'object') ? tc.inputs as Record<string, any> : {},
                    expected_output: tc.expectedOutput,
                    visibility: tc.visibility
                }));

                const { results, verdict } = await runTestCases(
                    code,
                    language,
                    transformedCasesToRun,
                    question.timeLimit,
                    question.functionName || 'solve'
                );

                return NextResponse.json({
                    status: "COMPLETED",
                    verdict,
                    results,
                    passed: customInput ? true : results.every(r => r.passed), // Custom input always "passes" execution if no runtime error
                    message: customInput ? "Custom run complete" : (results.every(r => r.passed) ? "All sample tests passed" : "Some sample tests failed"),
                    details: formatTestCaseResults(results),
                    output: customInput && results.length > 0 ? results[0].actualOutput : undefined, // Explicit output for custom run
                    expectedOutput: customInput ? null : undefined, // No expected output to show
                    logs: results.flatMap(r => r.logs).join("\n"),
                });
            } catch (error: any) {
                return NextResponse.json({
                    status: "RUNTIME_ERROR",
                    error: error.message,
                    message: "Execution failed"
                });
            }
        }

        // --- SUBMIT MODE (Persist & Full Check) ---

        // 2. Create Submission record
        const submission = await prisma.submission.create({
            data: {
                code,
                language,
                questionId,
                userId,
                contestId,
                status: "PENDING",
            },
        });

        // 3. Record events for cheat detection
        if (events && events.length > 0) {
            await prisma.submissionEvent.createMany({
                data: events.map(event => ({
                    submissionId: submission.id,
                    eventType: event.type,
                    deltaLength: event.deltaLength,
                    timestamp: new Date(event.timestamp),
                    metadata: event.metadata,
                })),
            });

            // Trigger Async Cheat Detection
            console.log(`[CheatDetection] Analyzing submission ${submission.id}...`);
            analyzeCheat(submission.id, userId, events).catch(console.error);
        }

        // 4. Execute code against test cases
        console.log(`[Judge] Executing submission ${submission.id} for language ${language}...`);

        try {
            // Transform test cases to the format expected by runTestCases
            const transformedTestCases = question.testCases.map(tc => ({
                inputs: (tc.inputs && typeof tc.inputs === 'object') ? tc.inputs as Record<string, any> : {},
                expected_output: tc.expectedOutput,
                visibility: tc.visibility
            }));

            const { results, verdict } = await runTestCases(
                code,
                language,
                transformedTestCases,
                question.timeLimit,
                question.functionName || 'solve'
            );

            const passedTests = results.filter(r => r.passed).length;
            const totalTests = results.length;
            const avgRuntime = Math.round(
                results.reduce((sum, r) => sum + r.runtime, 0) / (totalTests || 1)
            );
            const maxMemory = Math.max(...results.map(r => 0)); // Memory tracking needs improvement

            // Map verdict to status
            const statusMap: Record<string, any> = {
                ACCEPTED: "ACCEPTED",
                WRONG_ANSWER: "WRONG_ANSWER",
                TIME_LIMIT_EXCEEDED: "TIME_LIMIT_EXCEEDED",
                RUNTIME_ERROR: "RUNTIME_ERROR",
            };

            const status = statusMap[verdict] || "RUNTIME_ERROR";

            // Update submission with results
            await prisma.submission.update({
                where: { id: submission.id },
                data: {
                    status,
                    runtime: avgRuntime,
                    memory: maxMemory,
                    passedTests,
                    totalTests,
                    errorMessage: verdict !== "ACCEPTED" ? JSON.stringify(formatTestCaseResults(results)) : null,
                },
            });

            console.log(`[Judge] Submission ${submission.id}: ${verdict}`);

            return NextResponse.json({
                id: submission.id,
                status,
                verdict,
                passedTests,
                totalTests,
                runtime: avgRuntime,
                message: verdict === "ACCEPTED"
                    ? "All test cases passed!"
                    : `${passedTests}/${totalTests} test cases passed`,
                details: formatTestCaseResults(results),
                logs: results.flatMap(r => r.logs).join("\n"),
            });
        } catch (judgeError: any) {
            console.error(`[Judge] Error executing submission ${submission.id}:`, judgeError);

            await prisma.submission.update({
                where: { id: submission.id },
                data: {
                    status: "RUNTIME_ERROR",
                    errorMessage: judgeError.message,
                },
            });

            return NextResponse.json({
                id: submission.id,
                status: "RUNTIME_ERROR",
                error: judgeError.message,
            }, { status: 200 });
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Submission failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Cheat detection analysis
async function analyzeCheat(submissionId: string, userId: string, events: any[]) {
    try {
        // 1. Check for large paste operations
        const largePaste = events.find(e => e.type === "PASTE" && e.deltaLength > 500);
        if (largePaste) {
            await prisma.cheatLog.create({
                data: {
                    userId,
                    submissionId,
                    type: "INSTANT_PASTE",
                    severity: 8,
                    metadata: { charCount: largePaste.deltaLength },
                }
            });
        }

        // 2. Check typing velocity (too fast = suspicious)
        const keystrokes = events.filter(e => e.type === "KEYSTROKE");
        if (keystrokes.length > 10) {
            const intervals = keystrokes
                .slice(1)
                .map((e, i) => e.metadata?.interval || 0);
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

            // If average typing interval is < 50ms, it's suspiciously fast
            if (avgInterval < 50 && avgInterval > 0) {
                await prisma.cheatLog.create({
                    data: {
                        userId,
                        submissionId,
                        type: "VELOCITY",
                        severity: 6,
                        metadata: { avgInterval, count: keystrokes.length },
                    }
                });
            }
        }

        // 3. Check for sudden bursts (multiple large changes in short time)
        const pasteEvents = events.filter(e => e.type === "PASTE");
        if (pasteEvents.length > 3) {
            await prisma.cheatLog.create({
                data: {
                    userId,
                    submissionId,
                    type: "MULTIPLE_PASTE",
                    severity: 7,
                    metadata: { count: pasteEvents.length },
                }
            });
        }
    } catch (error) {
        console.error("Cheat analysis error:", error);
    }
}

// GET endpoint to retrieve submission status
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const questionId = searchParams.get("questionId");

        // Case 1: Fetch specific submission by ID
        if (id) {
            const submission = await prisma.submission.findUnique({
                where: { id },
                include: {
                    question: {
                        select: {
                            title: true,
                            difficulty: true,
                            inputs: { orderBy: { order: 'asc' } },
                            output: true,
                            functionName: true
                        },
                    },
                    user: {
                        select: {
                            username: true,
                        },
                    },
                },
            });

            if (!submission) {
                return NextResponse.json({ error: "Submission not found" }, { status: 404 });
            }

            return NextResponse.json(submission);
        }

        // Case 2: List submissions for a question (authenticated user only)
        if (questionId) {
            const session = await auth();
            if (!session?.user?.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const submissions = await prisma.submission.findMany({
                where: {
                    questionId,
                    userId: session.user.id,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                select: {
                    id: true,
                    status: true,
                    runtime: true,
                    memory: true,
                    passedTests: true,
                    totalTests: true,
                    createdAt: true,
                    language: true,
                },
            });

            return NextResponse.json(submissions);
        }

        // Case 3: List all submissions for the user
        const session = await auth();
        if (session?.user?.id) {
            const submissions = await prisma.submission.findMany({
                where: {
                    userId: session.user.id,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    question: {
                        select: {
                            title: true,
                            slug: true,
                        },
                    },
                },
            });

            return NextResponse.json(submissions);
        }

        return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    } catch (error) {
        console.error("Get submission error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
