import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import util from "util";

const execPromise = util.promisify(exec);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

/* -------------------- CONSTANTS -------------------- */

const EXECUTION_TIMEOUT_MS = 3000;
const MAX_MEMORY_MB = 128;
const TEMP_DIR = "/tmp/codellab-execution";

/* -------------------- TYPES -------------------- */

interface ExecutionResult {
    success: boolean;
    output?: string;
    logs: string[];
    error?: string;
    runtime: number;
    memory: number;
    status?: string;
}

interface ExecuteRequest {
    language: string;
    code: string;
    testInput: any[];
    functionName?: string;
    timeLimitMs?: number;
}

/* -------------------- TEMP DIR -------------------- */

(async () => {
    try {
        await fs.mkdir(TEMP_DIR, { recursive: true });
    } catch (e) {
        console.error("Temp dir error", e);
    }
})();

async function writeTempFiles(runId: string, files: Record<string, string>) {
    const dir = path.join(TEMP_DIR, runId);
    await fs.mkdir(dir, { recursive: true });
    for (const [name, content] of Object.entries(files)) {
        await fs.writeFile(path.join(dir, name), content, "utf8");
    }
    return dir;
}

async function cleanupTempFiles(runId: string) {
    await fs.rm(path.join(TEMP_DIR, runId), { recursive: true, force: true });
}

/* -------------------- DOCKER EXECUTION -------------------- */

async function executeInDocker(
    language: "javascript" | "python" | "java" | "cpp",
    runId: string,
    entryFile: string,
    timeoutMs: number
): Promise<ExecutionResult> {
    const runDir = path.join(TEMP_DIR, runId);

    let image, command;
    switch (language) {
        case "javascript":
            image = "node:20-alpine";
            command = `node /sandbox/${entryFile}`;
            break;
        case "python":
            image = "python:3.9-alpine";
            command = `python3 /sandbox/${entryFile}`;
            break;
        case "java":
            image = "openjdk:17-jdk-alpine";
            // Compile and run Java code
            command = `sh -c "javac /sandbox/${entryFile} && java -cp /sandbox Driver"`;
            break;
        case "cpp":
            image = "gcc:latest";
            // Compile and run C++ code
            command = `sh -c "cd /sandbox && g++ -std=c++17 ${entryFile} -o main && ./main"`;
            break;
        default:
            image = "node:20-alpine";
            command = `node /sandbox/${entryFile}`;
    }

    const containerName = `exec-${runId}`;

    const dockerCmd = `docker run --rm \
        --network none \
        --memory ${MAX_MEMORY_MB}m \
        --cpus 0.5 \
        --pids-limit 64 \
        -v "${runDir}":/sandbox \
        -w /sandbox \
        --name ${containerName} \
        ${image} \
        ${command}`;

    const startTime = Date.now();

    const dockerPromise = execPromise(dockerCmd);

    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("EXECUTION_TIMEOUT")), timeoutMs)
    );

    try {
        const { stdout, stderr } = await Promise.race([
            dockerPromise,
            timeoutPromise
        ]);

        return {
            success: true,
            status: "ACCEPTED",
            output: stdout.trim(),
            logs: stderr ? stderr.split("\n") : [],
            runtime: Date.now() - startTime,
            memory: 0
        };
    } catch (err: any) {
        const isTimeout = err?.message === "EXECUTION_TIMEOUT";

        if (isTimeout) {
            await execPromise(`docker kill ${containerName}`).catch(() => { });
        }

        return {
            success: false,
            status: isTimeout ? "TIME_LIMIT_EXCEEDED" : "RUNTIME_ERROR",
            logs: err?.stderr ? err.stderr.split("\n") : [],
            runtime: isTimeout ? timeoutMs : Date.now() - startTime,
            memory: 0
        };
    }
}

/* -------------------- LANGUAGE WRAPPERS -------------------- */

