import util from "util";

/* -------------------- TYPES -------------------- */

export interface ExecutionResult {
    success: boolean;
    output?: string;
    logs: string[];
    error?: string;
    runtime: number;
    memory: number;
    status? : string
}

export interface TestCaseResult {
    input: any;
    expectedOutput: any;
    actualOutput: any;
    logs: string[];
    passed: boolean;
    runtime: number;
    error?: string;
}

/* -------------------- CONSTANTS -------------------- */

const EXECUTION_TIMEOUT_MS = 3000;
const JUDGE_SERVICE_URL = process.env.JUDGE_SERVICE_URL || "http://judge:3000";

/* -------------------- REMOTE EXECUTION -------------------- */

async function callJudgeService(
    language: string,
    code: string,
    testInput: any[],
    functionName: string,
    timeoutMs: number
): Promise<ExecutionResult> {
    try {
        const response = await fetch(`${JUDGE_SERVICE_URL}/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                language,
                code,
                testInput,
                functionName,
                timeLimitMs: timeoutMs
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(errorData.error || `Judge execution failed: ${response.status}`);
        }

        return await response.json();
    } catch (e: any) {
        console.error("Judge service error:", e);
        return {
            success: false,
            logs: [e.message],
            runtime: 0,
            memory: 0,
            status: "RUNTIME_ERROR",
            error: e.message
        };
    }
}

/* -------------------- LANGUAGE WRAPPERS -------------------- */

export async function executeJavaScript(
    code: string,
    testInput: any[],
    functionName: string = 'solve',
    timeoutMs = EXECUTION_TIMEOUT_MS
): Promise<ExecutionResult> {
    return callJudgeService("javascript", code, testInput, functionName, timeoutMs);
}

export async function executePython(
    code: string,
    testInput: any[],
    functionName: string = 'solve',
    timeoutMs = EXECUTION_TIMEOUT_MS
): Promise<ExecutionResult> {
    return callJudgeService("python", code, testInput, functionName, timeoutMs);
}

export async function executeJava(
    code: string,
    testInput: any[],
    functionName: string = 'solve',
    timeoutMs = EXECUTION_TIMEOUT_MS
): Promise<ExecutionResult> {
    return callJudgeService("java", code, testInput, functionName, timeoutMs);
}

export async function executeCpp(
    code: string,
    testInput: any[],
    functionName: string = 'solve',
    timeoutMs = EXECUTION_TIMEOUT_MS
): Promise<ExecutionResult> {
    return callJudgeService("cpp", code, testInput, functionName, timeoutMs);
}

// This function is deprecated since we now use structured inputs
function parseTestCaseInput(raw: string): any[] {
    raw = raw.trim();
    if (!raw) return [];

    // Normalize commas
    raw = raw.replace(/,/g, " ");

    // Fix missing opening bracket
    if (raw.includes("]") && !raw.includes("[")) {
        raw = "[" + raw;
    }

    // Split by newline first
    if (raw.includes("\n")) {
        return raw.split("\n").map(v => parseValue(v.trim()));
    }

    const tokens = raw.match(/\[.*?\]|\{.*?\}|".*?"|\S+/g);
    if (!tokens) return [];

    return tokens.map(parseValue);
}

// New function to handle structured inputs
function parseStructuredInput(inputs: Record<string, any>): any[] {
    // Return the values in the same order as the keys appear
    // Since we need to maintain the order of inputs as defined in the question
    return Object.values(inputs);
}

function parseValue(token: string): any {
    token = token.trim();

    // Fix broken arrays like "2 3 4 5]"
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


export async function runTestCases(
    code: string,
    language: string,
    testCases: Array<{ input?: string; output?: string; inputs?: Record<string, any>; expected_output?: any; visibility?: string }>,
    timeLimitMs = 2000,
    functionName: string = 'solve'
): Promise<{ results: TestCaseResult[]; verdict: string }> {
    const results: TestCaseResult[] = [];
    let allPassed = true;

    for (const t of testCases) {
        // Determine if we're using the new structured format or the old format
        let input: any[];
        let expected: any;

        // Structured format (inputs is an object or array)
        if (t.inputs !== null && t.inputs !== undefined && (Array.isArray(t.inputs) || Object.keys(t.inputs).length > 0)) {
            input = Array.isArray(t.inputs) ? t.inputs : parseStructuredInput(t.inputs);
            
            if (t.expected_output !== undefined) {
                expected = t.expected_output;
            } else if (t.output) {
                try { expected = JSON.parse(t.output); } catch { expected = t.output; }
            } else {
                expected = null;
            }
        } else {
            // Old format for backward compatibility
            input = parseTestCaseInput(t.input || "");
            if (t.expected_output !== undefined && t.expected_output !== null) {
                expected = t.expected_output;
            } else {
                try { expected = JSON.parse(t.output || "null"); } catch { expected = t.output; }
            }
        }

        let result: ExecutionResult;
        switch (language.toLowerCase()) {
            case "python":
                result = await executePython(code, input, functionName, timeLimitMs);
                break;
            case "java":
                result = await executeJava(code, input, functionName, timeLimitMs);
                break;
            case "cpp":
                result = await executeCpp(code, input, functionName, timeLimitMs);
                break;
            case "javascript":
            case "typescript":
            default:
                result = await executeJavaScript(code, input, functionName, timeLimitMs);
                break;
        }

        let actual: any = null;
        let passed = false;
        let error = result.error;

        if (result.success && result.output) {
            try {
                actual = JSON.parse(result.output);
                passed = JSON.stringify(actual) === JSON.stringify(expected);
            } catch {
                // If JSON parsing fails, compare as strings
                actual = result.output;
                passed = result.output === (t.output || JSON.stringify(t.expected_output));
            }
        } else if (result.error) {
            // If there was an execution error, mark as not passed
            passed = false;
            error = result.error;
        }

        if (!passed) allPassed = false;

        results.push({
            input,
            expectedOutput: expected,
            actualOutput: actual,
            logs: result.logs,
            passed,
            runtime: result.runtime,
            error
        });

        if (error === "TIME_LIMIT_EXCEEDED") break;
    }

    let verdict = "ACCEPTED";
    if (!allPassed) {
        const f = results.find(r => !r.passed);
        verdict =
            f?.error === "TIME_LIMIT_EXCEEDED"
                ? "TIME_LIMIT_EXCEEDED"
                : f?.error
                    ? "RUNTIME_ERROR"
                    : "WRONG_ANSWER";
    }

    return { results, verdict };
}

/* -------------------- FORMATTER -------------------- */

export function formatTestCaseResults(results: TestCaseResult[]): string {
    return results
        .map(
            (r, i) => `Test Case ${i + 1}: ${r.passed ? "✓ PASS" : "✗ FAIL"}
Input: ${JSON.stringify(r.input)}
Expected: ${JSON.stringify(r.expectedOutput)}
Actual: ${JSON.stringify(r.actualOutput)}
Runtime: ${r.runtime}ms
${r.error ? "Error: " + r.error : ""}`
        )
        .join("\n\n");
}
