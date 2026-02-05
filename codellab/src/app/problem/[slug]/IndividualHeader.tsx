'use client'

import { motion, Variants } from 'framer-motion'
import {
  Code2,
  CloudUpload,
  Users,
  Plus,
  Search,
  History,
  Trophy,
  FileCode
} from 'lucide-react'
import { FaPlay } from "react-icons/fa6"
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
import { useDockRefStore } from '@/stores/dock-ref-store';
import { useWS } from '@/context/WebSocketProvider';
import { TimerPopover } from '@/components/timer/timer-popover'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FaNoteSticky } from "react-icons/fa6"
import { FaHistory } from "react-icons/fa"
import { MdDraw , MdLeaderboard } from "react-icons/md";
import { CraftButton, CraftButtonIcon, CraftButtonIconProps, CraftButtonLabel, CraftButtonLabelProps, CraftButtonProps } from "@/components/ui/craft-button"
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

interface IndividualHeaderProps {
  roomId: string;
  roomName: string;
  questionId?: string;
  userRooms?: {
    id: string
    name: string
    updatedAt: string
  }[];
  contestId?: string;
  contest?: any;
}

export default function IndividualHeader({ roomId, roomName, questionId, userRooms = [], contestId, contest }: IndividualHeaderProps) {
  const { isRunning, handleRun, handleSubmitSolution } = useCodeCoordinator({ roomId, questionId })
  const dockview = useDockRefStore()
  const router = useRouter()
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
  const [roomSearchQuery, setRoomSearchQuery] = useState("")
  const { userId, username } = useWS()

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform)

  useKeyboardShortcut(isMac ? ["Meta", "'"] : ["Ctrl", "'"], handleRun, {
    overrideSystem: false,
    ignoreInputFields: false,
    repeatOnHold: false,
  })
  if (questionId) {
    useKeyboardShortcut(isMac ? ["Meta", "Enter"] : ["Ctrl", "Enter"], handleSubmitSolution, {
      overrideSystem: false,
      ignoreInputFields: false,
      repeatOnHold: false,
    })
  }

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
        position: { referencePanel: "problem-description", direction: "within" },
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
        position: { referencePanel: "problem-description", direction: "within" },
        params: {
          type: "whiteboard"
        }
      });
    }
  }
  const handleRoomSelect = (selectedRoomId: string) => {
    router.push(`/workspace?questionId=${questionId}&room=${selectedRoomId}`)
  }

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(7)
    router.push(`/workspace?questionId=${questionId}&room=${newRoomId}`)
  }

  const handleProblems = () => {
    const panel = dockview.dockviewRef?.getPanel("contest-problems")
    if (panel) {
      panel.api.setActive()
    } else {
      dockview.dockviewRef?.addPanel({
        tabComponent: "default",
        id: "contest-problems",
        component: "sidebar",
        title: "Problems",
        minimumWidth: 300,
        position: { referencePanel: "problem-description", direction: "within", index: 0 },
        params: {
          type: "contest-problems",
          contest,
          questionId
        }
      })
    }
  }



  const handleLeaderboard = () => {
    const panel = dockview.dockviewRef?.getPanel("leaderboard")
    if (panel) {
      panel.api.setActive()
    } else {
      dockview.dockviewRef?.addPanel({
        tabComponent: "default",
        id: "leaderboard",
        component: "sidebar",
        title: "Leaderboard",
        minimumWidth: 300,
        position: { referencePanel: "problem-description", direction: "within" },
        params: {
          type: "leaderboard",
          contest,
          currentUsername: username
        }
      })
    }
  }

  const handleSubmissions = () => {
    const panel = dockview.dockviewRef?.getPanel("submission")
    if (panel) {
      panel.api.setActive()
      panel.api.updateParameters({
        type: "submission",
        forType: "history",
      });
    } else {
      dockview.dockviewRef?.addPanel({
        tabComponent: "default",
        id: "submission",
        component: "sidebar",
        title: "Submission",
        minimumWidth: 300,
        position: { referencePanel: "problem-description", direction: "within" },
        params: {
          type: "submission",
          questionId,
          forType: "history"
        }
      })
    }
  }

  const filteredRooms = userRooms.filter(room =>
    room.name.toLowerCase().includes(roomSearchQuery.toLowerCase())
  )

  return (
    <header className="w-full dark:bg-[#222427] bg-[#ECEFF2]">
      <div className="flex h-13 items-center justify-between px-4 pt-2 md:px-6">

        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-orange-500/10 p-1.5">
            <Code2 className="h-5 w-5 text-orange-500" />
          </div>
          <span className="font-medium text-sm text-bold  text-primary/85 tracking-tight truncate max-w-[180px] md:max-w-[240px]">
            {contest ? contest.title : roomName}
          </span>
          {contestId && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
              Contest Mode
            </span>
          )}
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
                        <FaPlay className="h-4.5 text-green-600 dark:text-green-500" />
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

              {/* Submit - only show if questionId exists */}

              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div variants={microButton} whileHover="hover" whileTap="tap">
                    <Button
                      disabled={!questionId}
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
                        <FaNoteSticky className="h-4.5 text-[#FFB700] " />
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
                        <MdDraw className="h-4 text-[#FD8DA3] " />
                      </motion.div>
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent className="bg-muted/50 backdrop-blur-3xl text-muted-foreground mt-2 border">
                  Whiteboard
                </TooltipContent>
              </Tooltip>
            </div>

            {contestId && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div variants={microButton} whileHover="hover" whileTap="tap">
                    <Button
                      onClick={handleLeaderboard}
                      variant="secondary"
                      size="icon-lg"
                      className="border border-muted/50 p-2.5 bg-(--group-color) cursor-pointer"
                    >
                      <motion.div variants={iconMicro} whileHover="hover" whileTap="tap">
                        <MdLeaderboard className="h-4.5 text-yellow-500" />
                      </motion.div>
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent className="bg-muted/50 backdrop-blur-3xl text-muted-foreground mt-2 border">
                  Leaderboard
                </TooltipContent>
              </Tooltip>
            )}

            {questionId && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div variants={microButton} whileHover="hover" whileTap="tap">
                    <Button
                      onClick={handleSubmissions}
                      variant="secondary"
                      size="icon-lg"
                      className="border border-muted/50 p-2.5 bg-(--group-color) cursor-pointer"
                    >
                      <motion.div variants={iconMicro} whileHover="hover" whileTap="tap">
                        <FaHistory className="h-4.5 text-[#615FFF]" />
                      </motion.div>
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent className="bg-muted/50 backdrop-blur-3xl text-muted-foreground mt-2 border">
                  My Submissions
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-3">


          {!contestId && (
            <Button onClick={() => setIsRoomDialogOpen(true)} className="text-white shadow-md  bg-gradient-to-r from-purple-500/80 via-purple-600 to-purple-700/60 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-purple-300 dark:focus:ring-purple-800 font-medium rounded-base text-sm px-4 py-2 text-center leading-5 rounded-md transition-all">
              <span className="relative  w-full justify-center items-center flex text-left text-white transition-colors duration-200 ease-in-out group-hover:text-white">
                <Users className="w-4 h-4 mr-2" />
                Open in Workspace
              </span>
            </Button>
          )}
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

          {/* Timer */}
          <ButtonGroup className="gap-0 hidden sm:flex">
            <motion.div variants={microButton} whileHover="hover" whileTap="tap">
              <TimerPopover individual={true} />
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

      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Collaborate</DialogTitle>
            <DialogDescription>
              Join an existing room or create a new one to collaborate on this problem.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rooms..."
                  className="pl-9"
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateRoom}>
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </div>

            <ScrollArea className="h-[300px] rounded-md border p-4">
              {filteredRooms.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                  {roomSearchQuery ? "No rooms match your search" : "No rooms found"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => handleRoomSelect(room.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                    >
                      <div>
                        <div className="font-medium">{room.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Last active: {new Date(room.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-xs text-primary group-hover:underline">
                        Join
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}