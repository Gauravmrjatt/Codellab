import { NextRequest, NextResponse } from 'next/server';
import { runTestCases } from '@/lib/judge';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth'; // Assuming auth helper
import { z } from 'zod';

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
});

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { code, language, questionId, contestId, events } = SubmissionSchema.parse(body);

        const question = await prisma.question.findUnique({
            where: { id: questionId },
            include: {
                testCases: true,
                inputs: { orderBy: { order: 'asc' } },
                output: true
            },
        });

        if (!question) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        // Transform test cases to the format expected by runTestCases
        const transformedTestCases = question.testCases.map(tc => ({
            input: tc.input,
            output: tc.output,
            inputs: tc.inputs as any,
            expected_output: tc.expectedOutput,
            visibility: tc.visibility
        }));

        // Run all test cases (both public and hidden)
        const { results, verdict } = await runTestCases(
            code,
            language,
            transformedTestCases,
            question.timeLimit,
            question.functionName || 'solve'
        );

        // Count passed tests
        const passedTests = results.filter((r: any) => r.passed).length;

        // Save submission
        const submission = await prisma.submission.create({
            data: {
                code,
                language,
                status: verdict as any, // Type assertion since verdict matches SubmissionStatus
                runtime: results[0]?.runtime || 0, // Using first test case runtime as overall
                memory: 0, // Memory tracking would need to be enhanced
                errorMessage: results.find((r: any) => r.error)?.error || null,
                passedTests,
                totalTests: question.testCases.length,
                userId: session.user.id!,
                questionId: question.id,
                contestId: contestId,
            },
        });

        // Analyze for cheating if events are provided
        if (events && events.length > 0) {
            await analyzeCheat(submission.id, session.user.id, events);
        }

        return NextResponse.json({
            submission,
            verdict,
            results,
            passedTests,
            totalTests: question.testCases.length
        });
    } catch (error) {
        console.error('Submission failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
