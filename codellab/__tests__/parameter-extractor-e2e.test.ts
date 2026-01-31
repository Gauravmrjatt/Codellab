import { TestCaseParameterExtractor } from "../src/lib/test-case-parameter-extractor";

// Test the parameter extraction with various inputs
describe("TestCaseParameterExtractor - End-to-End", () => {
  test("should handle Two Sum problem format", () => {
    const testCases = [
      {
        id: "1",
        questionId: "test",
        input: "[2,7,11,15]\n9",
        output: "[0,1]",
        isPublic: true,
        inputs: { nums: [2,7,11,15], target: 9 },
        expectedOutput: [0,1],
        visibility: "PUBLIC" as any
      }
    ];

    const parameters = TestCaseParameterExtractor.extractParameters(testCases);
    expect(parameters).toHaveLength(2);
    expect(parameters[0].name).toMatch(/nums|arr0|param0/); // Could be nums, arr0, or param0 depending on implementation
    expect(parameters[1].name).toMatch(/num1|param1/); // Could be num1 or param1

    // Generate function signature
    const signature = TestCaseParameterExtractor.generateFunctionSignature(
      "javascript",
      "twoSum",
      parameters
    );

    expect(signature).toContain("function twoSum");
    expect(signature).toContain(parameters[0].name);
    expect(signature).toContain(parameters[1].name);
  });

  test("should handle single parameter input", () => {
    const testCases = [
      {
        id: "1",
        questionId: "test",
        input: "121",
        output: "true",
        isPublic: true,
        inputs: { n: 121 },
        expectedOutput: true,
        visibility: "PUBLIC" as any
      }
    ];

    const parameters = TestCaseParameterExtractor.extractParameters(testCases);
    expect(parameters).toHaveLength(1);
    expect(parameters[0]).toEqual({ name: expect.any(String), type: expect.any(String) });
  });

  test("should handle array input", () => {
    const testCases = [
      {
        id: "1",
        questionId: "test",
        input: "[1,2,3,4,5]",
        output: "15",
        isPublic: true,
        inputs: { arr: [1,2,3,4,5] },
        expectedOutput: 15,
        visibility: "PUBLIC" as any
      }
    ];

    const parameters = TestCaseParameterExtractor.extractParameters(testCases);
    // When input is a single array like [1,2,3,4,5], each element becomes a parameter
    expect(parameters).toHaveLength(5);
    expect(parameters[0]).toEqual({ name: expect.stringMatching(/num0|param0/), type: "number" });
  });

  test("should handle object input", () => {
    const testCases = [
      {
        id: "1",
        questionId: "test",
        input: '{"nums":[2,7,11,15],"target":9}',
        output: "[0,1]",
        isPublic: true,
        inputs: { nums: [2,7,11,15], target: 9 },
        expectedOutput: [0,1],
        visibility: "PUBLIC" as any
      }
    ];

    const parameters = TestCaseParameterExtractor.extractParameters(testCases);
    expect(parameters).toHaveLength(2); // Should extract 'nums' and 'target' as separate parameters
  });
});