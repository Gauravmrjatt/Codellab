"use client"

import { useState } from "react"
import { type Question } from "@prisma/client"
import { useRouter } from "next/navigation"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Loader2, Send, Users, Plus, Search } from "lucide-react"
import Editor from "@monaco-editor/react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface ProblemSolverProps {
    question: Question & {
        testCases: {
            id: string
            input: string | null
            output: string | null
            inputs: any
            expectedOutput: any
            visibility: 'PUBLIC' | 'HIDDEN'
            isPublic: boolean | null
        }[]
        inputs: {
            id: string
            name: string
            type: string
            description: string | null
            order: number
        }[]
        output: {
            id: string
            type: string
            description: string | null
        } | null
    }
    currentUserId: string
    contestId?: string
    userRooms?: {
        id: string
        name: string
        updatedAt: string
    }[]
}

export function ProblemSolver({ question, currentUserId, contestId, userRooms = [] }: ProblemSolverProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("description")
    const [consoleTab, setConsoleTab] = useState("testcase")
    const [customInput, setCustomInput] = useState("")
    const [isCustomInputOpen, setIsCustomInputOpen] = useState(false)
    const [isRunning, setIsRunning] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [code, setCode] = useState(question.starterCode || "")
    const [language, setLanguage] = useState("javascript")
    const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
    const [roomSearchQuery, setRoomSearchQuery] = useState("")

    const handleRun = async () => {
        if (!code) return
        setIsRunning(true)
        setConsoleTab("result")
        setResult({ status: "running" })

        try {
            const response = await fetch("/api/judge/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    language,
                    questionId: question.id,
                    mode: "run",
                    customInput: isCustomInputOpen ? customInput : undefined
                }),
            })
            const data = await response.json()
            setResult(data)
        } catch (error) {
            setResult({ status: "error", message: "Execution failed" })
            toast.error("Execution failed")
        } finally {
            setIsRunning(false)
        }
    }

    const handleSubmit = async () => {
        if (!code) return
        setIsSubmitting(true)
        setResult({ status: "running" })

        try {
            const response = await fetch("/api/judge/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    language,
                    questionId: question.id,
                    contestId,
                    mode: "submit",
                }),
            })
            const data = await response.json()
            setResult(data)
        } catch (error) {
            setResult({ status: "error", message: "Submission failed" })
            toast.error("Submission failed")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleOpenInWorkspace = () => {
        setIsRoomDialogOpen(true)
    }

    const handleRoomSelect = (roomId: string) => {
        router.push(`/workspace?questionId=${question.id}&room=${roomId}`)
    }

    const handleCreateRoom = () => {
        const roomId = Math.random().toString(36).substring(7)
        router.push(`/workspace?questionId=${question.id}&room=${roomId}`)
    }

    const filteredRooms = userRooms.filter(room => 
        room.name.toLowerCase().includes(roomSearchQuery.toLowerCase())
    )

    return (
        <div className="h-[calc(100vh-4rem)]">
            <ResizablePanelGroup direction="horizontal">
                {/* Left Panel - Question Description */}
                <ResizablePanel defaultSize={40} minSize={30}>
                    <div className="h-full flex flex-col bg-background border-r">
                        <div className="border-b px-4 h-12 flex items-center gap-6">
                            <button
                                onClick={() => setActiveTab("description")}
                                className={`text-sm font-medium h-full border-b-2 px-1 transition-colors ${activeTab === 'description' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                Description
                            </button>
                            <button
                                onClick={() => setActiveTab("submissions")}
                                className={`text-sm font-medium h-full border-b-2 px-1 transition-colors ${activeTab === 'submissions' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                Submissions
                            </button>
                        </div>
                        <ScrollArea className="flex-1 p-6">
                            {activeTab === "description" ? (
                                <div className="space-y-6">
                                    <div>
                                        <h1 className="text-2xl font-bold mb-2">{question.title}</h1>
                                        <div className="flex gap-2 text-sm text-muted-foreground">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${question.difficulty === 'EASY' ? 'bg-green-500/10 text-green-500' :
                                                question.difficulty === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500' :
                                                    'bg-red-500/10 text-red-500'
                                                }`}>
                                                {question.difficulty}
                                            </span>
                                            {contestId && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                                                    Contest Mode
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <div dangerouslySetInnerHTML={{ __html: question.description }} />
                                    </div>

                                    <div className="space-y-4 pt-4 border-t">
                                        <h3 className="font-medium">Examples</h3>
                                        {question.testCases.filter(tc => tc.visibility === 'PUBLIC').map((testCase, i) => (
                                            <div key={i} className="rounded-lg border bg-muted/50 p-4 space-y-3">
                                                <div className="space-y-1">
                                                    <span className="text-xs font-medium text-muted-foreground uppercase">Input</span>
                                                    <pre className="text-sm bg-background p-2 rounded border overflow-x-auto">{JSON.stringify(testCase.inputs)}</pre>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-xs font-medium text-muted-foreground uppercase">Output</span>
                                                    <pre className="text-sm bg-background p-2 rounded border overflow-x-auto">{JSON.stringify(testCase.expectedOutput)}</pre>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    No submissions yet
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </ResizablePanel>

                <ResizableHandle />

                {/* Right Panel - Code Editor */}
                <ResizablePanel defaultSize={60}>
                    <ResizablePanelGroup direction="vertical">
                        <ResizablePanel defaultSize={60} minSize={30}>
                            <div className="h-full flex flex-col bg-background">
                                <div className="border-b h-12 flex items-center justify-between px-4 bg-muted/10">
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="h-8 rounded-md border bg-background px-2 text-sm"
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                        >
                                            <option value="javascript">JavaScript</option>
                                            <option value="python">Python</option>
                                            <option value="cpp">C++</option>
                                            <option value="java">Java</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!contestId && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleOpenInWorkspace}
                                            >
                                                <Users className="w-4 h-4 mr-2" />
                                                Open in Workspace
                                            </Button>
                                        )}
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleRun}
                                            disabled={isRunning || isSubmitting}
                                        >
                                            {isRunning ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <Play className="w-4 h-4 mr-2" />
                                            )}
                                            Run
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleSubmit}
                                            disabled={isRunning || isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <Send className="w-4 h-4 mr-2" />
                                            )}
                                            Submit
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <Editor
                                        height="100%"
                                        language={language}
                                        value={code}
                                        onChange={(value) => setCode(value || "")}
                                        theme="vs-dark"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            lineNumbers: "on",
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                        }}
                                    />
                                </div>
                            </div>
                        </ResizablePanel>

                        <ResizableHandle />

                        <ResizablePanel defaultSize={40} minSize={20}>
                            <div className="h-full flex flex-col bg-background">
                                <div className="flex items-center justify-between px-4 border-b h-10 bg-muted/10">
                                    <div className="flex gap-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`h-8 ${consoleTab === "testcase" ? "bg-secondary" : ""}`}
                                            onClick={() => setConsoleTab("testcase")}
                                        >
                                            Testcase
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`h-8 ${consoleTab === "result" ? "bg-secondary" : ""}`}
                                            onClick={() => setConsoleTab("result")}
                                        >
                                            Test Result
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-auto p-4">
                                    {consoleTab === "testcase" ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Checkbox
                                                    id="custom-input"
                                                    checked={isCustomInputOpen}
                                                    onCheckedChange={(checked) => setIsCustomInputOpen(!!checked)}
                                                />
                                                <label
                                                    htmlFor="custom-input"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Use Custom Input
                                                </label>
                                            </div>

                                            {isCustomInputOpen ? (
                                                <div className="space-y-2">
                                                    <div className="text-xs font-medium text-muted-foreground">Input</div>
                                                    <div className="relative">
                                                        <Textarea
                                                            value={customInput}
                                                            onChange={(e) => setCustomInput(e.target.value)}
                                                            className="font-mono text-sm min-h-[100px] resize-none bg-muted/50"
                                                            placeholder="Enter your custom input here..."
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {question.testCases.filter(tc => tc.isPublic).map((testCase, i) => (
                                                        <div key={i} className="space-y-2">
                                                            <div className="text-xs font-medium text-muted-foreground">Case {i + 1}</div>
                                                            <div className="space-y-1">
                                                                <div className="text-xs text-muted-foreground">Input:</div>
                                                                <div className="p-3 rounded-md bg-muted/50 font-mono text-sm">
                                                                    {testCase.input}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="text-xs text-muted-foreground">Output:</div>
                                                                <div className="p-3 rounded-md bg-muted/50 font-mono text-sm">
                                                                    {testCase.output}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-full">
                                            {!result ? (
                                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                                                    <div className="p-3 bg-muted/50 rounded-lg">
                                                        <Play className="w-5 h-5 text-muted-foreground/60" />
                                                    </div>
                                                    <div className="text-sm">Run your code to see results</div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {result.status === "running" ? (
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            <span>Running code...</span>
                                                        </div>
                                                    ) : result.status === "error" ? (
                                                        <div className="p-4 rounded-lg bg-red-500/10 text-red-500 space-y-2">
                                                            <h4 className="font-semibold">Execution Error</h4>
                                                            <pre className="text-xs font-mono whitespace-pre-wrap">{result.message}</pre>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className={`p-4 rounded-lg ${result.status === "Accepted" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                                                <h4 className="font-semibold">{result.status}</h4>
                                                            </div>
                                                            {result.output && (
                                                                <div className="space-y-1">
                                                                    <div className="text-xs text-muted-foreground">Output</div>
                                                                    <div className="p-3 rounded-md bg-muted/50 font-mono text-sm whitespace-pre-wrap">
                                                                        {result.output}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {result.expectedOutput && (
                                                                <div className="space-y-1">
                                                                    <div className="text-xs text-muted-foreground">Expected Output</div>
                                                                    <div className="p-3 rounded-md bg-muted/50 font-mono text-sm whitespace-pre-wrap">
                                                                        {result.expectedOutput}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>

            <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Collaborate</DialogTitle>
                        <DialogDescription>
                            Join an existing room or create a new one to collaborate on this problem.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search rooms..."
                                    className="pl-9"
                                    value={roomSearchQuery}
                                    onChange={(e) => setRoomSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleCreateRoom}>
                                <Plus className="h-4 w-4 mr-2" />
                                New
                            </Button>
                        </div>

                        <ScrollArea className="h-[300px] rounded-md border p-4">
                            {filteredRooms.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                                    {roomSearchQuery ? "No rooms match your search" : "No rooms found"}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredRooms.map((room) => (
                                        <button
                                            key={room.id}
                                            onClick={() => handleRoomSelect(room.id)}
                                            className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                                        >
                                            <div>
                                                <div className="font-medium">{room.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Last active: {new Date(room.updatedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="text-xs text-primary group-hover:underline">
                                                Join
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

