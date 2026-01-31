export interface EditorPanelProps {
  roomId: string
  roomName?: string
  onMouseMove: (e: React.MouseEvent) => void
  currentUserId: string
  currentUsername: string
}

export interface EditorCursor {
  userId: string
  username: string
  position: {
    lineNumber: number
    column: number
  }
  color: string
  lastUpdate: number
}

export type RemoteCursorDecorations = Record<string, string[]>;

export type CodeOutputPayload = {
  status: "running" | "accepted" | "error"
  output?: string
  logs?: string
}

export interface Participant {
  id: string
  username: string
  role: "admin" | "writer" | "reader"
  isOnline: boolean
  color: string
  lastSeen?: Date
  roomId: string
  userId: string
  canWriteCode?: boolean;
  canWriteNotes?: boolean;
  canDraw?: boolean;
}

export interface ChatMessage {
  id: string
  userId: string
  username: string
  content: string
  timestamp: Date
  type: "text" | "code" | "audio"
  roomId: string
  audioUrl?: string
  duration?: number
  mentionedUsers?: string[]
}

export interface CursorPosition {
  userId: string
  username: string
  position: { column: number, lineNumber: number }
  color: string
  lastUpdate: number
}

export interface CodeChange {
  userId: string
  fileId: string
  changes: Array<{ type: string; content: string; timestamp: number,  currentLanguage : string }>
  
  timestamp: number
}
