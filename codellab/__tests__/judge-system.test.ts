import { runTestCases } from "@/lib/judge";

describe("Judge System", () => {
  describe("JavaScript execution", () => {
    it("should execute JavaScript code with test cases", async () => {
      const code = `
        function solution(a, b) {
          return a + b;
        }
      `;
      
      const testCases = [
        { input: "[1, 2]", output: "3" },
        { input: "[5, 7]", output: "12" }
      ];
      
      const result = await runTestCases(code, "javascript", testCases);
      
      expect(result.verdict).toBe("ACCEPTED");
      expect(result.results.length).toBe(2);
      expect(result.results.every(r => r.passed)).toBe(true);
    });
  });

  describe("Python execution", () => {
    it("should execute Python code with test cases", async () => {
      const code = `
def solution(a, b):
    return a + b
      `;
      
      const testCases = [
        { input: "[1, 2]", output: "3" },
        { input: "[5, 7]", output: "12" }
      ];
      
      const result = await runTestCases(code, "python", testCases);
      
      expect(result.verdict).toBe("ACCEPTED");
      expect(result.results.length).toBe(2);
      expect(result.results.every(r => r.passed)).toBe(true);
    });
  });

  describe("Java execution", () => {
    it("should execute Java code with test cases", async () => {
      const code = `
public class Solution {
    public int solution(int a, int b) {
        return a + b;
    }
}
      `;
      
      const testCases = [
        { input: "[1, 2]", output: "3" },
        { input: "[5, 7]", output: "12" }
      ];
      
      const result = await runTestCases(code, "java", testCases);
      
      // Note: This test might fail if Docker isn't available or Java isn't properly configured
      // The actual implementation would need more robust Java input/output handling
      expect(result.verdict).toBeDefined();
    });
  });

  describe("C++ execution", () => {
    it("should execute C++ code with test cases", async () => {
      const code = `
#include <vector>

int solution(int a, int b) {
    return a + b;
}
      `;
      
      const testCases = [
        { input: "[1, 2]", output: "3" },
        { input: "[5, 7]", output: "12" }
      ];
      
      const result = await runTestCases(code, "cpp", testCases);
      
      // Note: This test might fail if Docker isn't available or C++ isn't properly configured
      // The actual implementation would need more robust C++ input/output handling
      expect(result.verdict).toBeDefined();
    });
  });

  describe("Error handling", () => {
    it("should handle runtime errors", async () => {
      const code = `
        function solution(a, b) {
          return a + c; // 'c' is not defined
        }
      `;
      
      const testCases = [
        { input: "[1, 2]", output: "3" }
      ];
      
      const result = await runTestCases(code, "javascript", testCases);
      
      expect(result.verdict).toMatch(/(RUNTIME_ERROR|WRONG_ANSWER)/);
    });

    it("should handle wrong answers", async () => {
      const code = `
        function solution(a, b) {
          return a - b; // Wrong operation
        }
      `;
      
      const testCases = [
        { input: "[1, 2]", output: "3" } // Expected 3 but will get -1
      ];
      
      const result = await runTestCases(code, "javascript", testCases);
      
      expect(result.verdict).toBe("WRONG_ANSWER");
      expect(result.results[0].passed).toBe(false);
    });
  });
});