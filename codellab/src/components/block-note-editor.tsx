"use client"

import { useMemo } from "react"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/mantine/style.css"

import { useWS } from "@/context/WebSocketProvider"
import { useBlockNoteCollaboration } from "@/hooks/use-blocknote-collaboration"
import { useTheme } from "next-themes"
interface BlockNoteEditorProps {
    roomId?: string
    userId?: string
    username?: string
    userColor?: string
}

export function BlockNoteEditor({
    roomId,
    userId,
    username,
    userColor = "#3b82f6",
}: BlockNoteEditorProps) {
    // Get socket and participants from context
    let socket = null
    let isConnected = false
    let participants: any[] = []
    let currentUserId = null

    try {
        const ws = useWS()
        socket = ws.socket
        isConnected = ws.isConnected
        participants = ws.participants
        currentUserId = ws.userId
    } catch (e) {
        // Not in WebSocketProvider context
    }
const {resolvedTheme} = useTheme();
    // Check if current user has notes permission
    const currentUser = participants.find(p => p.id === currentUserId);
    const canWriteNotes = currentUser?.canWriteNotes !== false; // Default to true if not specified

    // Only enable collaboration if we have all required props AND a socket
    const isCollaborative = !!(roomId && userId && username && socket && isConnected)

    // Setup collaboration
    const { ydoc, provider, isReady } = useBlockNoteCollaboration({
        socket: isCollaborative ? socket : null,
        roomId: roomId || "",
        userId: userId || "",
        username: username || "",
        userColor: userColor,
        participants: participants,
    })

    // Create editor - either collaborative or standalone
    const editor = useCreateBlockNote(
        isCollaborative && isReady && ydoc && provider
            ? {
                collaboration: {
                    provider: provider,
                    fragment: ydoc.getXmlFragment("blocknote"),
                    user: {
                        name: username || "Anonymous",
                        color: userColor,
                    },
                },
            }
            : {},
        [isCollaborative, isReady, ydoc, provider]
    )

    // Show loading state while waiting for collaboration to be ready
    if (isCollaborative && !isReady) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Connecting to collaboration...</div>
            </div>
        )
    }

    return (
        <div className="h-full w-full overflow-auto relative">
            <h2 className="text-2xl font-bold p-4">
                Notes
            </h2>
            <BlockNoteView
                editor={editor}
                theme={resolvedTheme as  undefined}
                className="min-h-full"
                editable={canWriteNotes}
            />
            
             {/* Non-intrusive Read Only Indicator */}
             {!canWriteNotes && (
                <div className="absolute bottom-4 right-4 pointer-events-none z-10">
                    <div className="bg-muted/80 backdrop-blur-sm border border-border px-3 py-1.5 rounded-full shadow-sm">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500/50" />
                            Read Only
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
