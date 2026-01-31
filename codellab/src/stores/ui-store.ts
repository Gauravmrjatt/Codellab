"use client"

import { create } from "zustand"
import { persist, devtools } from "zustand/middleware"

type LayoutKey = "default" | "split" | "zen" | "panelLeft" | "panelRight" | "stacked"

interface UIState {
  settingsOpen: boolean
  sidebarWidth: number
  currentLayout: LayoutKey
  setSettingsOpen: (v: boolean) => void
  setSidebarWidth: (v: number) => void
  setCurrentLayout: (layout: LayoutKey) => void
}

export const useUIStore = create<UIState>()(
  devtools(persist(
    (set) => ({
      currentLayout: "default",
      settingsOpen: false,
      sidebarWidth: 170,
      setCurrentLayout: (layout) => set({ currentLayout: layout }),
      setSettingsOpen: (v) => set({ settingsOpen: v }),
      setSidebarWidth: (v) => set({ sidebarWidth: v }),
    }),
    {
      name: "ui-store",
      partialize: (state) => ({ currentLayout: state.currentLayout }) // optional
    }
  )
))