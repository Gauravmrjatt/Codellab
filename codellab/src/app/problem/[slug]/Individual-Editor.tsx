"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  FileText,
  Trophy
} from "lucide-react"
import { DockviewReact, DockviewApi, themeReplit } from "dockview"
import 'dockview/dist/styles/dockview.css'
import "@/app/leetcode-dockview.css"
import { WebSocketProvider } from "@/context/WebSocketProvider"
import { useDockRefStore } from "@/stores/dock-ref-store";
import { useEditorSettingStore } from "@/stores/editor-settings-store";
import { EditorPanel } from "@/app/workspace/EditorPanel";
import { OutputPanel } from "@/app/workspace/OutputPanel";
import { ConsolePanel } from "@/app/workspace/ConsolePanel";
import IndividualHeader from "@/app/problem/[slug]/IndividualHeader";
import { CustomTab } from "@/components/custom-tabs";
import { ProblemDescriptionPanel } from '@/app/workspace/ProblemDescriptionPanel';
import { TestCasesPanel } from '@/app/workspace/TestCasesPanel';
import { SubmissionResultPanel } from "@/app/workspace/SubmissionResultPanel"
import { useCodeEditorStore } from "@/stores/code-editor-store";
import { LeaderboardPanel } from "@/app/workspace/LeaderboardPanel";
import { Whiteboard } from "@/components/drawing/index"
import { BlockNoteEditor } from '@/components/block-note-editor'
interface Participant {
  id: string
  username: string
  color: string
  isOnline: boolean
  role: "reader" | "writer" | "admin"
  cursor?: { x: number; y: number }
}

