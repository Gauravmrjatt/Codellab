"use client"
import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { DockviewApi } from "dockview"
interface DockRefStore {
    dockviewRef: DockviewApi | null
    setDockviewRef: (ref: DockviewApi | null) => void
}
export const useDockRefStore = create<DockRefStore>()(
    devtools(
        (set, get) => ({
            dockviewRef: null,
            setDockviewRef: (ref: DockviewApi | null) => set({ dockviewRef: ref }),
        }), {
            name: "dock-ref-store"
        }
    )
)