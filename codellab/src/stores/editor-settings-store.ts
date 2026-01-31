"use client"

import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

interface CodeEditorSettingsState {
  fontSize: number
  fontFamily: string
  fontLigatures: boolean
  editorTheme: string
  dockviewTheme: string

  setFontSize: (fontSize: number) => void
  setFontFamily: (fontFamily: string) => void
  setFontLigatures: (fontLigatures: boolean) => void
  setEditorTheme: (theme: string) => void
  setDockviewTheme: (theme: string) => void
}

export const useEditorSettingStore = create<CodeEditorSettingsState>()(
  devtools(
    persist(
      (set) => ({
        fontSize: 14,
        fontFamily:
          "var(--font-jetbrains-mono), JetBrains Mono, Menlo, Consolas, monospace",
        fontLigatures: true,
        editorTheme: "vs-dark",
        dockviewTheme: "dockview-theme-replit",

        setFontSize: (fontSize) => set({ fontSize }),
        setFontFamily: (fontFamily) => set({ fontFamily }),
        setFontLigatures: (fontLigatures) => set({ fontLigatures }),
        setEditorTheme: (editorTheme) => set({ editorTheme }),
        setDockviewTheme: (dockviewTheme) => set({ dockviewTheme }),
      }),
      {
        name: "code-editor-settings", // localStorage key
        version: 1,
      }
    )
  )
)
