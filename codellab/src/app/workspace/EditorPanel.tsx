"use client"

import Editor, { Monaco, } from "@monaco-editor/react"
import * as Y from "yjs"
import { useWS } from "@/context/WebSocketProvider"
import { useTheme } from "next-themes"
import { Play, Copy, Download, ChevronDown, Check, RotateCcw, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type * as MonacoTypes from "monaco-editor"
import { useEditorSettingStore } from "@/stores/editor-settings-store"
import { useCodeEditorStore } from "@/stores/code-editor-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Braces, FileCode2, Code2, Coffee } from "lucide-react"
import { useCodeCoordinator } from "@/hooks/useCodeCoordinator"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"   // ← assuming you have this helper (clsx + tailwind-merge)
import { useRef } from "react"
import { EditorCursor, EditorPanelProps, RemoteCursorDecorations } from "@/types/editor-panel"
import { ensureCursorStyle, getGradientForUser, createCursorWidget } from "@/utils/colors";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"
const languages = [
  { value: "javascript", label: "JavaScript", icon: Braces },
  { value: "typescript", label: "TypeScript", icon: FileCode2 },
  { value: "python", label: "Python", icon: Code2 },
  { value: "java", label: "Java", icon: Coffee },
  { value: "cpp", label: "C++", icon: Code2 },
] as const

type Language = (typeof languages)[number]["value"]


export function EditorPanel({
  roomId,
  roomName,
  onMouseMove,
  currentUserId,
  currentUsername,
  questionId,
  testCases,
}: EditorPanelProps & { questionId?: string; testCases?: Array<{ id: string; input: string; output: string; isPublic: boolean }> }) {
  const { theme, resolvedTheme } = useTheme()
  const [isCopySuccess, setIsCopySuccess] = useState(false)
  const [isDownloadSuccess, setIsDownloadSuccess] = useState(false)
  const [isResetSuccess, setIsResetSuccess] = useState(false)

  const {
    code,
    currentLanguage,
    handleEditorChange,
    handleReset,
    handleLanguageChange,
    handleCopy,
    handleDownload,
    participants,
    cursors,
    editingUsers,
    sendCursorPosition
  } = useCodeCoordinator({ roomId  , questionId})

  const { fontSize, fontFamily, fontLigatures } = useEditorSettingStore()

  const editorRef = useRef<MonacoTypes.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const userColorsRef = useRef<Record<string, string>>({})
  const cursorWidgetsRef = useRef<Record<string, MonacoTypes.editor.IContentWidget>>({})

  const activeEditors = editingUsers["main"] || []
  let otherParticipants = participants.filter(
    (p) => p.userId !== currentUserId && p.isOnline
  )


  const currentLangObj = languages.find((l) => l.value === currentLanguage) ?? languages[0]
  const Icon = currentLangObj.icon


  const remoteCursorDecorations = useRef<RemoteCursorDecorations>({});

  function getUserColor(userId: string) {
    if (!userColorsRef.current[userId]) {
      userColorsRef.current[userId] =
        getGradientForUser(userId).caretColor
    }
    return userColorsRef.current[userId]
  }

  function renderRemoteCursor(
    editor: MonacoTypes.editor.IStandaloneCodeEditor,
    monaco: Monaco, // runtime Monaco instance
    userId: string,
    username: string,
    position: MonacoTypes.IPosition
  ): void {
    // 1️⃣ Ensure editor model exists
    const model = editor.getModel()
    if (!model) return
    const validPosition = model.validatePosition(position)

    // 3️⃣ Get user colors
    const caretColor = getUserColor(userId)
    ensureCursorStyle(userId, caretColor)

    const decorations: MonacoTypes.editor.IModelDeltaDecoration[] = [
      {
        range: new monaco.Range(
          validPosition.lineNumber,
          validPosition.column,
          validPosition.lineNumber,
          validPosition.column
        ),
        options: {
          beforeContentClassName: `remote-cursor  remote-cursor-${userId}`,
          stickiness:
            monaco.editor.TrackedRangeStickiness
              .NeverGrowsWhenTypingAtEdges,
        },
      },
    ]

    remoteCursorDecorations.current[userId] =
      editor.deltaDecorations(
        remoteCursorDecorations.current[userId] ?? [],
        decorations
      )
    let widget = cursorWidgetsRef.current[userId]

    if (!widget) {
      widget = createCursorWidget(username, userId)
      cursorWidgetsRef.current[userId] = widget
      editor.addContentWidget(widget)
    }

    widget.getPosition = () => ({
      position: validPosition,
      preference: [
        monaco.editor.ContentWidgetPositionPreference.ABOVE,
      ],
    })

    editor.layoutContentWidget(widget)
  }

  // ────────────────────────────────────────────────
  // Yjs Synchronization Logic
  // ────────────────────────────────────────────────
  const yDocRef = useRef<Y.Doc | null>(null)
  const isRemoteUpdate = useRef(false)
  const pendingUpdatesRef = useRef<Uint8Array[]>([])
  const { socket } = useWS()

  if (!yDocRef.current) {
    yDocRef.current = new Y.Doc()
  }
  const yDoc = yDocRef.current
  const yText = yDoc.getText('monaco')

  useEffect(() => {
    if (!socket || !editorRef.current || !monacoRef.current) return
    
    const editor = editorRef.current
    const model = editor.getModel()
    if (!model) return

    // 1. Handle incoming updates from server
    const handleYjsUpdate = (update: Uint8Array) => {
        try {
            // Support Buffer/ArrayBuffer conversion if needed
            const u = update instanceof Uint8Array ? update : new Uint8Array(update)
            Y.applyUpdate(yDoc, u)
        } catch (e) {
            console.error("Yjs update error:", e)
        }
    }
    
    socket.on('code:yjs-update', handleYjsUpdate)
    
    // 2. Sync Yjs -> Monaco (Remote changes)
    const yTextObserver = () => {
        if (isRemoteUpdate.current) return
        
        const remoteText = yText.toString()
        const localText = model.getValue()
        
        if (remoteText !== localText) {
            isRemoteUpdate.current = true
            const pos = editor.getPosition()
            
            // Full replacement is safest without y-monaco binding
            // We use pushEditOperations to preserve undo stack somewhat better than setValue
            // but for collaborative editing, local undo is tricky anyway.
            model.setValue(remoteText)
            
            if (pos) editor.setPosition(pos)
            isRemoteUpdate.current = false
        }
    }
    
    yText.observe(yTextObserver)
    
    // 3. Sync Monaco -> Yjs (Local changes)
    const disposable = editor.onDidChangeModelContent((e) => {
        if (isRemoteUpdate.current) return
        
        yDoc.transact(() => {
            e.changes.sort((a, b) => b.rangeOffset - a.rangeOffset).forEach(change => {
                if (change.rangeLength > 0) {
                    yText.delete(change.rangeOffset, change.rangeLength)
                }
                if (change.text.length > 0) {
                    yText.insert(change.rangeOffset, change.text)
                }
            })
        })
    })

    // 4. Batching/Flushing loop (Performance)
    const flushInterval = setInterval(() => {
        if (pendingUpdatesRef.current.length > 0) {
             const merged = Y.mergeUpdates(pendingUpdatesRef.current)
             pendingUpdatesRef.current = []
             socket.emit('code:yjs-update', merged)
        }
    }, 50) // 20fps
    
    const updateHandler = (update: Uint8Array, origin: any) => {
        if (origin !== 'remote') {
            pendingUpdatesRef.current.push(update)
        }
    }
    yDoc.on('update', updateHandler)

    // 5. Initial Load
    socket.emit('code:request-snapshot', { roomId })
    
    const handleSnapshot = (data: any) => {
        if (data?.state) {
             try {
                 const state = new Uint8Array(data.state.data || data.state)
                 Y.applyUpdate(yDoc, state)
             } catch (e) { console.error("Snapshot load error:", e) }
        } else {
             // If server empty, init with current code (template)
             if (yText.toString() === "" && code) {
                 yText.insert(0, code)
             }
        }
        // Force sync UI
        if (yText.toString() !== model.getValue()) {
            isRemoteUpdate.current = true
            model.setValue(yText.toString())
            isRemoteUpdate.current = false
        }
    }
    socket.on('code:snapshot', handleSnapshot)

    return () => {
        socket.off('code:yjs-update', handleYjsUpdate)
        socket.off('code:snapshot', handleSnapshot)
        yText.unobserve(yTextObserver)
        disposable.dispose()
        yDoc.off('update', updateHandler)
        clearInterval(flushInterval)
    }

  }, [socket, editorRef.current, roomId]) // Add roomId to re-init on room change

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return
    cursors
      .filter(c => c.userId !== currentUserId)
      .forEach(cursor => {
        renderRemoteCursor(
          editorRef.current!,
          monacoRef.current!,
          cursor.userId,
          cursor.username,
          cursor.position
        )
      })

  }, [cursors, currentUserId])

  useEffect(() => {
    otherParticipants = participants.filter(
      (p) => p.userId !== currentUserId && p.isOnline
    )
  }, [participants])

  return (
    <div className="h-full flex flex-col relative" onMouseMove={onMouseMove}>
      {activeEditors.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 bg-black/65 backdrop-blur-md text-white text-sm font-medium rounded-full flex items-center gap-2 shadow-lg pointer-events-none">
          <User className="h-3.5 w-3.5" />
          {activeEditors.length === 1
            ? `${activeEditors[0]} is editing`
            : `${activeEditors.length} editing`}
        </div>
      )}

      <Card className="border-0 bg-transparent shadow-none flex-1 flex flex-col pt-0 pl-0">
        <TooltipProvider>
          <div className="flex items-center justify-between gap-2 m-0 px-4 border-b border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="justify-between gap-2 text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {currentLangObj.label}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {languages.map((lang) => {
                  const LangIcon = lang.icon
                  return (
                    <DropdownMenuItem
                      key={lang.value}
                      onClick={() => handleLanguageChange(lang.value)}
                      className="gap-2"
                    >
                      <LangIcon className="h-4 w-4" />
                      {lang.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2">
              {otherParticipants.length > 0 && (
                <div className="flex -space-x-2">
                  {otherParticipants.slice(0, 6).map((p) => (
                    <Tooltip key={p.username}>
                      <TooltipTrigger asChild>
                        <Avatar className="h-6 w-6 border-2 border-background shadow-sm">
                          <AvatarImage
                            src={""}
                            alt={p.username}
                          />
                          <AvatarFallback
                            style={{ backgroundColor: getUserColor(p.username) }}
                            className="text-white text-xs font-medium"
                          >
                            {p.username.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>

                      <TooltipContent className="bg-secondary border text-primary/80" side="bottom" align="center">
                        <p className="text-xs font-medium">{p.username}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}

                  {otherParticipants.length > 6 && (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium border-2 border-background shadow-sm">
                      +{otherParticipants.length - 6}
                    </div>
                  )}
                </div>
              )}
              <Tooltip key="Ach">
                <TooltipTrigger asChild>
                  <Button
                    className={cn("text-muted-foreground", isCopySuccess && "text-green-500")}
                    variant="ghost"
                    size="icon"
                    disabled={isCopySuccess}
                    onClick={() => {
                      handleCopy()
                      setIsCopySuccess(true)
                      setTimeout(() => setIsCopySuccess(false), 2000)
                    }}
                    title="Copy code"
                  >
                    {isCopySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>

                <TooltipContent className="bg-secondary border text-primary/80" side="bottom" align="center">
                  <p className="text-xs font-medium">Copy Code</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip key="key1">
                <TooltipTrigger asChild>
                  <Button
                    className={cn("text-muted-foreground", isDownloadSuccess && "text-green-500")}
                    variant="ghost"
                    size="icon"
                    disabled={isDownloadSuccess}
                    onClick={() => {
                      handleDownload()
                      setIsDownloadSuccess(true)
                      setTimeout(() => setIsDownloadSuccess(false), 2000)
                    }}
                    title="Download code"
                  >
                    {isDownloadSuccess ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-secondary border text-primary/80" side="bottom" align="center">
                  <p className="text-xs font-medium">Download</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip key="key2">
                <TooltipTrigger asChild>
                  <Button
                    className={cn("text-muted-foreground", isResetSuccess && "text-green-500")}
                    variant="ghost"
                    size="icon"
                    disabled={isResetSuccess}
                    onClick={async () => {
                      await handleReset();
                      setIsResetSuccess(true);
                      setTimeout(() => setIsResetSuccess(false), 2000);
                    }}
                    title="Reset code"
                  >
                    {isResetSuccess ? <Check className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-secondary border text-primary/80" side="bottom" align="center">
                  <p className="text-xs font-medium">Reset</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
        <CardContent className="flex-1 mt-[-20px] p-0 relative">
          <Editor
            height="100%"
            language={currentLanguage}
            value={code}
            onChange={(v) => {
                if (isRemoteUpdate.current) {
                    // Bypass coordinator/broadcast for remote updates, but keep store in sync
                    useCodeEditorStore.setState({ code: v ?? "" })
                    return
                }
                handleEditorChange(v ?? "")
            }}
            beforeMount={(monaco: Monaco) => {
              monaco.editor.defineTheme("leetcode-dark", {
                base: "vs-dark",
                inherit: true,
                rules: [
                  { token: "", foreground: "e1dfdf" },
                  { token: "comment", foreground: "8e8e8e" },
                  { token: "keyword", foreground: "fd8da3" },
                  { token: "constant", foreground: "8da8ff" },
                  { token: "variable", foreground: "ffd395" },
                  { token: "variable.parameter", foreground: "e1dfdf" },
                  { token: "string", foreground: "77d5a3" },
                  { token: "regexp", foreground: "77d5a3", fontStyle: "bold" },
                  { token: "function", foreground: "8da8ff" },
                  { token: "type", foreground: "bd9cfe" },
                  { token: "class", foreground: "bd9cfe" },
                  { token: "tag", foreground: "77d5a3" },
                  { token: "property", foreground: "85cdf1" },
                  { token: "operator", foreground: "e1dfdf" },
                  { token: "delimiter", foreground: "e1dfdf" },
                  { token: "invalid", foreground: "ffc6d0", fontStyle: "italic" },
                  { token: "markup.heading", foreground: "8da8ff", fontStyle: "bold" },
                  { token: "markup.bold", foreground: "e1dfdf", fontStyle: "bold" },
                  { token: "markup.italic", foreground: "e1dfdf", fontStyle: "italic" },
                  { token: "markup.quote", foreground: "77d5a3" },
                  { token: "markup.raw", foreground: "8da8ff" },
                  { token: "diff.inserted", foreground: "77d5a3" },
                  { token: "diff.deleted", foreground: "ffc6d0" },
                  { token: "diff.changed", foreground: "ffd395" },
                ],
                colors: {
                  "editor.background": "#17181a",
                  "editor.lineHighlightBackground": "#2A2C34",
                  "editor.selectionBackground": "#23365D",
                  "editorCursor.foreground": "#ffffff",
                },
              })
              monaco.editor.defineTheme("leetcode-light", {
                base: "vs",
                inherit: true,
                rules: [
                  { token: "", foreground: "292929" },
                  { token: "comment", foreground: "707070" },
                  { token: "keyword", foreground: "c43058" },
                  { token: "constant", foreground: "3252b8" },
                  { token: "variable", foreground: "d07826" },
                  { token: "variable.parameter", foreground: "292929" },
                  { token: "string", foreground: "007b49" },
                  { token: "regexp", foreground: "007b49", fontStyle: "bold" },
                  { token: "function", foreground: "3252b8" },
                  { token: "type", foreground: "6f4cde" },
                  { token: "class", foreground: "6f4cde" },
                  { token: "tag", foreground: "007b49" },
                  { token: "property", foreground: "0075a2" },
                  { token: "operator", foreground: "292929" },
                  { token: "delimiter", foreground: "292929" },
                  { token: "invalid", foreground: "ad1c48", fontStyle: "italic" },
                  { token: "markup.heading", foreground: "3252b8", fontStyle: "bold" },
                  { token: "markup.bold", foreground: "292929", fontStyle: "bold" },
                  { token: "markup.italic", foreground: "292929", fontStyle: "italic" },
                  { token: "markup.quote", foreground: "007b49" },
                  { token: "markup.raw", foreground: "3252b8" },
                  { token: "diff.inserted", foreground: "007b49" },
                  { token: "diff.deleted", foreground: "ad1c48" },
                  { token: "diff.changed", foreground: "d07826" },
                ],
                colors: {
                  "editor.background": "#00000000",
                  "editor.lineHighlightBackground": "#0000000a",
                  "editor.selectionBackground": "#0000001a",
                  "editorCursor.foreground": "#000000",
                },
              })
            }}
            onMount={(editor, monaco) => {
              monaco.editor.remeasureFonts()
              editorRef.current = editor
              monacoRef.current = monaco
              monaco.editor.remeasureFonts()
              editor.onDidChangeCursorPosition((e) => {
                sendCursorPosition(e.position)
              })
            }}

            theme={resolvedTheme === "dark" ? "leetcode-dark" : "leetcode-light"}
            options={{
              minimap: { enabled: false },
              fontFamily: fontFamily,
              fontSize: fontSize,
              lineHeight: 22,
              fontLigatures,
              cursorStyle: "line",
              renderLineHighlight: "line",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
            }}
          />
        </CardContent>
      </Card>
    </div >
  )
}
