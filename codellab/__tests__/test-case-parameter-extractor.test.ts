import { TestCaseParameterExtractor } from "../src/lib/test-case-parameter-extractor";

// Mock test cases for testing
const mockTestCases = [
  {
    id: "1",
    questionId: "test",
    input: "[2,7,11,15]\n9",
    output: "[0,1]",
    isPublic: true,
    inputs: { nums: [2,7,11,15], target: 9 },
    expectedOutput: [0,1],
    visibility: "PUBLIC" as any
  },
  {
    id: "2",
    questionId: "test",
    input: "[3,2,4]\n6",
    output: "[1,2]",
    isPublic: true,
    inputs: { nums: [3,2,4], target: 6 },
    expectedOutput: [1,2],
    visibility: "PUBLIC" as any
  }
];

describe("TestCaseParameterExtractor", () => {
  test("should extract parameters correctly from test cases", () => {
    const parameters = TestCaseParameterExtractor.extractParameters(mockTestCases);

    // For the input "[2,7,11,15]\n9", after processing, we get an array with two elements
    // The first element is [2,7,11,15] and the second is 9
    expect(parameters).toHaveLength(2);
    expect(parameters[0]).toEqual({ name: "nums", type: "number[]" });
    expect(parameters[1]).toEqual({ name: "num1", type: "number" });
  });

  test("should generate correct function signature for JavaScript", () => {
    const parameters = TestCaseParameterExtractor.extractParameters(mockTestCases);
    const signature = TestCaseParameterExtractor.generateFunctionSignature(
      "javascript",
      "twoSum",
      parameters
    );

    expect(signature).toContain("function twoSum");
    expect(signature).toContain("nums");
    expect(signature).toContain("num1");
  });

  test("should generate correct function signature for Python", () => {
    const parameters = TestCaseParameterExtractor.extractParameters(mockTestCases);
    const signature = TestCaseParameterExtractor.generateFunctionSignature(
      "python",
      "twoSum",
      parameters
    );

    expect(signature).toContain("def twoSum");
    expect(signature).toContain("nums");
    expect(signature).toContain("num1");
  });

  test("should generate correct function signature for Java", () => {
    const parameters = TestCaseParameterExtractor.extractParameters(mockTestCases);
    const signature = TestCaseParameterExtractor.generateFunctionSignature(
      "java",
      "twoSum",
      parameters
    );

    expect(signature).toContain("public");
    expect(signature).toContain("twoSum");
  });

  test("should generate correct function signature for C++", () => {
    const parameters = TestCaseParameterExtractor.extractParameters(mockTestCases);
    const signature = TestCaseParameterExtractor.generateFunctionSignature(
      "cpp",
      "twoSum",
      parameters
    );

    expect(signature).toContain("twoSum");
  });
});