async function executeJavaScript(
    code: string,
    testInput: any[],
    functionName: string = 'solve',
    timeoutMs = EXECUTION_TIMEOUT_MS
): Promise<ExecutionResult> {
    const runId = crypto.randomUUID();

    // Sanitize the function name to prevent injection
    const sanitizedFunctionName = functionName.replace(/[^a-zA-Z0-9_$]/g, '');

    const driver = `
process.on("uncaughtException", e => {
    console.error(e.message);
    process.exit(1);
});

${code}

try {
    const inputData = ${JSON.stringify(testInput)};

    // Safely access the function by name
    if (typeof global['${sanitizedFunctionName}'] === 'function') {
        const result = global['${sanitizedFunctionName}'](...inputData);
        console.log(JSON.stringify(result));
    } else if (typeof ${sanitizedFunctionName} === 'function') {
        const result = ${sanitizedFunctionName}(...inputData);
        console.log(JSON.stringify(result));
    } else {
        throw new Error("Function '${sanitizedFunctionName}' not found in the submitted code");
    }
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
`;
    try {
        await writeTempFiles(runId, { "run.js": driver });
        return await executeInDocker("javascript", runId, "run.js", timeoutMs);
    } finally {
        await cleanupTempFiles(runId);
    }
}

async function executePython(
    code: string,
    testInput: any[],
    functionName: string = 'solve',
    timeoutMs = EXECUTION_TIMEOUT_MS
): Promise<ExecutionResult> {
    const runId = crypto.randomUUID();

    const driver = `
import json, sys

${code}

try:
    data = json.loads('${JSON.stringify(testInput)}')

    # Try to call the specific function by name
    if '${functionName}' in globals():
        fn = globals()['${functionName}']
        res = fn(*data) if isinstance(data, list) else fn(data)
        print(json.dumps(res))
    else:
        raise Exception("Function '${functionName}' not found in the submitted code")

except Exception as e:
    sys.stderr.write(str(e))
    sys.exit(1)
`;

    try {
        await writeTempFiles(runId, { "run.py": driver });
        return await executeInDocker("python", runId, "run.py", timeoutMs);
    } finally {
        await cleanupTempFiles(runId);
    }
}

async function executeJava(
    code: string,
    testInput: any[],
    functionName: string = 'solve',
    timeoutMs = EXECUTION_TIMEOUT_MS
): Promise<ExecutionResult> {
    const runId = crypto.randomUUID();

    // Extract class name from the code
    const classNameMatch = code.match(/public\s+class\s+(\w+)/);
    const className = classNameMatch ? classNameMatch[1] : 'Solution';

    // Create a wrapper that takes input from stdin and calls the solution
    const driver = `${code}

import java.io.*;
import java.util.*;

public class Driver {
    public static void main(String[] args) throws IOException {
        try {
            // Pass the test input directly instead of reading from stdin
            Object[] inputData = ${JSON.stringify(testInput)}.toArray();

            // Create an instance of the solution class
            ${className} solution = new ${className}();

            // Call the specific function by name using reflection
            Object result = callSolutionMethodByName(solution, "${functionName}", inputData);

            // Print the result
            System.out.println(formatOutput(result));
        } catch (Exception e) {
            System.err.println("ERROR: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    // Method to call a specific method by name using reflection
    private static Object callSolutionMethodByName(${className} solution, String methodName, Object[] params) {
        Class<?>[] paramTypes = new Class[params.length];
        for (int i = 0; i < params.length; i++) {
            paramTypes[i] = params[i].getClass();
        }

        try {
            // Try to find the method with exact parameter types
            java.lang.reflect.Method method = solution.getClass().getMethod(methodName, paramTypes);
            return method.invoke(solution, params);
        } catch (NoSuchMethodException e) {
            // If exact match fails, try to find with generic Object[] parameters
            try {
                java.lang.reflect.Method method = solution.getClass().getMethod(methodName, Object[].class);
                return method.invoke(solution, (Object)params);
            } catch (Exception ex) {
                // If that also fails, try with Object parameters
                try {
                    java.lang.reflect.Method method = solution.getClass().getMethod(methodName, Object.class);
                    return method.invoke(solution, params.length > 0 ? params[0] : null);
                } catch (Exception ex2) {
                    throw new RuntimeException("Could not call method '" + methodName + "': " + ex2.getMessage());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Could not call method '" + methodName + "': " + e.getMessage());
        }
    }

    // Format output appropriately
    private static String formatOutput(Object result) {
        if (result == null) {
            return "null";
        } else if (result instanceof int[]) {
            return java.util.Arrays.toString((int[]) result);
        } else if (result instanceof double[]) {
            return java.util.Arrays.toString((double[]) result);
        } else if (result instanceof char[]) {
            return new String((char[]) result);
        } else if (result instanceof Object[]) {
            return java.util.Arrays.toString((Object[]) result);
        } else if (result instanceof List) {
            return ((List<?>) result).toString();
        } else if (result instanceof Map) {
            return ((Map<?, ?>) result).toString();
        } else {
            return String.valueOf(result);
        }
    }
}
`;

    try {
        await writeTempFiles(runId, { "Driver.java": driver });
        return await executeInDocker("java", runId, "Driver.java", timeoutMs);
    } finally {
        await cleanupTempFiles(runId);
    }
}

