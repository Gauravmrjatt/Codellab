"use client"

import { createContext, useContext, useState, useRef, useCallback } from "react"
import { useWebSocket } from "@/hooks/use-websocket"
import { CodeChange, Participant, ChatMessage, CursorPosition } from "@/types/editor-panel"

type WebSocketContextType = ReturnType<typeof useWebSocket> | null

const WebSocketContext = createContext<WebSocketContextType>(null)

function useMockWebSocket(roomId: string, userId: string, username: string) {
  // Mock state
  const [participants] = useState<Participant[]>([])
  const [messages] = useState<ChatMessage[]>([])
  const [typingUsers] = useState<string[]>([])
  const [editingUsers] = useState<Record<string, string[]>>({})
  const [cursors] = useState<CursorPosition[]>([])
  const isConnected = true // Simulate connected state for offline mode
  const drawingSnapshot = null
  const socket = null

  // Mock functions (no-ops)
  const sendMessage = useCallback(() => {}, [])
  const deleteMessage = useCallback(() => {}, [])
  const sendTyping = useCallback(() => {}, [])
  const notifyEditing = useCallback(() => {}, [])
  const sendCursorPosition = useCallback(() => {}, [])
  const sendCodeChange = useCallback(() => {}, [])
  const sendOutput = useCallback(() => {}, []) // Local execution handles UI updates
  const sendDrawingUpdate = useCallback(() => {}, [])
  const requestDrawingSnapshot = useCallback(() => {}, [])

  return {
    roomId,
    username,
    userId,
    participants,
    messages,
    typingUsers,
    editingUsers,
    cursors,
    isConnected,
    sendMessage,
    deleteMessage,
    sendTyping,
    notifyEditing,
    sendCursorPosition,
    sendCodeChange,
    sendOutput,
    drawingSnapshot,
    sendDrawingUpdate,
    requestDrawingSnapshot,
    socket,
  }
}

export function WebSocketProvider({
  roomId,
  userId,
  username,
  children,
  mock = false,
}: {
  roomId: string
  userId: string
  username: string
  children: React.ReactNode
  mock?: boolean
}) {
  const realWs = useWebSocket(roomId, userId, username)
  const mockWs = useMockWebSocket(roomId, userId, username)

  return (
    <WebSocketContext.Provider
      value={mock ? mockWs : realWs}
    >
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWS() {
  const ctx = useContext(WebSocketContext)
  if (!ctx) {
    throw new Error("useWS must be used inside WebSocketProvider")
  }
  return ctx
}
