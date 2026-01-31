import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import { generateStarterCodeFromInputOutput } from '@/lib/default-code-service';

const prisma = new PrismaClient();

// GET /api/questions/[id] - Fetch a specific question by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        testCases: true,
        inputs: {
            orderBy: { order: 'asc' }
        },
        output: true
      }
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Transform the question to match frontend expectations
    const transformedQuestion = {
      id: question.id,
      title: question.title,
      slug: question.slug,
      description: question.description,
      difficulty: question.difficulty,
      points: question.points,
      timeLimit: question.timeLimit,
      memoryLimit: question.memoryLimit,
      functionName: question.functionName,
      starterCode: question.starterCode,
      solution: question.solution,
      tags: question.tags.map(qt => qt.tag.name),
      testCases: question.testCases,
      inputs: question.inputs,
      output: question.output,
      examples: [], // Add examples if they exist in your schema
      constraints: "", // Add constraints if they exist in your schema
    };

    return NextResponse.json(transformedQuestion);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { testCases, points, timeLimit, memoryLimit, inputs, output, functionName, tags, ...rest } = body;

    // Verify ownership
    const existingQuestion = await prisma.question.findUnique({ where: { id } });
    if (!existingQuestion) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existingQuestion.authorId !== session.user.id) {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // Transaction to update
        await prisma.$transaction(async (tx) => {
            // Delete related data
            await tx.testCase.deleteMany({ where: { questionId: id } });
            await tx.inputDefinition.deleteMany({ where: { questionId: id } });
            await tx.outputDefinition.deleteMany({ where: { questionId: id } });

            // Update question and recreate related data
            await tx.question.update({
                where: { id },
                data: {
                    ...rest,
                    points: Number(points),
                    timeLimit: Number(timeLimit),
                    memoryLimit: Number(memoryLimit),
                    functionName: functionName || "solve",
                    testCases: {
                        create: testCases?.map((tc: any) => ({
                            inputs: tc.inputs,
                            expectedOutput: tc.expected_output,
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
        });

        // Regenerate starter code
        const languages = ['javascript', 'python', 'java', 'cpp', 'typescript'];
        const starterCodes: Record<string, string> = {};

        for (const lang of languages) {
            starterCodes[lang] = await generateStarterCodeFromInputOutput(id, lang);
        }

        await prisma.question.update({
            where: { id },
            data: {
                starterCode: JSON.stringify(starterCodes)
            }
        });

        return NextResponse.json({ message: "Updated successfully" });
    } catch (error: any) {
        console.error('Error updating question:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}