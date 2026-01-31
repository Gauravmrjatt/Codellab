"use client"
import { useEffect, useState, useRef } from "react"
import { Tldraw, Editor, TLUiOverrides } from "tldraw"
import "tldraw/tldraw.css"
import { useTheme } from "next-themes"
import { useWS } from "@/context/WebSocketProvider"
import * as Y from "yjs"

const overrides: TLUiOverrides = {
  actions: (_editor, actions) => {
    const modified = { ...actions };

    // remove actions bound to single keys
    Object.keys(modified).forEach((id) => {
      const action = modified[id];
      if (action.kbd && /^[a-z0-9]$/i.test(action.kbd)) { 
        // simple regex matches single characters like "1", "s", "h"
        modified[id] = { ...action, kbd: undefined };
      }
    });

    return modified;
  },

  tools: (_editor, tools) => {
    const modified = { ...tools };

    // remove single-key tool shortcuts
    Object.keys(modified).forEach((id) => {
      const tool = modified[id];
      if (tool.kbd && /^[a-z0-9]$/i.test(tool.kbd)) {
        modified[id] = { ...tool, kbd: undefined };
      }
    });

    return modified;
  },
};


export function Whiteboard() {
    const { theme } = useTheme()
    const [editor, setEditor] = useState<Editor | null>(null)
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
    const { socket, requestDrawingSnapshot, participants, userId } = useWS()

    // Use refs to avoid recreating Yjs objects on every render
    const yDocRef = useRef<Y.Doc | null>(null)
    const yStoreRef = useRef<Y.Map<any> | null>(null)
    const isSyncingRef = useRef(false)
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Check if current user has drawing permission
    const currentUser = participants.find(p => p.id === userId);
    const canDraw = currentUser?.canDraw !== false; // Default to true if not specified

    // Initialize Yjs document once
    if (!yDocRef.current) {
        yDocRef.current = new Y.Doc()
        yStoreRef.current = yDocRef.current.getMap('tldraw')
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

        // Handle save confirmation (Server sends this after debounced save)
        const handleSaveConfirmation = () => {
            setSaveStatus('saved')
        }

        // 1. Collect updates in a buffer instead of sending immediately
        const updateHandler = (update: Uint8Array, origin: any) => {
            if (origin === 'remote') return
            if (!canDraw) return

            pendingUpdatesRef.current.push(update)
            setSaveStatus('unsaved')
        }

        // 2. Flush loop: Merge and send updates every 50ms (20fps)
        // This drastically reduces network overhead and transaction count
        const flushInterval = setInterval(() => {
            if (pendingUpdatesRef.current.length === 0) return

            const updates = pendingUpdatesRef.current
            pendingUpdatesRef.current = [] // Clear buffer

            // Merge all pending updates into a single binary payload
            const mergedUpdate = Y.mergeUpdates(updates)
            
            // Send as raw binary
            socket.emit('drawing:yjs-update', mergedUpdate)
            
            // Optimistic "Saving..." state (Server will confirm with 'drawing:saved')
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

                // Handle wrapped state object or direct state
                const rawState = snapshot.state || snapshot;

                if (rawState instanceof Uint8Array) {
                    state = rawState;
                } else if (rawState instanceof ArrayBuffer) {
                    state = new Uint8Array(rawState);
                } else if (rawState?.type === 'Buffer' && Array.isArray(rawState.data)) {
                    // Node.js Buffer serialization fallback
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

    // Sync between Tldraw and Yjs
    useEffect(() => {
        if (!editor || !yStore || !yDoc) return

        // Sync from Yjs to Tldraw
        const observer = (event: Y.YMapEvent<any>) => {
            if (isSyncingRef.current) return

            isSyncingRef.current = true
            try {
                editor.store.mergeRemoteChanges(() => {
                    const toRemove: string[] = []
                    const toPut: any[] = []

                    event.keysChanged.forEach(key => {
                        if (yStore.has(key)) {
                            toPut.push(yStore.get(key))
                        } else {
                            toRemove.push(key)
                        }
                    })

                    if (toRemove.length > 0) {
                        editor.store.remove(toRemove as any)
                    }
                    if (toPut.length > 0) {
                        editor.store.put(toPut)
                    }
                })
            } finally {
                isSyncingRef.current = false
            }
        }

        yStore.observe(observer)

        // Sync from Tldraw to Yjs
        const unsubscribe = editor.store.listen((entry) => {
            if (entry.source !== 'user') return
            if (isSyncingRef.current) return

            // Only allow users with drawing permission to sync changes
            if (!canDraw) return

            isSyncingRef.current = true

            try {
                const { changes } = entry

                yDoc.transact(() => {
                    Object.values(changes.added).forEach(record => {
                        yStore.set(record.id, record)
                    })

                    Object.values(changes.updated).forEach(([_, record]) => {
                        yStore.set(record.id, record)
                    })

                    Object.values(changes.removed).forEach(record => {
                        yStore.delete(record.id)
                    })
                }, 'local')
            } finally {
                isSyncingRef.current = false
            }
        }, { scope: 'document', source: 'user' })

        return () => {
            yStore.unobserve(observer)
            unsubscribe()
        }
    }, [editor, yStore, yDoc, canDraw])

    // Update theme
    useEffect(() => {
        if (editor && theme) {
            editor.user.updateUserPreferences({
                colorScheme: theme as "dark" | "light" | "system" | undefined,
            })
        }
    }, [editor, theme])

    // Update read-only state
    useEffect(() => {
        if (editor) {
            editor.updateInstanceState({ isReadonly: !canDraw })
        }
    }, [editor, canDraw])

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Status Overlay */}
            <div className="absolute top-2 right-2 z-[1000] flex items-center gap-3 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm p-1.5 rounded-lg border border-black/5 dark:border-white/5 shadow-sm text-xs font-medium">
                {/* Save Status */}
                <span className={`px-2 py-0.5 rounded-md ${saveStatus === 'saved' ? 'text-green-600 bg-green-500/10' :
                    saveStatus === 'saving' ? 'text-amber-600 bg-amber-500/10' :
                        'text-zinc-500'
                    }`}>
                    {saveStatus === 'saved' ? 'Saved' :
                        saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
                </span>

                {/* Online Users - Presence */}
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

            <Tldraw
                overrides={overrides}
                onMount={(editorInstance) => {
                    setEditor(editorInstance)
                    editorInstance.user.updateUserPreferences({
                        colorScheme: theme as "dark" | "light" | "system" | undefined,
                    })
                    // Set initial read-only state
                    editorInstance.updateInstanceState({ isReadonly: !canDraw })
                }}
            />
        </div>
    )
}
