// stores/code-editor-store.ts
"use client"

import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { ReactNode } from "react"

interface TestCaseResult {
  input: any;
  expectedOutput: any;
  actualOutput: any;
  passed: boolean;
  runtime: number;
  error?: string;
  logs?: string[]
}

interface CodeEditorState {
  code: string
  language: string
  output: string | ReactNode
  logs: string | ReactNode
  heading: string | ReactNode
  isRunning: boolean
  roomId?: string
  questionId?: string
  testCaseResults?: TestCaseResult[]

  setCode: (code: string) => void
  setLanguage: (lang: string) => void
  setOutput: (output: string | ReactNode) => void
  setLogs: (logs: string | ReactNode) => void
  setHeading: (heading: string | ReactNode) => void
  setIsRunning: (running: boolean) => void
  setRoomId: (id?: string) => void
  setQuestionId: (id?: string) => void
  setTestCaseResults: (results: TestCaseResult[]) => void
  reset: () => void
  init: (initialCode: string, initialLanguage: string, force?: boolean) => void
}

export const useCodeEditorStore = create<CodeEditorState>()(
  devtools(
    // persist(
      (set, get) => ({
        code: "",
        language: "javascript",
        output: "",
        logs: "",
        heading: "CodeLab",
        isRunning: false,
        roomId: undefined,
        questionId: undefined,

        setCode: (code) => set({ code }),
        setLanguage: (language) => set({ language }),
        setOutput: (output) => set({ output }),
        setLogs: (logs) => set({ logs }),
        setHeading: (heading) => set({ heading }),
        setIsRunning: (isRunning) => set({ isRunning }),
        setRoomId: (roomId) => set({ roomId }),
        setQuestionId: (questionId) => set({ questionId }),
        setTestCaseResults: (testCaseResults) => set({ testCaseResults }),

        init: (initialCode, initialLanguage, force = false) => {
          if (force || (get().code === "" && get().language === "javascript")) {
            set({
              code: initialCode,
              language: initialLanguage,
            })
          }
        },

        reset: () =>
          set({
            code: "",
            language: "javascript",
            output: "",
            logs: "",
            heading: "CodeLab",
            isRunning: false,
            roomId: undefined,
            questionId: undefined,
            testCaseResults: undefined,
          }),
      }),
      // {
      //   name: "code-editor-store",

      //   // ✅ ONLY persist serializable state
      //   partialize: (state) => ({
      //     code: state.code,
      //     language: state.language,
      //     roomId: state.roomId,
      //     questionId: state.questionId,
      //   }),
      // }
    // ),
    // { name: "CodeEditorStore" }
  )
)
