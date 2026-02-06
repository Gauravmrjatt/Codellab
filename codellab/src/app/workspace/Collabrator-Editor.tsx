"use client"
import { useState, useEffect, useRef } from "react"
import { ChatPanel } from "@/components/chat-panel"
import { ParticipantList } from "@/components/participant-list"
import { useWebSocket } from "@/hooks/use-websocket"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  FileText,
  Plus,
} from "lucide-react"
import { DockviewReact, DockviewApi, themeReplit } from "dockview"
import 'dockview/dist/styles/dockview.css'
import "@/app/leetcode-dockview.css"

import { WebSocketProvider } from "@/context/WebSocketProvider"
import { useDockRefStore } from "@/stores/dock-ref-store";
import { useEditorSettingStore } from "@/stores/editor-settings-store";
import { EditorPanel } from "./EditorPanel";
import { OutputPanel } from "./OutputPanel";
import { ConsolePanel } from "./ConsolePanel";
import Header from "./Header";
import { CustomTab } from "@/components/custom-tabs";
import { BlockNoteEditor } from '@/components/block-note-editor'
import { Whiteboard } from '@/components/drawing'
import { ProblemDescriptionPanel } from './ProblemDescriptionPanel';
import { TestCasesPanel } from './TestCasesPanel';
import { SubmissionResultPanel } from "./SubmissionResultPanel";

interface Participant {
  id: string
  username: string
  color: string
  isOnline: boolean
  role: "reader" | "writer" | "admin"
  cursor?: { x: number; y: number }
}

interface CollaborativeEditorProps {
  roomId: string
  roomName: string
  questionId?: string
  initialParticipants: Participant[]
  initialFiles: Array<{ name: string; language: string; content: string }>
  currentUserId: string
  currentUsername: string
  onCodeChange?: (code: string) => void
  inviteCode?: string
  isPublic?: boolean
}

/* ---------------- Utilities ---------------- */

// Generate a consistent color from a user ID
function getUserColor(userId: string): string {
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#8b5cf6", // purple
    "#f59e0b", // orange
    "#ec4899", // pink
    "#6366f1", // indigo
    "#14b8a6", // teal
    "#f97316", // deep orange
  ]

  // Handle undefined, null, or empty userId
  if (!userId || userId.length === 0) {
    return colors[0] // Return default color
  }

  // Simple hash function to get consistent color for userId
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

/* ---------------- Dockview Panels ---------------- */

