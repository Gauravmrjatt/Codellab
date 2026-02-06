import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeJavaScript, executePython, executeJava, executeCpp, runTestCases } from "@/lib/judge";
import { z } from "zod";
import { auth } from "@/auth";

const SubmissionSchema = z.object({
    code: z.string(),
    language: z.string(),
    questionId: z.string().nullish(),
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

        // If mode is 'run' and questionId is provided, run test cases
        if (mode === "run" && questionId && questionId !== "mock-question-id") {

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

            // Filter test cases based on mode (run only public test cases)
            const testCases = question.testCases.filter(tc => tc.visibility === "PUBLIC");

            // Transform test cases to the format expected by runTestCases
            const transformedTestCases = testCases.map(tc => ({
                input: tc.input ?? undefined,
                output: tc.output ?? undefined,
                inputs: (tc.inputs as Record<string, any>) ?? undefined,
                expected_output: tc.expectedOutput ?? undefined,
                visibility: tc.visibility ?? undefined
            }));

            const { results, verdict } = await runTestCases(
                code,
                language,
                transformedTestCases as any,
                question.timeLimit,
                question.functionName || 'solve'
            );

            // Create a temporary submission ID for cheat analysis during run mode
            const tempSubmissionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            if (events && events.length > 0) {
                await analyzeCheat(tempSubmissionId, userId, events);
            }

            return NextResponse.json({
                success: true,
                results,
                verdict,
                output: `Ran ${testCases.length} test cases. Verdict: ${verdict}`,
                logs: []
            });
        }
        // For custom input or non-question runs
        let result;
        let testInput: any[] = [];

        try {
            // Parse custom input as structured input
            testInput = JSON.parse(customInput || "[]");
        } catch {
            // If parsing fails, treat as string and try to parse as arguments
            testInput = [customInput || ""];
        }

        // Use a default function name for custom executions
        const functionName = "solve";

        switch (language.toLowerCase()) {
            case "python":
                result = await executePython(code, testInput, functionName);
                break;
            case "java":
                result = await executeJava(code, testInput, functionName);
                break;
            case "cpp":
                result = await executeCpp(code, testInput, functionName);
                break;
            case "javascript":
            case "typescript":
            default:
                result = await executeJavaScript(code, testInput, functionName);
                break;
        }
        console.log(result)
        // Create a temporary submission ID for cheat analysis during run mode
        const tempSubmissionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (events && events.length > 0) {
            await analyzeCheat(tempSubmissionId, userId, events);
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error("Submission validation error:", error);
        return NextResponse.json({ error: "Invalid submission data" }, { status: 400 });
    }
}

// Enhanced cheat detection analysis
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

        // 4. Check for rapid succession of paste events
        let consecutivePasteCount = 0;
        for (let i = 0; i < events.length; i++) {
            if (events[i].type === "PASTE") {
                consecutivePasteCount++;

                // If we have 2 or more pastes within a short time frame (e.g., 1 second)
                if (consecutivePasteCount >= 2) {
                    const timeDiff = new Date(events[i].timestamp).getTime() -
                        new Date(events[i - 1].timestamp).getTime();

                    if (timeDiff < 1000) { // Less than 1 second between pastes
                        await prisma.cheatLog.create({
                            data: {
                                userId,
                                submissionId,
                                type: "RAPID_PASTE",
                                severity: 9,
                                metadata: {
                                    count: consecutivePasteCount,
                                    timeDiff: timeDiff
                                },
                            }
                        });
                        consecutivePasteCount = 0; // Reset counter after logging
                    }
                }
            } else {
                consecutivePasteCount = 0; // Reset counter when not a paste
            }
        }

        // 5. Check for extremely low typing activity relative to code length
        const totalKeystrokes = keystrokes.length;
        const totalCodeLength = events.length > 0 ? events[events.length - 1].metadata?.totalLength || 0 : 0;

        // If the final code is long (> 500 chars) but there are very few keystrokes (< 50), it's suspicious
        if (totalCodeLength > 500 && totalKeystrokes < 50) {
            await prisma.cheatLog.create({
                data: {
                    userId,
                    submissionId,
                    type: "LOW_ACTIVITY_HIGH_OUTPUT",
                    severity: 8,
                    metadata: {
                        totalCodeLength,
                        totalKeystrokes,
                        ratio: totalKeystrokes / totalCodeLength
                    },
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

        return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    } catch (error) {
        console.error("Get submission error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