async function executeCpp(
    code: string,
    testInput: any[],
    functionName: string = 'solve',
    timeoutMs = EXECUTION_TIMEOUT_MS
): Promise<ExecutionResult> {
    const runId = crypto.randomUUID();

    // Convert testInput to C++ compatible format
    const cppArgs = testInput.map(arg => {
        if (typeof arg === 'string') {
            return `"${arg}"`;
        } else if (Array.isArray(arg)) {
            // For arrays, we'll need to handle differently based on type
            if (arg.length > 0 && typeof arg[0] === 'number') {
                // Numeric array
                return `{${arg.join(', ')}}`;
            } else if (arg.length > 0 && typeof arg[0] === 'string') {
                // String array
                return `{${arg.map(s => `"${s}"`).join(', ')}}`;
            } else {
                return `{${arg.join(', ')}}`;
            }
        } else {
            return arg;
        }
    }).join(', ');

    const driver = `#include <iostream>
#include <vector>
#include <string>
#include <sstream>

${code}

int main() {
    try {
        // Call the function with the test inputs
        auto result = ${functionName}(${cppArgs});

        // Print the result
        std::cout << result << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "ERROR: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}
`;

    try {
        await writeTempFiles(runId, { "main.cpp": driver });
        return await executeInDocker("cpp", runId, "main.cpp", timeoutMs);
    } finally {
        await cleanupTempFiles(runId);
    }
}


/* -------------------- ROUTE HANDLER -------------------- */

app.post("/execute", async (req, res) => {
    try {
        const { language, code, testInput, functionName, timeLimitMs } = req.body as ExecuteRequest;

        if (!language || !code || !testInput) {
            res.status(400).json({ error: "Missing required fields: language, code, testInput" });
            return;
        }

        let result: ExecutionResult;

        switch (language.toLowerCase()) {
            case "javascript":
            case "typescript": // Treat TS as JS for now or add specific handler if needed
                result = await executeJavaScript(code, testInput, functionName, timeLimitMs);
                break;
            case "python":
                result = await executePython(code, testInput, functionName, timeLimitMs);
                break;
            case "java":
                result = await executeJava(code, testInput, functionName, timeLimitMs);
                break;
            case "cpp":
                result = await executeCpp(code, testInput, functionName, timeLimitMs);
                break;
            default:
                res.status(400).json({ error: `Unsupported language: ${language}` });
                return;
        }

        res.json(result);

    } catch (error: any) {
        console.error("Execution error:", error);
        res.status(500).json({ 
            success: false, 
            error: "Internal server error", 
            logs: [error.message] 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Judge service running on port ${PORT}`);
});
