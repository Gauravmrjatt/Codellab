"use client"
import { useEffect, useState, useRef, Component, ReactNode, useCallback } from "react"
import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import { useWS } from "@/context/WebSocketProvider"
import * as Y from "yjs"

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted/50 text-muted-foreground">
        Loading Whiteboard...
      </div>
    ),
  }
)

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Whiteboard crashed:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-muted/50 text-muted-foreground">
          <div className="text-center">
            <p className="mb-2 text-lg font-medium">Something went wrong</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function Whiteboard() {
    const { resolvedTheme } = useTheme()
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
    const { socket, requestDrawingSnapshot, participants, userId, roomId } = useWS()

    // Use refs to avoid recreating Yjs objects on every render
    const yDocRef = useRef<Y.Doc | null>(null)
    const yStoreRef = useRef<Y.Map<any> | null>(null)
    const isSyncingRef = useRef(false)
    const elementVersionsRef = useRef<Map<string, number>>(new Map())

    // Check if current user has drawing permission
    const currentUser = participants.find(p => p.id === userId);
    const canDraw = currentUser?.canDraw !== false; // Default to true if not specified

    // Initialize Yjs document once
    if (!yDocRef.current) {
        yDocRef.current = new Y.Doc()
        yStoreRef.current = yDocRef.current.getMap('excalidraw')
    }

    const yDoc = yDocRef.current
    const yStore = yStoreRef.current

    // Sync Yjs updates via WebSocket
    useEffect(() => {
        if (!socket || !yDoc) return

        const pendingUpdatesRef = { current: [] as Uint8Array[] }

        // Handle incoming Yjs updates from other clients
        const handleYjsUpdate = (data: Uint8Array | { update: number[] } | number[]) => {
            try {
                // Support both binary (Uint8Array) and legacy JSON formats
                let update: Uint8Array
                if (data instanceof Uint8Array) {
                    update = data
                } else if (data instanceof ArrayBuffer) {
                    update = new Uint8Array(data)
                } else {
                    // Fallback for legacy format
                    const updateArray = Array.isArray(data) ? data : data.update
                    update = new Uint8Array(updateArray)
                }

                if (update && update.byteLength > 0) {
                    Y.applyUpdate(yDoc, update, 'remote')
                }
            } catch (err) {
                console.error("Failed to apply Yjs update:", err)
            }
        }

        // Handle save confirmation
        const handleSaveConfirmation = () => {
            setSaveStatus('saved')
        }

        // 1. Collect updates in a buffer
        const updateHandler = (update: Uint8Array, origin: any) => {
            if (origin === 'remote') return
            if (!canDraw) return

            pendingUpdatesRef.current.push(update)
            setSaveStatus('unsaved')
        }

        // 2. Flush loop: Merge and send updates every 50ms
        const flushInterval = setInterval(() => {
            if (pendingUpdatesRef.current.length === 0) return

            const updates = pendingUpdatesRef.current
            pendingUpdatesRef.current = [] // Clear buffer

            // Merge all pending updates
            const mergedUpdate = Y.mergeUpdates(updates)
            
            // Send as raw binary
            socket.emit('drawing:yjs-update', { roomId, update: mergedUpdate })
            
            setSaveStatus('saving')
        }, 50)

        yDoc.on('update', updateHandler)
        socket.on('drawing:yjs-update', handleYjsUpdate)
        socket.on('drawing:saved', handleSaveConfirmation)

        // Request initial state
        requestDrawingSnapshot()

        return () => {
            clearInterval(flushInterval)
            yDoc.off('update', updateHandler)
            socket.off('drawing:yjs-update', handleYjsUpdate)
            socket.off('drawing:saved', handleSaveConfirmation)
        }
    }, [socket, yDoc, requestDrawingSnapshot, canDraw])

    // Load initial snapshot
    useEffect(() => {
        if (!socket || !yDoc) return

        const handleSnapshot = (snapshot: any) => {
            if (!snapshot || !yDoc) return;

            try {
                let state: Uint8Array | undefined;
                const rawState = snapshot.state || snapshot;

                if (rawState instanceof Uint8Array) {
                    state = rawState;
                } else if (rawState instanceof ArrayBuffer) {
                    state = new Uint8Array(rawState);
                } else if (rawState?.type === 'Buffer' && Array.isArray(rawState.data)) {
                    state = new Uint8Array(rawState.data);
                } else if (Array.isArray(rawState)) {
                    state = new Uint8Array(rawState);
                }

                if (state && state.byteLength > 0) {
                    Y.applyUpdate(yDoc, state, 'remote');
                }
            } catch (err) {
                console.error("Failed to load drawing snapshot:", err);
            }
        }

        socket.on('drawing:snapshot', handleSnapshot)
        return () => {
            socket.off('drawing:snapshot', handleSnapshot)
        }
    }, [socket, yDoc])

    // Sync between Excalidraw and Yjs
    useEffect(() => {
        if (!excalidrawAPI || !yStore || !yDoc) return

        // Sync from Yjs to Excalidraw
        const observer = (event: Y.YMapEvent<any>) => {
            if (isSyncingRef.current) return

            isSyncingRef.current = true
            try {
                // Get all elements from Yjs
                // Efficiently only get what we need? Excalidraw needs full scene usually or updates.
                // We can construct the scene from yStore values.
                const elements = Array.from(yStore.values()) as any[]
                
                // Update local version cache so we don't echo back
                elements.forEach(el => {
                    elementVersionsRef.current.set(el.id, el.version)
                })

                excalidrawAPI.updateScene({
                    elements
                })
            } finally {
                isSyncingRef.current = false
            }
        }

        yStore.observe(observer)

        // Initial load from Yjs if it has data
        if (yStore.size > 0) {
             const elements = Array.from(yStore.values()) as any[]
             elements.forEach(el => {
                elementVersionsRef.current.set(el.id, el.version)
             })
             excalidrawAPI.updateScene({ elements })
        }

        return () => {
            yStore.unobserve(observer)
        }
    }, [excalidrawAPI, yStore, yDoc])

    const handleChange = useCallback((elements: readonly any[], appState: any, files: any) => {
        if (!excalidrawAPI || !yStore || !yDoc || isSyncingRef.current) return
        if (!canDraw) return

        // Sync from Excalidraw to Yjs
        // We need to find what changed.
        // We use elementVersionsRef to track known versions.
        
        isSyncingRef.current = true
        try {
            yDoc.transact(() => {
                elements.forEach(element => {
                    const lastVersion = elementVersionsRef.current.get(element.id) || -1
                    if (element.version > lastVersion) {
                        yStore.set(element.id, element)
                        elementVersionsRef.current.set(element.id, element.version)
                    }
                })

                // Handle deletions? 
                // Excalidraw keeps deleted elements with isDeleted: true. 
                // We should sync them too so others know they are deleted.
            }, 'local')
        } finally {
            isSyncingRef.current = false
        }
    }, [excalidrawAPI, yStore, yDoc, canDraw])

    return (
        <ErrorBoundary>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* Status Overlay */}
                <div className="absolute top-50 right-2 z-[1000] flex items-center gap-3 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm p-1.5 rounded-lg border border-black/5 dark:border-white/5 shadow-sm text-xs font-medium">
                    {/* Save Status */}
                    <span className={`px-2 py-0.5 rounded-md ${saveStatus === 'saved' ? 'text-green-600 bg-green-500/10' :
                        saveStatus === 'saving' ? 'text-amber-600 bg-amber-500/10' :
                            'text-zinc-500'
                        }`}>
                        {saveStatus === 'saved' ? 'Saved' :
                            saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
                    </span>

                    {/* Online Users */}
                    <div className="flex items-center gap-1 pl-2 border-l border-black/10 dark:border-white/10">
                        <div className="flex -space-x-1.5">
                            {participants.slice(0, 3).map((p, i) => (
                                <div key={p.id || i}
                                    title={p.username}
                                    className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] ring-2 ring-white dark:ring-zinc-800 uppercase">
                                    {p.username?.[0] || '?'}
                                </div>
                            ))}
                        </div>
                        {participants.length > 3 && (
                            <span className="text-[10px] text-zinc-500 ml-1">
                                +{participants.length - 3}
                            </span>
                        )}
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 ml-1 animate-pulse" />
                    </div>

                    {/* Permission Notice */}
                    {!canDraw && (
                        <div className="absolute bottom-16 right-2 pointer-events-none z-[1001]">
                            <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-full shadow-sm">
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-500/50" />
                                    View Only
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <Excalidraw
                    excalidrawAPI={(api) => setExcalidrawAPI(api)}
                    theme={resolvedTheme as "light" | "dark"}
                    onChange={handleChange}
                    viewModeEnabled={!canDraw}
                    gridModeEnabled={true}
                />
            </div>
        </ErrorBoundary>
    )
}
