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
      let input: any[] = [];
      let expectedOutput: any = null;

      // 1. Handle Input (Prefer structured 'inputs', fallback to 'input' string)
      if (tc.inputs !== null && tc.inputs !== undefined) {
        // If it's already an array, use it. If it's an object, we might need to extract values.
        // Based on the rest of the codebase, it's either an array of arguments or an object of named arguments.
        if (Array.isArray(tc.inputs)) {
          input = tc.inputs;
        } else if (typeof tc.inputs === 'object') {
          input = Object.values(tc.inputs as object);
        } else {
          input = [tc.inputs];
        }
      } else if (tc.input) {
        try {
          // Try parsing as JSON first (it might be a JSON array string)
          const parsed = JSON.parse(tc.input);
          input = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // If not JSON, it might be newline-separated or space-separated (old seed format)
          if (tc.input.includes('\n')) {
            input = tc.input.split('\n').map(v => {
              try { return JSON.parse(v.trim()); } catch { return v.trim(); }
            });
          } else {
            input = [tc.input];
          }
        }
      }

      // 2. Handle Expected Output (Prefer 'expectedOutput', fallback to 'output' string)
      if (tc.expectedOutput !== null && tc.expectedOutput !== undefined) {
        expectedOutput = tc.expectedOutput;
      } else if (tc.output) {
        try {
          expectedOutput = JSON.parse(tc.output);
        } catch {
          expectedOutput = tc.output;
        }
      }

      return {
        id: tc.id,
        input,
        expectedOutput,
        actualOutput: null,
        isPublic: tc.isPublic
      };
    });
    return NextResponse.json(transformedTestCases);
  } catch (error) {
    console.error('Error fetching test cases:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}