interface IndividualEditorProps {
  roomId: string
  roomName: string
  questionId?: string
  initialParticipants: Participant[]
  initialFiles: Array<{ name: string; language: string; content: string }>
  currentUserId: string
  currentUsername: string
  userRooms?: {
    id: string
    name: string
    updatedAt: string
  }[];
  contestId?: string
  contest?: any
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
  const router = useRouter()
  const {
    type,
    files,
    activeFile,
    setActiveFile,
    handleCreateFile,
    currentUserId,
    roomId,
    currentUsername,
    userColor,
    contest,
    questionId
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
          {files?.map((file: any) => (
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

  if (type === "contest-problems") {
    return (
      <Card className="h-full bg-transparent border-0 flex flex-col">
  <CardHeader className="pb-3">
    <CardTitle className="text-sm flex items-center gap-2 font-semibold">
      <Trophy className="h-4 w-4 text-yellow-500" />
      Problems
    </CardTitle>
  </CardHeader>

  <CardContent className="flex-1 overflow-auto space-y-2 pr-1">
    {contest?.questions?.map((cq: any, index: number) => {
      const isActive = cq.question.id === questionId

      return (
        <button
          key={cq.question.id}
          onClick={() =>
            router.push(`/problem/${cq.question.slug}?contestId=${contest.id}`)
          }
          className={`
            group w-full text-left rounded-lg border p-3 transition-all
            ${isActive
              ? "border-primary bg-primary/10 ring-1 ring-primary/30"
              : "border-border hover:bg-muted/60 hover:border-muted-foreground/30"
            }
          `}
        >
          <div className="flex items-start justify-between gap-3">
            {/* Left */}
            <div className="space-y-1">
              <div
                className={`text-sm font-medium leading-tight
                  ${isActive ? "text-primary" : "group-hover:text-foreground"}
                `}
              >
                {index + 1}. {cq.question.title}
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{cq.points} pts</span>
                <span>•</span>
                <span className="capitalize">{cq.question.difficulty}</span>
              </div>
            </div>

            {/* Right indicator */}
            {isActive && (
              <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
        </button>
      )
    })}
  </CardContent>
</Card>

    )
  }
  if (type === "note") {
    return (
      <BlockNoteEditor
      />
    )
  }
  if (type === "leaderboard") {
    return (
      <LeaderboardPanel
        leaderboard={contest?.leaderboard || []}
        currentUsername={currentUsername}
      />
    )
  }

  if (type === "notes") {
    
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
export function IndividualEditor({
  roomId,
  roomName,
  questionId,
  initialFiles,
  currentUserId,
  currentUsername,
  userRooms,
  contestId,
  contest,
}: IndividualEditorProps) {
  const router = useRouter()
  const { reset } = useCodeEditorStore()

  useEffect(() => {
    reset()
  }, [])

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

  const handleCreateFile = async (name: string) => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (res.ok) {
        const newFile = await res.json()
        setFiles(prev => [...prev, newFile])
        setActiveFile(newFile.name)
        return
      }
    } catch (e) {
      // Fallback for individual mode without backend room
    }

    // Fallback: Add locally
    const newFile = { name, language: "javascript", content: "" }
    setFiles(prev => [...prev, newFile])
    setActiveFile(newFile.name)
  }

  const saveLayout = (api: DockviewApi) => {
    const layout = api.toJSON()
    const storageKey = `dockview-layout-individual${contestId ? "-contest" : ""}`;
    localStorage.setItem(storageKey, JSON.stringify(layout))
  }

  return (
    <WebSocketProvider
      roomId={roomId}
      userId={currentUserId}
      username={currentUsername}
      mock={true} // Enable mock mode for individual editor
    >
      <div className="h-screen flex flex-col overflow-hidden">
        <IndividualHeader
          roomId={roomId}
          roomName={contest ? contest.title : roomName}
          questionId={questionId}
          userRooms={userRooms}
          contestId={contestId}
          contest={contest}
        />
        <div className="flex-1 overflow-hidden">
          <DockviewReact
            className="h-full"
            components={{
              sidebar: SidebarPanel,
              editor: ({ params }) => <EditorPanel {...params} />,
              output: ({ params }) => <OutputPanel {...params} />,
              console: ({ params }) => <ConsolePanel {...params} />,
              "problem-description": ({ params }) => <ProblemDescriptionPanel {...params} />,
              "test-cases": ({ params }) => <TestCasesPanel {...params} />,
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
                questionId,
                contest
              }

              const storageKey = `dockview-layout-individual${contestId ? "-contest" : ""}`;
              const saved = localStorage.getItem(storageKey);
              if (saved) {
                api.fromJSON(JSON.parse(saved))

                // Inject global params into all restored panels
                api.panels.forEach(panel => {
                  panel.api.updateParameters({
                    ...panel.params,
                    ...globalParams,
                  })
                })

                // Filter panels according to mode
                if (contestId) {
                  api.getPanel('files')?.api.close();
                } else {
                  api.getPanel('contest-problems')?.api.close();
                  api.getPanel('leaderboard')?.api.close();
                  api.getPanel('submission')?.api.close();
                }

                // Ensure essential panels exist
                if (questionId) {
                  if (!api.getPanel('problem-description')) {
                    api.addPanel({
                      tabComponent: "default",
                      id: "problem-description",
                      component: "problem-description",
                      title: "Problem Description",
                      minimumHeight: 100,
                      minimumWidth: 300,
                      initialWidth: 400,
                      position: { referencePanel: api.panels[0]?.id || "editor", direction: "left" },
                      params: { roomId, questionId },
                    });
                  }
                  if (!api.getPanel('test-cases')) {
                    api.addPanel({
                      tabComponent: "default",
                      id: "test-cases",
                      component: "test-cases",
                      title: "Test Cases",
                      minimumHeight: 45,
                      minimumWidth: 300,
                      position: { referencePanel: "problem-description", direction: "below" },
                      params: { roomId, questionId },
                    });
                  }
                }

                if (contest && !api.getPanel('contest-problems')) {
                  api.addPanel({
                    tabComponent: "default",
                    id: "contest-problems",
                    component: "sidebar",
                    title: "Problems",
                    minimumWidth: 45,
                    initialWidth: 45,
                    position: { referencePanel: "problem-description", direction: "within", index: 0 },
                    params: {
                      type: "contest-problems",
                      contest,
                      questionId
                    }
                  })
                }
              } else {
                // Default Layout Logic

                // 1. Files (Individual) or Problems (Contest)
                if (!contestId) {
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
                } else {
                  api.addPanel({
                    tabComponent: "default",
                    id: "contest-problems",
                    component: "sidebar",
                    title: "Problems",
                    minimumWidth: 45,
                    initialWidth: 45,
                    params: {
                      type: "contest-problems",
                      contest,
                      questionId
                    }
                  })
                }

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
                    position: { referencePanel: contestId ? "contest-problems" : "files", direction: "within", index: 0 },
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
                    referencePanel: questionId ? "problem-description" : (contestId ? "contest-problems" : "files"),
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
              api.getPanel('files')?.api.close();
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
