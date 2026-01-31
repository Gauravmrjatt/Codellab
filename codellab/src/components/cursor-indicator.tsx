"use client"

import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export interface Cursor {
  id: string
  userId: string
  username: string
  position: { x: number; y: number }
  color: string
  lastUpdate: number
}

interface CursorIndicatorProps {
  cursors: Cursor[]
  currentUserId: string
}

const cursorColors = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500"
]

export function CursorIndicator({ cursors, currentUserId }: CursorIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(0)

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Filter out current user's cursor and cursors older than 5 seconds
  const visibleCursors = useMemo(() => {
    return cursors.filter(cursor =>
      cursor.userId !== currentUserId &&
      currentTime - cursor.lastUpdate < 5000
    )
  }, [cursors, currentUserId, currentTime])

  return (
    <AnimatePresence>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {visibleCursors.map((cursor) => (
          <motion.div
            key={cursor.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute pointer-events-none z-50"
            style={{
              left: `${cursor.position.x * 100}%`,
              top: `${cursor.position.y * 100}%`,
              transform: 'translate(-2px, -2px)'
            }}
          >
            {/* Cursor pointer */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className={`${cursorColors[cursor.userId.length % cursorColors.length]} drop-shadow-lg`}
            >
              <path
                d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"
                stroke="white"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>

            {/* User label */}
            <div className="absolute top-6 left-6">
              <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg border">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className={`text-xs ${cursorColors[cursor.userId.length % cursorColors.length]} text-white`}>
                    {cursor.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">{cursor.username}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  )
}