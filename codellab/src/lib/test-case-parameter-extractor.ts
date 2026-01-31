import { TestCase } from "@prisma/client";

export class TestCaseParameterExtractor {
  static extractParameters(
    testCases: TestCase[]
  ): Array<{ name: string; type: string }> {
    if (!testCases.length) return [];

    // Check if we're using the new structured format
    if (testCases[0].inputs) {
      // Use the structured inputs from the new schema
      const inputs = testCases[0].inputs as Record<string, any>;
      return Object.entries(inputs).map(([name, value], index) => ({
        name: name,
        type: this.inferType(value)
      }));
    } else {
      // Use the old format for backward compatibility
      const values = this.parseArguments(testCases[0].input!);
      return values.map((value, index) => ({
        name: this.inferName(index, value),
        type: this.inferType(value)
      }));
    }
  }

  /* -------------------- ARGUMENT PARSER -------------------- */

  private static parseArguments(raw: string): any[] {
    raw = raw.trim();
    if (!raw) return [];

    // Normalize commas
    raw = raw.replace(/,/g, " ");

    // Case 1: newline-separated
    if (raw.includes("\n")) {
      return raw.split("\n").map(v => this.parseValue(v.trim()));
    }

    // Case 2: array + scalar (Binary Search, Two Sum)
    const arrayMatch = raw.match(/\[.*?\]/);
    if (arrayMatch) {
      const arr = this.parseValue(arrayMatch[0]);

      const rest = raw
        .replace(arrayMatch[0], "")
        .trim();

      if (rest.length > 0) {
        return [arr, this.parseValue(rest)];
      }

      return [arr];
    }

    // Case 3: space-separated scalars
    const parts = raw.split(/\s+/);
    return parts.map(p => this.parseValue(p));
  }

  private static parseValue(token: string): any {
    token = token.trim();

    // Fix broken array like "2 3 4]"
    if (token.endsWith("]") && !token.startsWith("[")) {
      token = "[" + token;
    }

    try {
      return JSON.parse(token);
    } catch {
      if (!isNaN(Number(token))) return Number(token);
      if (token === "true") return true;
      if (token === "false") return false;
      if (token === "null") return null;
      return token;
    }
  }

  /* -------------------- NAME INFERENCE -------------------- */

  private static inferName(index: number, value: any): string {
    if (Array.isArray(value)) return "nums";
    if (typeof value === "number") return index === 0 ? "target" : `num${index}`;
    if (typeof value === "string") return `str${index}`;
    if (typeof value === "boolean") return `flag${index}`;
    return `param${index}`;
  }

  /* -------------------- TYPE INFERENCE -------------------- */

  private static inferType(value: any): string {
    if (Array.isArray(value)) {
      if (!value.length) return "any[]";
      return `${this.inferType(value[0])}[]`;
    }
    if (typeof value === "number") return "number";
    if (typeof value === "string") return "string";
    if (typeof value === "boolean") return "boolean";
    return "any";
  }

  /* -------------------- FUNCTION SIGNATURE -------------------- */

  static generateFunctionSignature(
    language: string,
    functionName: string,
    params: Array<{ name: string; type: string }>
  ): string {
    switch (language.toLowerCase()) {
      case "typescript":
        return `function ${functionName}(${params
          .map(p => `${p.name}: ${p.type}`)
          .join(", ")}): any {`;

      case "javascript":
        return `function ${functionName}(${params
          .map(p => p.name)
          .join(", ")}) {`;

      case "python":
        return `def ${functionName}(${params
          .map(p => p.name)
          .join(", ")}):`;

      case "java":
        return `public Object ${functionName}(${params
          .map(p => `${this.toJavaType(p.type)} ${p.name}`)
          .join(", ")}) {`;

      case "cpp":
        return `auto ${functionName}(${params
          .map(p => `${this.toCppType(p.type)} ${p.name}`)
          .join(", ")}) {`;

      default:
        return `function ${functionName}() {`;
    }
  }

  private static toJavaType(type: string): string {
    if (type === "number") return "int";
    if (type === "string") return "String";
    if (type === "number[]") return "int[]";
    return "Object";
  }

  private static toCppType(type: string): string {
    if (type === "number") return "int";
    if (type === "string") return "string";
    if (type === "number[]") return "vector<int>";
    return "auto";
  }
}
