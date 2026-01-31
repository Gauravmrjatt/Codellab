"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { CodeEditor } from "@/components/code-editor"
// import { CursorIndicator, type Cursor } from "@/components/cursor-indicator"
import { ChatPanel } from "@/components/chat-panel"
import { ParticipantList } from "@/components/participant-list"
import { useWebSocket } from "@/hooks/use-websocket"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SplitPane, Pane } from 'react-split-pane';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Users,
  MessageSquare,
  Settings,
  Share2,
  Play,
  Save,
  FileText,
  FolderOpen,
  Plus
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditorHeader } from "@/components/header/editor-header";
import { WebSocketProvider, useWS } from "@/context/WebSocketProvider";

interface Participant {
  id: string
  username: string
  color: string
  isOnline: boolean
  role: "reader" | "writer" | "admin"
  cursor?: { lineNumber: number; column: number }
  canWriteCode?: boolean
  canWriteNotes?: boolean
  canDraw?: boolean
  roomId: string
  userId: string
  lastSeen?: Date
}

interface CollaborativeEditorProps {
  roomId: string
  questionId?: string
  initialParticipants: Participant[]
  initialFiles: Array<{ name: string; language: string; content: string }>
  currentUserId: string
  currentUsername: string
  onCodeChange?: (code: string) => void
}

