import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

// GET /api/questions/[id]/testcases - Fetch test cases for a specific question
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const testCases = await prisma.testCase.findMany({
      where: { questionId: id , visibility : "PUBLIC"  },
      select: {
        id: true,
        input: true,
        output: true,
        inputs: true,
        expectedOutput: true,
        isPublic: true,
      }
    });

    // Transform the test cases to the required format
    const transformedTestCases = testCases.map(tc => {
      // If the test case has structured inputs and expectedOutput, use those
      if (tc.inputs && tc.expectedOutput) {
        return {
          id: tc.id,
          input: Array.isArray(tc.inputs) ? tc.inputs : [tc.inputs],
          expectedOutput: tc.expectedOutput,
          actualOutput: null, // Will be populated when code is run
          isPublic: tc.isPublic
        };
      } else {
        // Fallback to the old format if structured data isn't available
        return {
          id: tc.id,
          input: tc.input ? JSON.parse(tc.input) : [],
          expectedOutput: tc.output ? JSON.parse(tc.output) : null,
          actualOutput: null, // Will be populated when code is run
          isPublic: tc.isPublic
        };
      }
    });

    return NextResponse.json(transformedTestCases);
  } catch (error) {
    console.error('Error fetching test cases:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}