'use client'

import { motion, Variants } from 'framer-motion'
import { Code2, Play, CloudUpload, UserRoundPlus, Timer, StickyNote, Brush } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { useCodeCoordinator } from '@/hooks/useCodeCoordinator'
import { Spinner } from '@/components/ui/spinner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import useKeyboardShortcut from 'use-keyboard-shortcut'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { SettingsDialog } from '@/components/header/setting'
import { LayoutPanel } from '@/components/header/dock-layout'
import { useDockRefStore } from '@/stores/dock-ref-store'
import { useWS } from '@/context/WebSocketProvider'
import { TimerPopover } from '@/components/timer/timer-popover'

export const microButton: Variants = {
  hover: {
    scale: 1.04,
    y: -1.2,
    transition: {
      type: "spring" as const,
      stiffness: 450,
      damping: 25,
    },
  },
  tap: {
    scale: 0.96,
    transition: {
      type: "spring" as const,
      stiffness: 600,
      damping: 18,
    },
  },
}

export const iconMicro: Variants = {
  hover: {
    scale: 1.18,
    y: -1.8,
  },
  tap: {
    scale: 0.9,
  },
}

interface EditorHeaderProps {
  roomId?: string;
  roomName?: string;
}

export function EditorHeader({ roomId = "default-room", roomName = "Editor" }: EditorHeaderProps) {
  const { isRunning, handleRun, handleSubmitSolution } = useCodeCoordinator({ roomId })
  const dockview = useDockRefStore()
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform)

  useKeyboardShortcut(isMac ? ["Meta", "'"] : ["Ctrl", "'"], handleRun, {
    overrideSystem: false,
    ignoreInputFields: false,
    repeatOnHold: false,
  })

  // Get user info from WebSocket context
  const { userId, username } = useWS()

  // Generate consistent user color
  const getUserColor = (userId: string) => {
    const colors = [
      "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b",
      "#ec4899", "#6366f1", "#14b8a6", "#f97316"
    ]
    if (!userId || userId.length === 0) return colors[0]
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const handleNotes = () => {
    const panel = dockview.dockviewRef?.getPanel("note")
    if (panel) {
      panel?.api.setActive()
      if (panel.api.height < 100) { panel.api.setSize({ height: 300 }) }
    }
    else {
      dockview.dockviewRef?.addPanel({
        tabComponent: "default",
        id: "note",
        component: "sidebar",
        title: "Notes",
        minimumHeight: 45,
        initialWidth: 45,
        minimumWidth: 500,
        initialHeight: 500,
        position: { referencePanel: "files", direction: "within" },
        params: {
          type: "note",
          roomId,
          currentUserId: userId,
          currentUsername: username,
          userColor: getUserColor(userId || ""),
        }
      });
    }
  }
  const handleWhiteboard = () => {
    const panel = dockview.dockviewRef?.getPanel("whiteboard")
    if (panel) {
      panel?.api.setActive()
      if (panel.api.height < 100) { panel.api.setSize({ height: 300 }) }
    }
    else {
      dockview.dockviewRef?.addPanel({
        tabComponent: "default",
        id: "whiteboard",
        component: "sidebar",
        title: "Whiteboard",
        minimumHeight: 45,
        initialWidth: 45,
        minimumWidth: 500,
        initialHeight: 500,
        position: { referencePanel: "files", direction: "within" },
        params: {
          type: "whiteboard"
        }
      });
    }
  }
  return (
    <header className="w-full dark:bg-[#222427] bg-[#ECEFF2]">
      <div className="flex h-13 items-center justify-between px-4 pt-2 md:px-6">

        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-orange-500/10 p-1.5">
            <Code2 className="h-5 w-5 text-orange-500" />
          </div>
          <span className="font-medium text-sm text-bold  text-primary/85 tracking-tight truncate max-w-[180px] md:max-w-[240px]">
            {roomName}
          </span>
        </div>

        {/* Center */}
        <div className="flex items-center gap-4">
          {isRunning ? (
            <motion.div variants={microButton} whileHover="hover" whileTap="tap">
              <Button
                disabled
                variant="secondary"
                size="sm"
                className="min-w-[130px] gap-2 bg-primary/8 text-primary disabled:cursor-none"
              >
                <Spinner className="h-4 w-4 animate-spin" />
                Pending...
              </Button>
            </motion.div>
          ) : (
            <ButtonGroup className="gap-0 cursor-pointer">
              {/* Run */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div variants={microButton} whileHover="hover" whileTap="tap">
                    <Button
                      onClick={handleRun}
                      variant="secondary"
                      size="icon-lg"
                      className="rounded-r-none border-(--border-color) border-dashed border-r-2 p-2.5 bg-(--group-color)  cursor-pointer"
                    >
                      <motion.div variants={iconMicro} whileHover="hover" whileTap="tap">
                        <Play className="h-4.5 text-green-600 dark:text-green-500" />
                      </motion.div>
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent className="bg-muted/50 backdrop-blur-3xl text-muted-foreground mt-2 border">
                  <KbdGroup>
                    <Kbd>Run</Kbd>
                    <Kbd className="text-md border py-3 text-primary">{isMac ? '⌘' : 'Ctrl'}</Kbd>
                    <Kbd className="text-md border py-3">'</Kbd>
                  </KbdGroup>
                </TooltipContent>
              </Tooltip>

              {/* Submit */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div variants={microButton} whileHover="hover" whileTap="tap">
                    <Button
                      onClick={handleSubmitSolution}
                      variant="secondary"
                      size="lg"
                      className="rounded-l-none bg-(--group-color) px-4 gap-2  cursor-pointer"
                    >
                      <CloudUpload className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-500" />
                      <span className="text-sm font-medium">Submit</span>
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent className='bg-muted/50 backdrop-blur-3xl text-muted-foreground mt-2 border'>
                  <KbdGroup>
                    <Kbd>Submit</Kbd>
                    <Kbd className="text-md border py-3 text-primary">{isMac ? '⌘' : 'Ctrl'}</Kbd>
                    <Kbd className="text-md border py-3">⏎</Kbd>
                  </KbdGroup>
                </TooltipContent>
              </Tooltip>
            </ButtonGroup>
          )}
          <div className='flex gap-1'>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div variants={microButton} whileHover="hover" whileTap="tap">
                  <Button
                    onClick={handleNotes}
                    variant="secondary"
                    size="icon-lg"
                    className="border border-muted/50 p-2.5 bg-(--group-color)  cursor-pointer"
                  >
                    <motion.div variants={iconMicro} whileHover="hover" whileTap="tap">
                      <StickyNote className="h-4.5 text-[#FFB700] " />
                    </motion.div>
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className="bg-muted/50 backdrop-blur-3xl text-muted-foreground mt-2 border">
                Notes
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div variants={microButton} whileHover="hover" whileTap="tap">
                  <Button
                    onClick={handleWhiteboard}
                    variant="secondary"
                    size="icon-lg"
                    className="border border-muted/50 p-2.5 bg-(--group-color)  cursor-pointer"
                  >
                    <motion.div variants={iconMicro} whileHover="hover" whileTap="tap">
                      <Brush className="h-4.5 text-[#b760e6] " />
                    </motion.div>
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className="bg-muted/50 backdrop-blur-3xl text-muted-foreground mt-2 border">
                Whiteboard
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-1">

            {/* Layout */}
            <Tooltip>
              <TooltipTrigger asChild>
                <LayoutPanel animation={microButton} />
              </TooltipTrigger>
              <TooltipContent className='bg-muted/50 backdrop-blur-3xl text-foreground mt-2 border'>Dashboard</TooltipContent>
            </Tooltip>

            {/* Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div variants={microButton} whileHover="hover" whileTap="tap">
                  <SettingsDialog />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className='bg-muted/50 backdrop-blur-3xl text-foreground mt-2 border'>Settings</TooltipContent>
            </Tooltip>

          </div>

          {/* Invite / Timer */}
          <ButtonGroup className="gap-0 hidden sm:flex">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div variants={microButton} whileHover="hover" whileTap="tap">
                  <Button variant="secondary" className="rounded-r-none p-2.5 bg-(--group-color) cursor-pointer">
                    <UserRoundPlus className="h-4.5 w-4.5" />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className='bg-muted/50 backdrop-blur-3xl text-foreground mt-2 border'>Invite Collaborator</TooltipContent>
            </Tooltip>

            <motion.div variants={microButton} whileHover="hover" whileTap="tap">
              <div className="p-2.5 bg-(--group-color) border-l border-border">
                <TimerPopover />
              </div>
            </motion.div>

          </ButtonGroup>

          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            className="cursor-default "
          >
            <Avatar className="h-8 w-8 md:h-9 md:w-9 ring-1 ring-border/60">
              <AvatarFallback className="bg-linear-to-br from-orange-500/20 to-amber-500/20 text-orange-700 dark:text-orange-400 font-semibold text-sm">
                {roomName?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
          </motion.div>

        </div>
      </div>
    </header>
  )
}