import { useCodeEditorStore } from "@/stores/code-editor-store"

export const useExecutionState = () => {
  const { setHeading, setOutput, setLogs } = useCodeEditorStore()

  const applyExecutionState = (
    status: "running" | "accepted" | "ACCEPTED" | "error" | "WRONG_ANSWER" | "RUNTIME_ERROR" | "TIME_LIMIT_EXCEEDED",
    output: string = "",
    logs: string = ""
  ) => {
    // Heading
    if (status === "running") {
      setHeading("running")
    } else if (status.toUpperCase() === "accepted" || status === "ACCEPTED" ) {
      setHeading(<span className="text-green-500">Accepted</span>)
    } else {
      setHeading(<span className="text-red-500">{status ?? "Error"}</span>)
    }

    // Output
    setOutput(
      <div
        className={`p-3 rounded-md whitespace-pre-wrap ${status === "error" || status === "WRONG_ANSWER" || status === "TIME_LIMIT_EXCEEDED" || status === "RUNTIME_ERROR" 
            ? "text-red-500 bg-red-500/10"
            : "bg-primary/10"
          }`}
      >
        {output || (status === "running" ? "Running..." : "No output")}
      </div>
    )

    // Logs
    setLogs(
      <div
        className={`p-3 rounded-md font-mono text-sm whitespace-pre-wrap ${status === "error" || status === "WRONG_ANSWER" || status === "TIME_LIMIT_EXCEEDED" || status === "RUNTIME_ERROR" 
            ? "text-red-500 bg-red-500/10"
            : "bg-primary/10"
          }`}
      >
        {logs || "No console output."}
      </div>
    )
  }

  return { applyExecutionState }
}
