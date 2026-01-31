// ────────────────────────────────────────────────────────────────
// OutputPanel.tsx
// ────────────────────────────────────────────────────────────────
import { ReactNode } from "react"

import { useCodeEditorStore } from "@/stores/code-editor-store"
export function OutputPanel() {
  const { isRunning: storeIsRunning, output: storeOutput , heading} = useCodeEditorStore()
  return (
   <div className=" h-full overflow-auto p-6 font-mono text-sm rounded-xl">
      {storeIsRunning ||  heading === "running" ?  (  
        <div className="">
          <h1 className="text-2xl font-semibold mb-4 animate-pulse bg-primary/10 h-8 w-1/2 rounded"></h1>
          <div className="whitespace-pre-wrap animate-pulse bg-primary/10 h-32 w-full rounded"></div>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-semibold mb-4">
            {heading || "Output"}
          </h1>
          <div className="whitespace-pre-wrap">
            {storeOutput || "No output yet."}
          </div>
        </> 
      )}
    </div>
  );
}