function SidebarPanel({ params }: any) {
  const {
    type,
    files,
    activeFile,
    setActiveFile,
    handleCreateFile,
    participants,
    currentUserId,
    roomId,
    currentUsername,
    userColor,
  } = params || {}
  if (type === "files") {
    return (
      <Card className="h-full bg-transparent border-0 flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <CardTitle className="text-sm">Files</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                {/* <Button size="icon" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button> */}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create File</DialogTitle>
                </DialogHeader>
                <Input
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    handleCreateFile(e.currentTarget.value)
                  }
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto space-y-2">
          {files.map((file: any) => (
            <button
              key={file.name}
              className={`w-full text-left p-3 border rounded-md ${activeFile === file.name
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted"
                }`}
            >
              <FileText className="inline mr-2 h-5 w-5" />
              {file.name}
            </button>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (type === "participants") {
    return (
      <ParticipantList
      />
    )
  }

  if (type === "chat") {
    return (
      <ChatPanel
      />
    )
  }
  if (type === "note") {
    return (
      <BlockNoteEditor
        roomId={roomId}
        userId={currentUserId}
        username={currentUsername}
        userColor={userColor || getUserColor(currentUserId)}
      />
    )
  }
  if (type === "whiteboard") {
    return (<Whiteboard />)
  }
  if (type === "submission") {
    return (<SubmissionResultPanel {...params} />)
  }
  return <></>
}
/* ---------------- Main Component ---------------- */
export function CollaborativeEditor({
  roomId,
  roomName,
  questionId,
  initialParticipants,
  initialFiles,
  currentUserId,
  currentUsername,
  inviteCode,
  isPublic
}: CollaborativeEditorProps) {
  /* =========================
    FILE STATE (SOURCE OF TRUTH)
    ========================= */

  const [files, setFiles] = useState<{ name: string; language: string; content: string }[]>(
    initialFiles.length
      ? initialFiles
      : [
        {
          name: "main.js",
          language: "javascript",
          content: "// Main solution file",
        },
      ]
  )

  const [activeFile, setActiveFile] = useState(
    initialFiles[0]?.name ?? "main.js"
  )
  const { dockviewTheme } = useEditorSettingStore()
  const { theme: appTheme, systemTheme } = useTheme()
  const resolvedDockviewTheme = dockviewTheme === 'system'
    ? (appTheme === 'dark' || (appTheme === 'system' && systemTheme === 'dark') ? 'dockview-theme-dark' : 'dockview-theme-light')
    : dockviewTheme

  /* =========================
     DOCKVIEW
     ========================= */

  const dockviewRef = useRef<DockviewApi | null>(null)

  const { setDockviewRef } = useDockRefStore()

  useEffect(() => {
    if (dockviewRef.current) {
      const panel = dockviewRef.current.getPanel('files');
      if (panel) {
        panel.api.updateParameters({ files, activeFile });
      }
    }
  }, [files, activeFile]);

  useEffect(() => {
    if (dockviewRef.current) {
      const api = dockviewRef.current;
      api.panels.forEach(panel => {
        panel.api.updateParameters({ questionId });
      });

      if (questionId) {
        if (!api.getPanel('problem-description')) {
          api.addPanel({
            tabComponent: "default",
            id: "problem-description",
            component: "problem-description",
            title: "Description",
            minimumHeight: 100,
            minimumWidth: 300,
            initialWidth: 400,
            position: { referencePanel: "files", direction: "within", index: 0 },
            params: { roomId, questionId },
          });
        }
        if (!api.getPanel('test-cases')) {
          api.addPanel({
            tabComponent: "default",
            id: "test-cases",
            component: "test-cases",
            title: "Test Cases",
            minimumWidth: 300,
            initialWidth: 900,
            minimumHeight: 45,
            position: { referencePanel: "output", direction: "within", index: 0 },
            params: { roomId, questionId },
          });
        }
      } else {
        ["problem-description", "test-cases"].forEach(id => {
          api.getPanel(id)?.api.close();
        });
      }
    }
  }, [questionId, roomId]);

  const handleCreateFile = async (name: string) => {
    const res = await fetch(`/api/rooms/${roomId}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })

    if (!res.ok) return

    const newFile = await res.json()
    setFiles(prev => [...prev, newFile])
    setActiveFile(newFile.name)
  }
  const saveLayout = (api: DockviewApi) => {
    const layout = api.toJSON()
    localStorage.setItem("dockview-layout", JSON.stringify(layout))
  }

  return (
    <WebSocketProvider
      roomId={roomId}
      userId={currentUserId}
      username={currentUsername}
    >
      <div className="h-screen flex flex-col overflow-hidden">
        <Header roomId={roomId} roomName={roomName} questionId={questionId} inviteCode={inviteCode} isPublic={isPublic} />
        <div className="flex-1 overflow-hidden">
          <DockviewReact
            className="h-full"
            components={{
              sidebar: SidebarPanel,
              editor: (props) => <EditorPanel key={`${props.params.roomId}-${props.params.questionId}`} {...props.params} />,
              output: ({ params }) => <OutputPanel {...params} />,
              console: ({ params }) => <ConsolePanel {...params} />,
              "problem-description": (props) => <ProblemDescriptionPanel key={props.params.questionId} {...props.params} />,
              "test-cases": (props) => <TestCasesPanel key={props.params.questionId} {...props.params} />,
            }}
            tabComponents={{
              default: CustomTab
            }}
            onReady={(event) => {
              const api = event.api
              dockviewRef.current = api;
              // Global params that all panels should have access to
              const globalParams = {
                roomId,
                currentUserId,
                currentUsername,
                userColor: getUserColor(currentUserId),
                questionId
              }

              const saved = localStorage.getItem("dockview-layout");
              if (saved) {
                const layout = JSON.parse(saved);

                // Helper to recursively update params in the layout JSON
                const updateParamsRecursive = (item: any) => {
                  if (item.tabs) {
                    item.tabs.forEach((tab: any) => {
                      if (tab.content) {
                        tab.content.params = {
                          ...tab.content.params,
                          ...globalParams,
                          // Also restore non-serializable params for specific panels
                          ...(tab.id === 'files' ? { files, activeFile, setActiveFile, handleCreateFile } : {}),
                          ...(tab.id === 'editor' ? { roomId, currentUserId, currentUsername, questionId } : {}),
                          ...(tab.id === 'problem-description' || tab.id === 'test-cases' ? { roomId, questionId } : {}),
                        };
                      }
                    });
                  }
                  if (item.children) {
                    item.children.forEach(updateParamsRecursive);
                  }
                };

                if (layout.main) {
                  updateParamsRecursive(layout.main);
                }

                api.fromJSON(layout)

                // Inject global params into all restored panels
                api.panels.forEach(panel => {
                  panel.api.updateParameters({
                    ...panel.params,
                    ...globalParams,
                  })
                })
    
                api.getPanel('submission')?.api.close();
                // Add problem description and test cases panels if questionId is present
                if (questionId) {
                  // Add problem description panel if it doesn't exist
                  if (!api.getPanel('problem-description')) {
                    api.addPanel({
                      tabComponent: "default",
                      id: "problem-description",
                      component: "problem-description",
                      title: "Problem Description",
                      minimumHeight: 100,
                      minimumWidth: 300,
                      initialWidth: 400,
                      position: { referencePanel: "files", direction: "within" },
                      params: {
                        roomId,
                        questionId,
                      },
                    });
                  }

                  // Add test cases panel if it doesn't exist
                  if (!api.getPanel('test-cases')) {
                    api.addPanel({
                      tabComponent: "default",
                      id: "test-cases",
                      component: "test-cases",
                      title: "Test Cases",
                      minimumHeight: 45,
                      position: { referencePanel: "output", direction: "within" },
                      params: {
                        roomId,
                        questionId,
                      },
                    });
                  }
                } else {
                  ["problem-description", "test-cases", "submission"].forEach(id => {
                    api.getPanel(id)?.api.close();
                  });
                }
              } else {

                api.addPanel({
                  tabComponent: "default",
                  id: "files",
                  component: "sidebar",
                  title: "files",
                  minimumHeight: 45,
                  initialHeight: 45,
                  initialWidth: 45,
                  minimumWidth: 45,
                  params: {
                    type: "files",
                    files,
                    activeFile,
                    setActiveFile,
                    handleCreateFile,
                  },
                })
                api.addPanel({
                  tabComponent: "default",
                  id: "participants",
                  component: "sidebar",
                  title: "Participants",
                  minimumHeight: 45,
                  initialHeight: 45,
                  initialWidth: 45,
                  minimumWidth: 45,
                  position: { referencePanel: "files", direction: "within" },
                  params: {
                    type: "participants"
                  }
                })
                api.addPanel({
                  tabComponent: "default",
                  id: "chat",
                  component: "sidebar",
                  title: "Chat",
                  minimumHeight: 45,
                  initialWidth: 45,
                  minimumWidth: 45,
                  initialHeight: 45,
                  position: { referencePanel: "files", direction: "within" },
                  params: {
                    type: "chat"
                  }
                })

                // Add problem description panel if questionId is present
                if (questionId) {
                  api.addPanel({
                    tabComponent: "default",
                    id: "problem-description",
                    component: "problem-description",
                    title: "Description",
                    minimumHeight: 100,
                    minimumWidth: 300,
                    initialWidth: 400,
                    position: { referencePanel: "files", direction: "within", index: 0 },
                    params: {
                      roomId,
                      questionId,
                    },
                  });
                }

                api.addPanel({
                  tabComponent: "default",
                  id: "editor",
                  component: "editor",
                  title: "Code",
                  minimumHeight: 45,
                  initialHeight: 45,
                  minimumWidth: 500,
                  initialWidth: questionId ? 800 : 1250,
                  position: {
                    referencePanel: "files",
                    direction: "right",
                  },
                  params: {
                    type: "editor",
                    roomId: roomId,
                    currentUserId,
                    currentUsername,
                    questionId,
                  },
                })

                api.addPanel({
                  tabComponent: "default",
                  id: "output",
                  component: "output",
                  title: "Output",
                  minimumHeight: 45,
                  initialHeight: 45,
                  position: {
                    referencePanel: "editor",
                    direction: "below"
                  },
                  params: {
                    type: "output",
                  },
                })

                // Add test cases panel if questionId is present
                if (questionId) {
                  api.addPanel({
                    tabComponent: "default",
                    id: "test-cases",
                    component: "test-cases",
                    title: "Test Cases",
                    minimumWidth: 300,
                    initialWidth: 900,
                    minimumHeight: 45,
                    position: { referencePanel: "output", direction: "within", index: 0 },
                    params: {
                      roomId,
                      questionId,
                    },
                  });

                  // Add console panel as a separate tab within the test cases area
                  api.addPanel({
                    tabComponent: "default",
                    id: "console",
                    component: "console",
                    title: "Console",
                    minimumHeight: 45,
                    initialHeight: 45,
                    position: { referencePanel: "test-cases", direction: "within" },
                    params: {
                      type: "console",
                    },
                    inactive: true,
                  });
                } else {
                  // If no questionId, add console panel as a tab within output
                  api.addPanel({
                    tabComponent: "default",
                    id: "console",
                    component: "console",
                    title: "Console",
                    minimumHeight: 45,
                    initialHeight: 45,
                    position: { referencePanel: "output", direction: "within" },
                    params: {
                      type: "console",
                    },
                    inactive: true,
                  });
                }
              }
              api.onDidLayoutChange(() => {
                saveLayout(api)
              })
              setTimeout(() => {
                setDockviewRef(api)
              }, 0)
            }}
            theme={
              {
                ...themeReplit,
                gap: 3,
                className: resolvedDockviewTheme
              }
            }
          />
        </div>
      </div>
    </WebSocketProvider>
  )
}

