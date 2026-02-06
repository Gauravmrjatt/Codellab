import { useEffect, useRef, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { CodeChange, Participant, ChatMessage, CursorPosition } from "@/types/editor-panel"
import { useExecutionState } from "@/hooks/applyExecutionState"
import { useCodeEditorStore } from "@/stores/code-editor-store"
import { useDockRefStore } from "@/stores/dock-ref-store"
export function useWebSocket(
  roomId: string,
  userId: string,
  username: string,
  onCodeChange?: (data: CodeChange) => void
) {
  const socketRef = useRef<Socket | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [editingUsers, setEditingUsers] = useState<Record<string, string[]>>({})
  const [cursors, setCursors] = useState<CursorPosition[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [drawingSnapshot, setDrawingSnapshot] = useState<any>(null)
  const { applyExecutionState } = useExecutionState()
  const { setLanguage, setIsRunning } = useCodeEditorStore()
  const { dockviewRef } = useDockRefStore()

  useEffect(() => {
    if (!roomId || !userId) return

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://socket.logicpay.in";
    socketRef.current = io(SOCKET_URL, {
      query: { roomId, userId, username },
      transports: ["websocket"],
    })

    const socket = socketRef.current

    socket.on("connect", () => setIsConnected(true))
    socket.on("disconnect", () => setIsConnected(false))

    // Participants
    socket.on("room:users", (users: Participant[]) => {
      setParticipants(users.map(u => ({ ...u, isOnline: true })))
    })

    socket.on("user:joined", (user: Participant) => {
      setParticipants(prev =>
        prev.find(p => p.id === user.id) ? prev : [...prev, { ...user, isOnline: true }]
      )
    })

    socket.on("user:left", (leftUserId: string) => {
      setParticipants(prev =>
        prev.map(p =>
          p.id === leftUserId ? { ...p, isOnline: false, lastSeen: new Date() } : p
        )
      )
    })

    // Handle role changes
    socket.on("user:role-changed", (updatedUser: Participant) => {
      setParticipants(prev =>
        prev.map(p =>
          p.id === updatedUser.id ? { ...updatedUser, isOnline: true } : p
        )
      )
    })

    // Handle permission changes
    socket.on("user:permission-changed", (updatedUser: Participant) => {
      setParticipants(prev =>
        prev.map(p =>
          p.id === updatedUser.id ? { ...updatedUser, isOnline: true } : p
        )
      )
    })

    // Chat messages
    socket.on("chat:history", (history: ChatMessage[]) => {
      setMessages(history.map(m => ({ ...m, timestamp: new Date(m.timestamp) })))
    })

    socket.on("chat:message", (msg: ChatMessage) => {
      setMessages(prev => [...prev, { ...msg, timestamp: new Date(msg.timestamp) }])
    })

    socket.on("chat:delete", (messageId: string) => {
      setMessages(prev => prev.filter(m => m.id !== messageId))
    })

    // Typing indicators
    socket.on("chat:typing", ({ username }: { username: string }) => {
      setTypingUsers(prev => prev.includes(username) ? prev : [...prev, username])

      // Auto-remove after reasonable timeout (backup)
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u !== username))
      }, 6000)
    })

    socket.on("chat:typing:stop", ({ username }: { username: string }) => {
      setTypingUsers(prev => prev.filter(u => u !== username))
    })

    socket.on("code:output", (data: {
      isLoading?: boolean
      status: "running" | "accepted" | "error"
      output?: string
      logs?: string
      panel?: any
    }) => {

      setIsRunning(data.isLoading || false);
      applyExecutionState(data.status, data.output, data.logs)
      if (!data.isLoading) {
        console.log("this")
        const use_this = dockviewRef?.getPanel(data.panel)
        use_this?.api.setActive()
        console.log(use_this)
        if (use_this && use_this.api.height < 100) {
          use_this.api.setSize({ height: 300 })
        }

      }
    })


    // Editor activity
    socket.on("editor:active", ({ fileId, username }) => {
      setEditingUsers(prev => ({
        ...prev,
        [fileId]: Array.from(new Set([...(prev[fileId] || []), username])),
      }))

      setTimeout(() => {
        setEditingUsers(prev => ({
          ...prev,
          [fileId]: (prev[fileId] || []).filter(u => u !== username),
        }))
      }, 2000)
    })

    // Cursor movement
    socket.on("cursor:move", (cursor: CursorPosition) => {
      setCursors(prev => [
        ...prev.filter(c => c.userId !== cursor.userId),
        cursor,
      ])
    })

    // Code changes
    socket.on("code:change", (change: CodeChange) => {
      // NOTE: We no longer call setCode here because it causes the editor to reset/ghost-write
      // when multiple users type. Yjs in EditorPanel now handles granular content sync.
      // setCode(change.changes[0].content) 
      
      setLanguage(change.changes[0].currentLanguage)
      onCodeChange?.(change)
    })

    // Drawing events
    socket.on("drawing:snapshot", (snapshot: any) => {
      setDrawingSnapshot(snapshot)
    })

    socket.on("drawing:update", (update: any) => {
      // This will be handled by the Whiteboard component directly
      // We just pass it through via a callback if needed
    })

    // Heartbeat / presence
    const heartbeat = setInterval(() => {
      socket.emit("presence:ping", { roomId, userId })
    }, 5000)

    return () => {
      clearInterval(heartbeat)
      socket.disconnect()
    }
  }, [roomId, userId, username, onCodeChange])

  const sendMessage = useCallback((content: string, type: "text" | "code" | "audio" = "text", mentionedUsers: string[] = []) => {
    socketRef.current?.emit("chat:message", {
      userId,
      username,
      content,
      type,
      roomId,
      mentionedUsers,
    })
  }, [userId, username, roomId])

  const deleteMessage = useCallback((messageId: string) => {
    socketRef.current?.emit("chat:delete", { roomId, messageId })
  }, [roomId])

  const sendTyping = useCallback((isTyping: boolean) => {
    socketRef.current?.emit("chat:typing", { isTyping })
  }, [])

  const notifyEditing = useCallback((fileId: string) => {
    socketRef.current?.emit("editor:active", { roomId, fileId, username })
  }, [roomId, username])

  const sendCursorPosition = useCallback((position: { column: number, lineNumber: number }) => {
    socketRef.current?.emit("cursor:move", {
      userId,
      username,
      position,
      roomId,
    })
  }, [userId, username, roomId])

  const sendCodeChange = useCallback((fileId: string, changes: any[]) => {
    socketRef.current?.emit("code:change", {
      userId,
      fileId,
      changes,
      roomId,
      timestamp: Date.now(),
    })
  }, [userId, roomId])

  const sendOutput = useCallback((
    output: string,
    logs: string,
    status: "running" | "accepted" | "error",
    isLoading: boolean,
    panel?: any
  ) => {
    socketRef.current?.emit("code:output", {
      roomId,
      output,
      logs,
      status,
      isLoading,
      panel
    })
  }, [roomId])

  const sendDrawingUpdate = useCallback((update: any) => {
    socketRef.current?.emit("drawing:update", {
      roomId,
      userId,
      update,
      timestamp: Date.now(),
    })
  }, [roomId, userId])

  const requestDrawingSnapshot = useCallback(() => {
    socketRef.current?.emit("drawing:request", { roomId })
  }, [roomId])

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
    socket: socketRef.current,
  }
}