"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as Y from "yjs"
import type { Socket } from "socket.io-client"
import { Participant } from "@/types/editor-panel"

interface UseBlockNoteCollaborationProps {
    socket: Socket | null
    roomId: string
    userId: string
    username: string
    userColor: string
    participants?: Array<{ id: string; canWriteNotes?: boolean }>
}

interface BlockNoteCollaborationResult {
    ydoc: Y.Doc | null
    provider: any | null
    isReady: boolean
}

/**
 * Custom Yjs provider for socket.io integration with BlockNote
 * Implements the minimal provider interface that BlockNote expects
 */
class SocketProvider {
    private socket: Socket
    private roomId: string
    private ydoc: Y.Doc
    private userId: string
    private participants: Array<{ id: string; canWriteNotes?: boolean }>
    private awareness: {
        clientID: number
        states: Map<number, any>
        localState: any
        on: (event: string, cb: Function) => void
        off: (event: string, cb: Function) => void
        setLocalState: (state: any) => void
        setLocalStateField: (field: string, value: any) => void
        getLocalState: () => any
        getStates: () => Map<number, any>
        destroy: () => void
    }
    private listeners: Map<string, Function[]> = new Map()
    private isDestroyed = false

    constructor(
        socket: Socket,
        roomId: string,
        ydoc: Y.Doc,
        user: { name: string; color: string },
        userId: string,
        participants: Array<{ id: string; canWriteNotes?: boolean }> = []
    ) {
        this.socket = socket
        this.roomId = roomId
        this.ydoc = ydoc
        this.userId = userId
        this.participants = participants

        // Create awareness state
        const clientID = ydoc.clientID
        const states = new Map<number, any>()

        this.awareness = {
            clientID,
            states,
            localState: { user },

            on: (event: string, cb: Function) => {
                if (!this.listeners.has(event)) {
                    this.listeners.set(event, [])
                }
                this.listeners.get(event)!.push(cb)
            },

            off: (event: string, cb: Function) => {
                const cbs = this.listeners.get(event)
                if (cbs) {
                    const idx = cbs.indexOf(cb)
                    if (idx > -1) cbs.splice(idx, 1)
                }
            },

            setLocalState: (state: any) => {
                this.awareness.localState = state
                states.set(clientID, state)
                if (this.socket?.connected) {
                    this.socket.emit("notes:awareness", {
                        roomId: this.roomId,
                        clientID,
                        state,
                    })
                }
            },

            setLocalStateField: (field: string, value: any) => {
                const currentState = this.awareness.localState || {}
                this.awareness.setLocalState({
                    ...currentState,
                    [field]: value,
                })
            },

            getLocalState: () => this.awareness.localState,

            getStates: () => states,

            destroy: () => {
                states.clear()
                this.listeners.clear()
            },
        }

        // Set initial user state
        this.awareness.setLocalState({ user })

        // Setup socket listeners
        this.setupSocketListeners()

        // Setup Yjs update handler
        this.setupYjsHandlers()

        // Request initial snapshot
        this.socket.emit("notes:request-snapshot", { roomId: this.roomId })
    }

    private setupSocketListeners() {
        // Handle remote Yjs updates
        this.socket.on("notes:yjs-update", (data: { update: number[] }) => {
            if (this.isDestroyed) return
            try {
                Y.applyUpdate(this.ydoc, new Uint8Array(data.update), "remote")
            } catch (err) {
                console.error("[SocketProvider] Failed to apply update:", err)
            }
        })

        // Handle initial snapshot
        this.socket.on("notes:snapshot", (data: { state: number[] }) => {
            if (this.isDestroyed) return
            if (data?.state && data.state.length > 0) {
                try {
                    Y.applyUpdate(this.ydoc, new Uint8Array(data.state), "remote")
                    console.log("[SocketProvider] Applied snapshot")
                } catch (err) {
                    console.error("[SocketProvider] Failed to apply snapshot:", err)
                }
            }
        })

        // Handle remote awareness
        this.socket.on("notes:awareness", (data: { clientID: number; state: any }) => {
            if (this.isDestroyed) return
            this.awareness.states.set(data.clientID, data.state)
            // Trigger awareness change listeners
            const cbs = this.listeners.get("change") || []
            cbs.forEach(cb => cb({ added: [], updated: [data.clientID], removed: [] }))
        })
    }

    private setupYjsHandlers() {
        this.ydoc.on("update", (update: Uint8Array, origin: any) => {
            if (this.isDestroyed || origin === "remote") return

            // Check if current user has permission to write notes
            const currentUser = this.participants.find(p => p.id === this.userId);
            const canWriteNotes = currentUser?.canWriteNotes !== false; // Default to true if not specified

            if (!canWriteNotes) {
                console.log("[SocketProvider] User does not have permission to write notes");
                return;
            }

            // Emit update to other clients
            this.socket.emit("notes:yjs-update", {
                roomId: this.roomId,
                update: Array.from(update),
            })
        })
    }

    // Required by BlockNote collaboration
    get doc() {
        return this.ydoc
    }

    // Required awareness getter
    get awarenessInstance() {
        return this.awareness
    }

    on(event: string, cb: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, [])
        }
        this.listeners.get(event)!.push(cb)
    }

    off(event: string, cb: Function) {
        const cbs = this.listeners.get(event)
        if (cbs) {
            const idx = cbs.indexOf(cb)
            if (idx > -1) cbs.splice(idx, 1)
        }
    }

    destroy() {
        this.isDestroyed = true
        this.socket.off("notes:yjs-update")
        this.socket.off("notes:snapshot")
        this.socket.off("notes:awareness")
        this.awareness.destroy()
        this.ydoc.destroy()
    }
}

export function useBlockNoteCollaboration({
    socket,
    roomId,
    userId,
    username,
    userColor,
    participants,
}: UseBlockNoteCollaborationProps): BlockNoteCollaborationResult {
    const [ydoc, setYdoc] = useState<Y.Doc | null>(null)
    const [provider, setProvider] = useState<SocketProvider | null>(null)
    const [isReady, setIsReady] = useState(false)
    const providerRef = useRef<SocketProvider | null>(null)
    const isInitializedRef = useRef(false)

    useEffect(() => {
        // Only initialize if we have a socket and haven't initialized yet
        if (!socket || !roomId || !socket.connected || isInitializedRef.current) {
            return
        }

        console.log("[useBlockNoteCollaboration] Initializing for room:", roomId)
        isInitializedRef.current = true

        // Create Yjs document
        const doc = new Y.Doc()

        // Create socket provider
        const socketProvider = new SocketProvider(socket, roomId, doc, {
            name: username,
            color: userColor,
        }, userId, participants || [])

        providerRef.current = socketProvider

        setYdoc(doc)
        setProvider(socketProvider)
        setIsReady(true)

        console.log("[useBlockNoteCollaboration] Setup complete")

        // Cleanup
        return () => {
            console.log("[useBlockNoteCollaboration] Cleaning up")
            if (providerRef.current) {
                providerRef.current.destroy()
                providerRef.current = null
            }
            isInitializedRef.current = false
            setIsReady(false)
        }
    }, [socket, roomId, userId, username, userColor, participants])

    return { ydoc, provider, isReady }
}