function CollaborativeEditorContent({
  roomId,
  questionId,
  initialParticipants,
  initialFiles,
  currentUserId,
  currentUsername,
  onCodeChange
}: CollaborativeEditorProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [code, setCode] = useState("")
  const [activeFile, setActiveFile] = useState(initialFiles[0]?.name || "main.js")
  const [files, setFiles] = useState(initialFiles.length > 0 ? initialFiles : [
    { name: "main.js", language: "javascript", content: "// Main solution file" }
  ])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Handle remote code change
  const handleRemoteCodeChange = useCallback((change: any) => {
    if (change.userId !== currentUserId) {
      const newCode = change.changes[0]?.content;
      if (newCode !== undefined) {
        setCode(newCode);
      }
    }
  }, [currentUserId]);

  const [remoteOutput, setRemoteOutput] = useState<any>(undefined)
  const [remoteLogs, setRemoteLogs] = useState<any>(undefined)

  const handleRemoteOutput = useCallback((data: { output: any; logs: any }) => {
    setRemoteOutput(data.output)
    setRemoteLogs(data.logs)
  }, [])

  const { participants: wsParticipants, isConnected, sendCodeChange, cursors, sendCursorPosition, sendOutput } = useWS()

  // Merge initial participants (from DB) with WebSocket participants (live status)
  const activeParticipants = useMemo(() => {
    const merged = [...initialParticipants];
    
    wsParticipants.forEach(wsUser => {
      const index = merged.findIndex(p => p.id === wsUser.id);
      if (index !== -1) {
        // Update existing user with live status
        merged[index] = { ...merged[index], ...wsUser, isOnline: true };
      } else {
        // Add new live user not in initial list (e.g. joined after page load)
        merged.push({ ...wsUser, isOnline: true });
      }
    });
    
    return merged;
  }, [initialParticipants, wsParticipants]);
  
  // Check permissions for current user
  const currentUser = activeParticipants.find((p: any) => p.id === currentUserId);
  // Default to true if permissions are not set (backward compatibility/initial load)
  // unless role is specifically reader
  const canWriteCode = currentUser?.canWriteCode ?? (currentUser?.role !== "reader");

  // Set initial code for the active file
  useEffect(() => {
    const activeFileContent = files.find(f => f.name === activeFile)?.content || ""
    setCode(activeFileContent)
  }, [activeFile])

  const handleLocalCodeChange = (newCode: string) => {
    setCode(newCode)

    // Update files state locally
    setFiles(prev => prev.map(file =>
      file.name === activeFile ? { ...file, content: newCode } : file
    ))

    // Broadcast change
    sendCodeChange(activeFile, [{ content: newCode }])

    // Notify parent
    if (onCodeChange) {
      onCodeChange(newCode)
    }
  }

  const handleCreateFile = async (name: string) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (response.ok) {
        const newFile = await response.json()
        const formattedFile = {
          name: newFile.name,
          language: newFile.name.endsWith('.py') ? 'python' : newFile.name.endsWith('.java') ? 'java' : 'javascript',
          content: newFile.content
        }
        setFiles(prev => [...prev, formattedFile])
        setActiveFile(newFile.name)
      }
    } catch (error) {
      console.error("Failed to create file:", error)
    }
  }

  const handleRunCode = (code: string) => {
    console.log("Running code:", code)
    // Code execution logic is handled inside CodeEditor
  }

  const handleCursorMove = (position: { lineNumber: number; column: number }) => {
    sendCursorPosition(position)
  }

  const currentFile = files.find(f => f.name === activeFile)

  if (!isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse">Initializing editor...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <EditorHeader />
      {/* Left Sidebar - File Explorer */}
      <SplitPane direction="horizontal" className="flex-1">
        <Pane className="p-2">
          <Card className="h-full  flex flex-col">
            <Tabs defaultValue="files" className="flex flex-col h-full">

              {/* Tabs Header */}
              <CardHeader className="pb-2">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="files">Files</TabsTrigger>
                  <TabsTrigger value="participants">Participants</TabsTrigger>
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                </TabsList>
              </CardHeader>

              {/* Files Tab */}
              <TabsContent value="files" className="flex-1 overflow-auto">
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Files</CardTitle>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create New File</DialogTitle>
                        </DialogHeader>
                        <Input
                          placeholder="e.g. solution.js"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleCreateFile(e.currentTarget.value)
                            }
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>

                  {files.map((file) => (
                    <button
                      key={file.name}
                      onClick={() => setActiveFile(file.name)}
                      className={`w-full text-left px-2 py-1.5 rounded-sm text-sm transition-colors ${activeFile === file.name
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        <span>{file.name}</span>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </TabsContent>

              {/* Participants Tab */}
              <TabsContent value="participants" className="flex-1 overflow-auto">
                <CardContent className="p-0">
                  <div className="px-4 py-2 text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Participants ({activeParticipants.length})
                  </div>
                  <ParticipantList participants={activeParticipants} />
                </CardContent>
              </TabsContent>

              {/* Chat Tab */}
              <TabsContent value="chat" className="flex-1 overflow-hidden">
                <CardContent className="p-0 flex flex-col h-full">
                  <ChatPanel />
                </CardContent>
              </TabsContent>

            </Tabs>
            <CardFooter>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {activeParticipants.filter((p: any) => p.isOnline).slice(0, 3).map((participant: any) => (
                    <div
                      key={participant.id}
                      className={`w-6 h-6 rounded-full ${participant.color} border-2 border-background flex items-center justify-center text-xs font-medium text-white`}
                      title={participant.username}
                    >
                      {participant.username[0]}
                    </div>
                  ))}
                  {activeParticipants.filter((p: any) => p.isOnline).length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                      +{activeParticipants.filter((p: any) => p.isOnline).length - 3}
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {activeParticipants.filter((p: any) => p.isOnline).length} online
                </span>
              </div>
            </CardFooter>
          </Card>
        </Pane>
        <Pane>
          <div className="flex-1 h-full flex flex-col m-2 ml-0 relative">
            {/* Code Editor */}
            <div className="flex-1 relative">
              <CodeEditor
                roomId={roomId}
                questionId={questionId}
                code={code}
                language={currentFile?.language || "javascript"}
                onCodeChange={handleLocalCodeChange}
                onRun={handleRunCode}
                onRunComplete={(output, logs) => {
                  sendOutput(output, logs, "accepted", false)
                  setRemoteOutput(output)
                  setRemoteLogs(logs)
                }}
                onCursorMove={handleCursorMove}
                externalOutput={remoteOutput}
                externalLogs={remoteLogs}
                readOnly={!canWriteCode}
              />

              {/* Cursor Indicators - Disabled because we use line/column now */}
              {/* <CursorIndicator
                cursors={cursors.map(c => ({ ...c, id: c.userId }))}
                currentUserId={currentUserId}
              /> */}
            </div>
          </div>
        </Pane>

      </SplitPane>
    </div>
  )
}

export function CollaborativeEditor({
  roomId,
  questionId,
  initialParticipants,
  initialFiles,
  currentUserId,
  currentUsername,
  onCodeChange
}: CollaborativeEditorProps) {
  return (
    <WebSocketProvider
      roomId={roomId}
      userId={currentUserId}
      username={currentUsername}
    >
      <CollaborativeEditorContent
        roomId={roomId}
        questionId={questionId}
        initialParticipants={initialParticipants}
        initialFiles={initialFiles}
        currentUserId={currentUserId}
        currentUsername={currentUsername}
        onCodeChange={onCodeChange}
      />
    </WebSocketProvider>
  );
}
