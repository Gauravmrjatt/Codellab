"use client"
import { useEffect, useRef, useState } from "react"
import { useCodeEditorStore } from "@/stores/code-editor-store"
import { useDockRefStore } from "@/stores/dock-ref-store"
import { toast } from "sonner"
import { useWS } from "@/context/WebSocketProvider"

import { useExecutionState } from "@/hooks/applyExecutionState";

// Default templates as fallback
export const templates = {
  javascript:
    "// Welcome to CodeLab!\nfunction solution() {\n // Your solution here\n return \"Hello, World!\";\n}\n\nconsole.log(solution());",
  typescript:
    "// Welcome to CodeLab!\n// Start coding here...\n\nfunction solution(): string {\n // Your solution here\n return \"Hello, World!\";\n}\n\nconsole.log(solution());",
  python:
    "# Welcome to CodeLab!\n# Start coding here...\n\ndef solution():\n # Your solution here\n return \"Hello, World!\"\n\nprint(solution())",
  java:
    "public class Solution {\n public static String solution() {\n // Your solution here\n return \"Hello, World!\";\n }\n \n public static void main(String[] args) {\n System.out.println(solution());\n }\n}",
  cpp:
    "#include <iostream>\n#include <string>\n\nstd::string solution() {\n // Your solution here\n return \"Hello, World!\";\n}\n\nint main() {\n std::cout << solution() << std::endl;\n return 0;\n}",
}

