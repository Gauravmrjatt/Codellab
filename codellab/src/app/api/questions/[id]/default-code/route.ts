import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generateStarterCodeFromTestCases } from "@/lib/default-code-service";

// API route to get default code for a question
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get("lang");
    const { id: questionId } = await params;  // Await the params to unwrap the Promise
    const autoGenerate = "true" // Flag to enable auto-generation from test cases

    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch question from database
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        testCases: true
      }
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Determine the default code based on language
    let defaultCode = "";

    // Parse the starter code JSON if it exists
    let parsedStarterCode: Record<string, string> | null = null;
    if (question.starterCode) {
      try {
        parsedStarterCode = JSON.parse(question.starterCode);
      } catch (e) {
        console.error("Error parsing starter code JSON:", e);
      }
    }

    if (language) {
      // Check if auto-generation is enabled
      if (autoGenerate === 'true') {
        // Generate starter code based on test cases
        defaultCode = await generateStarterCodeFromTestCases(questionId, language);
      } else {
        // If a specific language is requested, return the starter code for that language
        switch (language.toLowerCase()) {
          case "javascript":
          case "typescript":
            defaultCode = (parsedStarterCode && parsedStarterCode.javascript) || `// ${question.title}\nfunction solution() {\n  // Your solution here\n  return "";\n}\n\nconsole.log(solution());`;
            break;
          case "python":
            defaultCode = (parsedStarterCode && parsedStarterCode.python) || `# ${question.title}\ndef solution():\n    # Your solution here\n    return ""\n\nprint(solution())`;
            break;
          case "java":
            defaultCode = (parsedStarterCode && parsedStarterCode.java) || `// ${question.title}\npublic class Solution {\n    public String solution() {\n        // Your solution here\n        return "";\n    }\n    \n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        System.out.println(sol.solution());\n    }\n}`;
            break;
          case "cpp":
            defaultCode = (parsedStarterCode && parsedStarterCode.cpp) || `// ${question.title}\n#include <iostream>\n#include <string>\n\nstd::string solution() {\n    // Your solution here\n    return "";\n}\n\nint main() {\n    std::cout << solution() << std::endl;\n    return 0;\n}`;
            break;
          default:
            // Default to JavaScript if language not recognized
            defaultCode = (parsedStarterCode && parsedStarterCode.javascript) || `// ${question.title}\nfunction solution() {\n  // Your solution here\n  return "";\n}\n\nconsole.log(solution());`;
        }
      }
    } else {
      // If no language specified, return all language defaults
      const codes: Record<string, string> = {};

      if (autoGenerate === 'true') {
        // Generate starter codes for all languages based on test cases
        codes.javascript = await generateStarterCodeFromTestCases(questionId, 'javascript');
        codes.typescript = await generateStarterCodeFromTestCases(questionId, 'typescript');
        codes.python = await generateStarterCodeFromTestCases(questionId, 'python');
        codes.java = await generateStarterCodeFromTestCases(questionId, 'java');
        codes.cpp = await generateStarterCodeFromTestCases(questionId, 'cpp');
      } else {
        codes.javascript = (parsedStarterCode && parsedStarterCode.javascript) || `// ${question.title}\nfunction solution() {\n  // Your solution here\n  return "";\n}\n\nconsole.log(solution());`;
        codes.python = (parsedStarterCode && parsedStarterCode.python) || `# ${question.title}\ndef solution():\n    # Your solution here\n    return ""\n\nprint(solution())`;
        codes.java = (parsedStarterCode && parsedStarterCode.java) || `// ${question.title}\npublic class Solution {\n    public String solution() {\n        // Your solution here\n        return "";\n    }\n    \n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        System.out.println(sol.solution());\n    }\n}`;
        codes.cpp = (parsedStarterCode && parsedStarterCode.cpp) || `// ${question.title}\n#include <iostream>\n#include <string>\n\nstd::string solution() {\n    // Your solution here\n    return "";\n}\n\nint main() {\n    std::cout << solution() << std::endl;\n    return 0;\n}`;
      }

      return NextResponse.json({ codes });
    }

    return NextResponse.json({ code: defaultCode });
  } catch (error) {
    console.error("Error fetching default code:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}