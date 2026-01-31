export function generateCodeTemplate(
  language: string,
  signature: string,
  functionName: string,
  questionTitle: string
): string {
  switch (language.toLowerCase()) {
    case "javascript":
    case "typescript":
      return `// ${questionTitle}
${signature}
  // TODO: implement solution
}

module.exports = { ${functionName} };
`;

    case "python":
      return `# ${questionTitle}
${signature}
    # TODO: implement solution
    pass
`;

    case "java":
      return `// ${questionTitle}
public class Solution {

    ${signature}
        // TODO: implement solution
        return null;
    }
}
`;

    case "cpp":
      return `// ${questionTitle}
#include <bits/stdc++.h>
using namespace std;

${signature}
    // TODO: implement solution
    return {};
}
`;

    default:
      return signature;
  }
}
