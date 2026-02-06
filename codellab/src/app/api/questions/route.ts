import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import { generateStarterCodeFromInputOutput } from '@/lib/default-code-service';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const questions = await prisma.question.findMany({
        select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
            tags: { include: { tag: true } },
        }
    });
    return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { testCases, points, timeLimit, memoryLimit, inputs, output, functionName, ...rest } = body;

    // Basic validation would go here

    // Create the question with test cases first
    const question = await prisma.question.create({
        data: {
            ...rest,
            points: Number(points),
            timeLimit: Number(timeLimit),
            memoryLimit: Number(memoryLimit),
            functionName: functionName || "solve",
            authorId: session.user.id,
            testCases: {
                create: testCases?.map((tc: any) => ({
                    inputs: tc.inputs,
                    expectedOutput: tc.expected_output ?? tc.expectedOutput,
                    visibility: tc.visibility
                })) || []
            },
            inputs: {
                create: inputs?.map((input: any, index: number) => ({
                    name: input.name,
                    type: input.type,
                    description: input.description,
                    order: index
                })) || []
            },
            output: output ? {
                create: {
                    type: output.type,
                    description: output.description
                }
            } : undefined
        }
    });

    // Generate starter code based on input/output definitions for different languages
    try {
        const languages = ['javascript', 'python', 'java', 'cpp', 'typescript'];
        const starterCodes: Record<string, string> = {};

        for (const lang of languages) {
            starterCodes[lang] = await generateStarterCodeFromInputOutput(question.id, lang);
        }

        // Update the question with generated starter codes
        await prisma.question.update({
            where: { id: question.id },
            data: {
                starterCode: JSON.stringify(starterCodes)
            }
        });
    } catch (error) {
        console.error('Error generating starter code from input/output definitions:', error);
        // Continue without starter code if generation fails
    }

    // Fetch the updated question with all related data
    const updatedQuestion = await prisma.question.findUnique({
        where: { id: question.id },
        include: {
            testCases: true,
            inputs: true,
            output: true,
            tags: {
                include: {
                    tag: true
                }
            }
        }
    });

    return NextResponse.json(updatedQuestion);
}