export function useCodeCoordinator({
  roomId,
  questionId,
  initialCode = templates.javascript,
  initialLanguage = "javascript",
  onCodeChange,
  onRun,
  onCursorMove,
}: {
  roomId?: string
  questionId?: string
  initialCode?: string
  initialLanguage?: string
  onCodeChange?: (code: string) => void
  onRun?: (code: string) => void
  onCursorMove?: (position: { x: number; y: number }) => void
}) {
  const {
    code,
    language: currentLanguage,
    output,
    logs,
    heading,
    isRunning,
    setCode,
    setLanguage,
    setIsRunning,
    setRoomId,
    setQuestionId,
    setTestCaseResults,
    reset,
  } = useCodeEditorStore()
  const { applyExecutionState } = useExecutionState()
  const { dockviewRef } = useDockRefStore()

  const [defaultCode, setDefaultCode] = useState(initialCode || templates[initialLanguage as keyof typeof templates] || templates.javascript)

  const {
    sendCodeChange,
    participants,
    cursors,
    editingUsers,
    sendCursorPosition,
    notifyEditing,
    sendOutput
  } = useWS()

  const eventBuffer = useRef<any[]>([])
  const lastEventTime = useRef<number>(Date.now())
  const lastCursorUpdate = useRef<number>(0)
  const lastEditNotification = useRef<number>(0)
  const isEditingRef = useRef<boolean>(false)

  // Reset and initialize store when context changes
  useEffect(() => {
    const store = useCodeEditorStore.getState()
    if ((roomId && store.roomId !== roomId) || (questionId && store.questionId !== questionId)) {
      reset()
      if (roomId) setRoomId(roomId)
      if (questionId) setQuestionId(questionId)
    } else {
      // Ensure IDs are set even if no reset needed (e.g. hydration)
      if (roomId && !store.roomId) setRoomId(roomId)
      if (questionId && !store.questionId) setQuestionId(questionId)
    }
  }, [roomId, questionId, reset, setRoomId, setQuestionId])

  useEffect(() => {
    // If we have a questionId, fetch the default code for that question
    if (questionId) {
      const load = async () => {
        try {
          const res = await fetch(`/api/questions/${questionId}/default-code?lang=${currentLanguage}&autoGenerate=true`);
          if (!res.ok) throw new Error("Failed to load default");
          const data = await res.json();
          setDefaultCode(data.code)
        } catch (e) {
          return null;
        } finally {
        }
      };
      load();
    } else {
      if (initialCode) {
        setDefaultCode(initialCode);
      } else if (initialLanguage) {
        setDefaultCode(templates[initialLanguage as keyof typeof templates] || templates.javascript)
      }
    }
  }, [questionId, initialCode, initialLanguage, currentLanguage])

  // used to detect for paste cheating
  const recordChange = (newCode: string) => {
    const now = Date.now()
    const deltaLength = Math.abs(newCode.length - code.length)

    // Determine if this is likely a paste event based on character change amount
    const isPaste = deltaLength > 10

    eventBuffer.current.push({
      type: isPaste ? "PASTE" : "KEYSTROKE",
      deltaLength,
      timestamp: new Date(now).toISOString(),
      metadata: {
        interval: now - lastEventTime.current,
        totalLength: newCode.length,
      },
    })

    lastEventTime.current = now
  }

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || ""
    recordChange(newCode)

    // Debounced editor:active notification
    // Only notify once when editing starts, then throttle to once per 2 seconds
    const now = Date.now()
    if (!isEditingRef.current || now - lastEditNotification.current > 2000) {
      if (roomId) {
        notifyEditing("main")
        lastEditNotification.current = now
        isEditingRef.current = true

        // Reset editing state after 3 seconds of inactivity
        setTimeout(() => {
          isEditingRef.current = false
        }, 3000)
      }
    }

    sendCodeChange("main", [
      {
        type: "replace",
        content: newCode,
        timestamp: Date.now(),
        currentLanguage
      },
    ])
    setCode(newCode)
    onCodeChange?.(newCode)
  }

  const handleRun = async () => {
    let activePanel: "output" | "console" | "test-cases" = questionId ? "test-cases" : "output"

    // ---- RUNNING ----
    setIsRunning(true)
    applyExecutionState("running")
    sendOutput("", "", "running", true)

    try {
      const response = await fetch("/api/judge/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: currentLanguage,
          questionId: questionId || null, // Pass null if no questionId
          roomId,
          events: eventBuffer.current,
          mode: "run", // Explicitly set mode to run
        }),
      })

      const result = await response.json()

      const logsString = Array.isArray(result.logs)
        ? result.logs.join("\n")
        : String(result.logs || "")
      const cleanedLogs = logsString
        .replace(/^[^\n]*:\d+\n/, "")
        .trim()

      // ---- ERROR ----
      if (!response.ok || result.success !== true) {
        // Determine which panel to activate based on whether we have a question
        activePanel = questionId ? "test-cases" : "console";

        applyExecutionState(
          result.status,
          "Failed to execute",
          cleanedLogs || result.error || "Compile / Runtime Error"
        )

        sendOutput(
          "",
          cleanedLogs || result.status || "Compile / Runtime Error",
          result.status,
          false,
          activePanel
        )

        return
      }

      // Check if we have detailed test case results
      if (questionId && result.results && Array.isArray(result.results)) {

        // Apply execution state with formatted output
        applyExecutionState(
          result.verdict || result.status || "ERROR",
          result.output,
          cleanedLogs
        );

        // Set detailed test case results in the store for the test cases panel
        setTestCaseResults(result.results);

        // Send detailed test case results to the output panel
        sendOutput(result.output, cleanedLogs, result.verdict || result.status || "ERROR", false, "test-cases");

        // The test cases panel will automatically update through the store state
        // since it subscribes to testCaseResults from useCodeEditorStore
      } else {
        // ---- ACCEPTED ---- (for non-test case runs or when no questionId)
        console.log("this is runit")
        applyExecutionState(result.verdict || result.status || "ERROR", result.output, cleanedLogs)

        // Clear test case results for non-question runs
        setTestCaseResults([]);

        // Determine which panel to send output to based on whether we have a question
        const targetPanel = questionId ? "test-cases" : "output";

        sendOutput(result.output, cleanedLogs, result.verdict === "ACCEPTED" ? "accepted" : result.status || "ERROR", false, targetPanel)
      }

      eventBuffer.current = []
    } catch (error: any) {
      // Determine which panel to activate based on whether we have a question
      activePanel = questionId ? "test-cases" : "console";

      applyExecutionState(
        "error",
        "Execution failed",
        error.message || "Network error"
      )

      sendOutput("", error.message || "Network error", "error", false, activePanel)
    } finally {
      setIsRunning(false)

      // Activate the appropriate panel after running
      const outputPanel = dockviewRef?.getPanel(activePanel);
      if (outputPanel) {
        outputPanel.api.setActive();

        if (outputPanel.api.height < 100) {
          outputPanel.api.setSize({ height: 300 })
        }
      }

      // The test cases panel will automatically update through the store state
      // since it subscribes to testCaseResults from useCodeEditorStore

      onRun?.(code)
    }
  }


  const handleLanguageChange = async (newLanguage: string) => {
    setLanguage(newLanguage);

    let newCode = templates[newLanguage as keyof typeof templates] || templates.javascript;

    // If we have a questionId, fetch the default code for that question in the new language
    if (questionId) {
      try {
        // Enable auto-generation of starter code from test cases
        const res = await fetch(`/api/questions/${questionId}/default-code?lang=${newLanguage}&autoGenerate=true`);
        if (!res.ok) throw new Error("Failed to load default");

        const data = await res.json();
        newCode = data.code
      } catch (error) {
        console.error(`Error fetching default code for language ${newLanguage}:`, error);
        // Fallback to template if default code fails to load
        newCode = templates[newLanguage as keyof typeof templates] || templates.javascript;
      }
    }

    setCode(newCode);
    sendCodeChange("main", [
      {
        type: "replace",
        content: newCode,
        timestamp: Date.now(),
        currentLanguage: newLanguage
      },
    ]);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    toast.success("Code copied to clipboard")
  }

  const handleReset = async () => {
    let resetCode: string;

    if (questionId) {
      try {
        const res = await fetch(`/api/questions/${questionId}/default-code?lang=${currentLanguage}&autoGenerate=true`);
        if (!res.ok) throw new Error("Failed to load default");

        const data = await res.json();
        resetCode = data.code
      } catch (e) {
        resetCode = templates[currentLanguage as keyof typeof templates] || "";
        resetCode = templates[currentLanguage as keyof typeof templates] || templates.javascript;
      } finally {
      }
    } else {
      // If no questionId, use local template
      resetCode = templates[currentLanguage as keyof typeof templates] || templates.javascript;
    }

    setCode(resetCode);
    sendCodeChange("main", [
      {
        type: "replace",
        content: resetCode,
        timestamp: Date.now(),
        currentLanguage
      },
    ]);
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `code.${currentLanguage}`
    a.click()
    URL.revokeObjectURL(url)
  }

  // const handleCursorMove = (e: React.MouseEvent) => {
  //   const now = Date.now()
  //   if (now - lastCursorUpdate.current > 50) {
  //     onCursorMove?.({ x: e.clientX, y: e.clientY })
  //     sendCursorPosition({ x: e.clientX, y: e.clientY })  
  //     lastCursorUpdate.current = now
  //   }
  // }

  const handleSubmitSolution = async () => {
    if (!questionId) {
      // If no questionId, we can't submit to judge, so just show a message
      toast.warning("Cannot submit solution without a problem to solve. Try running the code instead.");

      // Run the code instead
      await handleRun();
      return;
    }

    setIsRunning(true)
    applyExecutionState("running", "Submitting solution...", "")

    // Show running state in output panel
    sendOutput("", "Submitting solution...", "running", true, "test-cases")

    try {
      const response = await fetch("/api/judge/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: currentLanguage,
          questionId,
          roomId,
          events: eventBuffer.current,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.error || "Failed to submit solution";
        applyExecutionState(
          "error",
          "Submission failed",
          errorMessage
        );

        // Send error to test cases panel
        sendOutput("", errorMessage, "error", false, "test-cases");

        return
      }

      // Success
      const submissionMessage = `Solution submitted successfully! Passed: ${result.passedTests}/${result.totalTests} test cases`;
      applyExecutionState("accepted", submissionMessage, `Verdict: ${result.verdict}`);

      // Send success message to test cases panel
      sendOutput(submissionMessage, `Verdict: ${result.verdict}`, "accepted", false, "test-cases");

      // Set detailed test case results in the store for the test cases panel
      setTestCaseResults(result.results || []);

      // The test cases panel will automatically update through the store state
      // since it subscribes to testCaseResults from useCodeEditorStore

      // Optionally navigate away or show success modal
      console.log("Solution submitted successfully:", result)
      const panel = dockviewRef?.getPanel("submission");

      if (panel) {
        panel.api.updateParameters({
          type: "submission",
          forType: "submit",
          ...result,
        });
      } else {
        dockviewRef?.addPanel({
          id: "submission",
          tabComponent: "default",
          component: "sidebar",
          title: "Submission",
          minimumHeight: 45,
          minimumWidth: 500,
          initialHeight: 500,
          initialWidth: 500,
          position: {
            referencePanel: "files",
            direction: "within",
          },
          params: {
            type: "submission",
            forType: "submit",
            ...result,
          },
        });
      }
      panel?.api.setActive()
    } catch (error: any) {
      const errorMessage = error.message || "Network error occurred";
      applyExecutionState(
        "error",
        "Submission failed",
        errorMessage
      );

      // Send error to test cases panel
      sendOutput("", errorMessage, "error", false, "test-cases");
    } finally {
      setIsRunning(false)

      // Activate the test cases panel after submission
      const outputPanel = dockviewRef?.getPanel("test-cases");
      if (outputPanel) {
        outputPanel.api.setActive();

        if (outputPanel.api.height < 100) {
          outputPanel.api.setSize({ height: 300 })
        }
      }
    }
  }

  return {
    code,
    output,
    logs,
    heading,
    isRunning,
    currentLanguage,
    participants,
    cursors,
    editingUsers,
    defaultCode,
    handleEditorChange,
    handleRun,
    handleLanguageChange,
    handleCopy,
    handleDownload,
    // handleCursorMove,
    handleReset,
    handleSubmitSolution,
    sendCursorPosition
  }
}