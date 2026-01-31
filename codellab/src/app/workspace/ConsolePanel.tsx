// ────────────────────────────────────────────────────────────────
// ConsolePanel.tsx
// ────────────────────────────────────────────────────────────────
import { useCodeEditorStore } from "@/stores/code-editor-store"
export function ConsolePanel() {
  const { isRunning: storeIsRunning, logs: storeLogs , heading} = useCodeEditorStore()
  return (
    <div className=" h-full overflow-auto p-6 font-mono text-sm rounded-xl">
      {storeIsRunning || storeIsRunning  || heading === "running" ? (
        <div className="">
          <h1 className="text-2xl font-semibold mb-4 animate-pulse bg-primary/10 h-8 w-1/2 rounded"></h1>
          <div className="whitespace-pre-wrap animate-pulse bg-primary/10 h-32 w-full rounded"></div>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-semibold mb-4">
            {heading || "Console"}
          </h1>
          <div className="whitespace-pre-wrap">
            {storeLogs || "No console output yet."}
          </div>
        </>
      )}
    </div>
  );
}
