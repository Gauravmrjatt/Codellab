"use client"

import { useState } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Check } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import zen from "@/layouts/zen.json"
import stacked from "@/layouts/stacked.json"
import def from "@/layouts/default.json"
import split from "@/layouts/split.json"
import left from "@/layouts/left.json"
import right from "@/layouts/right.json"
import { useDockRefStore } from "@/stores/dock-ref-store"
import { useUIStore } from "@/stores/ui-store"
/* -------------------------------------------------
   Taller Preview Boxes
--------------------------------------------------*/

const Box = ({ className }: { className?: string }) => (
    <div className={cn("rounded-sm border bg-muted/40", className)} />
)

const PreviewDefault = () => (
    <div className="h-20 w-full border rounded-sm p-1 flex gap-1">
        {/* Sidebar on right */}
        <Box className="w-1/4 h-full" />
        {/* Code + Output on left */}
        <div className="w-3/4 flex flex-col gap-1 h-full">
            <Box className="flex-1 w-full bg-muted" />
            <Box className="w-full h-1/4 bg-muted" />
        </div>


    </div>
)

const PreviewSplit = () => (
    <div className="h-20 w-full border rounded-sm p-1 flex gap-1">
        <div className="w-3/4 flex flex-col gap-1 h-full">
            <Box className="flex-1 w-full bg-muted" />
            <Box className="w-full h-1/4 bg-muted" />
        </div>
        <Box className="w-1/4 h-full" />
    </div>
)


const PreviewZen = () => (
    <div className="h-20 w-full border rounded-sm p-1">
        <Box className="h-full bg-muted" />
    </div>
)

const PreviewPanelLeft = () => (
    <div className="h-20 w-full border rounded-sm p-1 flex gap-1">
        <Box className="w-2/3 h-full" />
        <Box className="w-1/3 h-full bg-muted" />
    </div>
)

const PreviewPanelRight = () => (
    <div className="h-20 w-full border rounded-sm p-1 flex gap-1">
        <Box className="w-1/3 h-full bg-muted" />
        <Box className="w-2/3 h-full" />
    </div>
)

const PreviewStacked = () => (
    <div className="h-20 w-full border rounded-sm p-1 flex flex-col gap-1">
        <Box className="h-1/2" />
        <Box className="h-1/2 bg-muted" />
    </div>
)

/* -------------------------------------------------
   Layout Data
--------------------------------------------------*/

const layouts = [
    { key: "default", label: "Default", Preview: PreviewDefault },
    { key: "split", label: "Split View", Preview: PreviewSplit },
    { key: "panelLeft", label: "Problem Left", Preview: PreviewPanelLeft },
    { key: "panelRight", label: "Problem Right", Preview: PreviewPanelRight },
    { key: "stacked", label: "Stacked", Preview: PreviewStacked },
    { key: "zen", label: "Zen Mode", Preview: PreviewZen },
]


/* -------------------------------------------------
   Component
--------------------------------------------------*/

export const LayoutPanel = ({
    animation
}: {
    animation?: any
}) => {
    const { currentLayout, setCurrentLayout } = useUIStore()
    const api = useDockRefStore();
    const handleLayoutChange = ({ key }: any) => {
        setCurrentLayout(key)
        if (key === "zen")
            api.dockviewRef?.fromJSON(zen as any)
        if(key === "default")
            api.dockviewRef?.fromJSON(def as any)
        if(key === "split")
            api.dockviewRef?.fromJSON(split as any)
        if(key === "panelLeft")
            api.dockviewRef?.fromJSON(left as any)
        if(key === "panelRight")
            api.dockviewRef?.fromJSON(right as any)
        if(key === "stacked")
            api.dockviewRef?.fromJSON(stacked as any)
    }

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <motion.div variants={animation} whileHover="hover" whileTap="tap">
                            <Button variant="ghost" className="bg-muted/70 p-1 border cursor-pointer">
                                <LayoutDashboard className="h-5 w-5" />
                            </Button>
                        </motion.div>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent className="bg-muted/50 backdrop-blur-3xl text-foreground mt-2 border">Layouts</TooltipContent>
            </Tooltip>

            <DropdownMenuContent
                side="bottom"
                align="center"
                className="grid grid-cols-2 gap-3 p-2 w-[280px]"
            >
                {layouts.map(({ key, label, Preview }) => (
                    <div
                        key={key}
                        onClick={() => handleLayoutChange({ key })}
                        className="cursor-pointer space-y-1 p-1 rounded-md hover:bg-muted/30"
                    >
                        <Preview />
                        <div className="flex items-center justify-between text-xs mt-2 font-medium">
                            <span className="text-primary/80 text-bold text-xs">{label}</span>
                            {currentLayout === key && (
                                <Check className="h-4 w-4 text-green-600" />
                            )}
                        </div>
                    </div>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
