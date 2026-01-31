"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CollaborativeEditor } from "@/components/collaborative-editor"
import { ChatPanel } from "@/components/chat-panel"
import { useWebSocket } from "@/hooks/use-websocket"
import { SubmissionHistory } from "@/components/submission-history"
import {
  Play,
  CheckCircle,
  Clock,
  Users,
  BookOpen,
  Code,
  TestTube,
  MessageSquare
} from "lucide-react"

interface TestResult {
  testCase: number
  input: string
  expectedOutput: string
  actualOutput: string
  passed: boolean
  isPublic: boolean
}

export interface Question {
  id: string
  title: string
  description: string
  difficulty: "easy" | "medium" | "hard"
  points: number
  constraints: string[]
  examples: Example[]
  starterCode: string
  testCases: TestCase[]
  tags: string[]
  timeLimit: number // in seconds
  memoryLimit: number // in MB
}

interface Example {
  input: string
  output: string
  explanation?: string
}

interface TestCase {
  input: string
  expectedOutput: string
  isPublic: boolean
}

interface SubmissionResult {
  status: "pending" | "accepted" | "wrong_answer" | "time_limit_exceeded" | "runtime_error" | "compilation_error"
  runtime?: number
  memory?: number
  testCasesPassed?: number
  totalTestCases?: number
  errorMessage?: string
}

interface QuestionInterfaceProps {
  questionId?: string
  roomId?: string
  contestId?: string
  participants?: Participant[]
  question?: Question // Allow passing question data directly
  onSubmit?: (code: string) => void // Callback for submission
}

interface Participant {
  id: string
  username: string
  isOnline: boolean
  color: string
  role: "reader" | "writer" | "admin"
  avatar?: string
  cursor?: { lineNumber: number; column: number }
  roomId: string
  userId: string
}

const mockQuestion: Question = {
  id: "1",
  title: "Two Sum",
  description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
  difficulty: "easy",
  points: 100,
  constraints: [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists."
  ],
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
    },
    {
      input: "nums = [3,2,4], target = 6",
      output: "[1,2]"
    },
    {
      input: "nums = [3,3], target = 6",
      output: "[0,1]"
    }
  ],
  starterCode: "function twoSum(nums, target) {\n  // Write your code here\n  return [];\n}",
  testCases: [
    { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", isPublic: true },
    { input: "[3,2,4], 6", expectedOutput: "[1,2]", isPublic: true },
    { input: "[3,3], 6", expectedOutput: "[0,1]", isPublic: false },
    { input: "[1,2,3,4,5], 8", expectedOutput: "[2,4]", isPublic: false }
  ],
  tags: ["Array", "Hash Table"],
  timeLimit: 1, // 1 second
  memoryLimit: 50 // 50 MB
}

const mockParticipants: Participant[] = [
  { id: "1", username: "alice", isOnline: true, color: "#FF6B6B", role: "admin", roomId: "room-123", userId: "1" },
  { id: "2", username: "bob", isOnline: true, color: "#4ECDC4", role: "writer", roomId: "room-123", userId: "2" },
  { id: "3", username: "charlie", isOnline: false, color: "#45B7D1", role: "writer", roomId: "room-123", userId: "3" },
  { id: "4", username: "diana", isOnline: true, color: "#96CEB4", role: "reader", roomId: "room-123", userId: "4" }
]

export function QuestionInterface({
  questionId = "1",
  roomId = "room-123",
  contestId,
  participants = mockParticipants,
  question: providedQuestion,
  onSubmit
}: QuestionInterfaceProps) {
  const [question] = useState(providedQuestion || mockQuestion)
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [code, setCode] = useState(question.starterCode)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [submissionsRefreshKey, setSubmissionsRefreshKey] = useState(0)

  const roomName = contestId ? `contest-${contestId}` : `question-${questionId}`

  const { sendMessage, isConnected } = useWebSocket(roomName, "1", "Guest")

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "text-green-600 bg-green-100"
      case "medium": return "text-yellow-600 bg-yellow-100"
      case "hard": return "text-red-600 bg-red-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmissionResult({ status: "pending" })

    try {
      // 1. Send submission to API
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: "javascript", // TODO: Make dynamic if multiple languages supported
          questionId: question.id,
          contestId,
          events: [] // TODO: Collect actual events if available
        })
      })

      if (!response.ok) {
        throw new Error("Submission failed")
      }

      const result = await response.json()

      // 2. Map API result to UI format
      // API returns: { status, verdict, passedTests, totalTests, runtime, message, ... }
      // UI expects: SubmissionResult
      const uiResult: SubmissionResult = {
        status: result.status.toLowerCase(), // API returns UPPERCASE, UI expects lowercase (based on previous mock)
        runtime: result.runtime,
        memory: result.memory || 0, // Fallback if missing
        testCasesPassed: result.passedTests,
        totalTestCases: result.totalTests,
        errorMessage: result.error || (result.status !== "ACCEPTED" ? result.message : undefined)
      }

      setSubmissionResult(uiResult)
      setSubmissionsRefreshKey(prev => prev + 1) // Refresh submission history

      // Call parent onSubmit callback if provided
      if (onSubmit) {
        onSubmit(code)
      }

      // Send result notification via WS
      const statusMessage = uiResult.status === "accepted"
        ? `✅ Problem solved! Runtime: ${uiResult.runtime}ms`
        : `❌ Submission failed: ${uiResult.status.replace(/_/g, " ")}`

      sendMessage(statusMessage, 'text')

    } catch (error) {
      console.error("Submission error:", error)
      setSubmissionResult({
        status: "runtime_error",
        errorMessage: "Failed to process submission"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRunTests = () => {
    // Simulate running test cases
    const results = question.testCases.map((testCase, index) => ({
      testCase: index + 1,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: "[0,1]", // Mock output
      passed: Math.random() > 0.2,
      isPublic: testCase.isPublic
    }))
    setTestResults(results)
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Sidebar - Problem Description */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="h-full">
            <Tabs defaultValue="description" className="w-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-lg">{question.title}</CardTitle>
                  <Badge className={getDifficultyColor(question.difficulty)}>
                    {question.difficulty.toUpperCase()}
                  </Badge>
                </div>
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="submissions">Submissions</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="h-[calc(100vh-300px)] overflow-y-auto">
                <TabsContent value="description" className="space-y-4 mt-0">
                  <CardDescription>
                    {question.points} points • {question.tags.join(", ")}
                  </CardDescription>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Description
                    </h4>
                    <p className="text-sm text-muted-foreground">{question.description}</p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Constraints</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {question.constraints.map((constraint, index) => (
                        <li key={index}>• {constraint}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <TestTube className="h-4 w-4" />
                      Examples
                    </h4>
                    {question.examples.map((example, index) => (
                      <div key={index} className="bg-muted p-3 rounded-lg text-sm space-y-1">
                        <div><strong>Input:</strong> {example.input}</div>
                        <div><strong>Output:</strong> {example.output}</div>
                        {example.explanation && (
                          <div><strong>Explanation:</strong> {example.explanation}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{question.timeLimit}s</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Code className="h-4 w-4" />
                      <span>{question.memoryLimit}MB</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="submissions" className="mt-0">
                  <SubmissionHistory questionId={question.id} key={submissionsRefreshKey} />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {testResults.filter(result => result.isPublic).map((result) => (
                    <div key={result.testCase} className="flex items-center justify-between text-sm">
                      <span>Test {result.testCase}</span>
                      {result.passed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="text-red-500 text-xs">Failed</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content - Code Editor */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Code Editor</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRunTests}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Code
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Submit
                  </Button>
                  <div className="w-px h-6 bg-border mx-2" />
                  <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
                    {isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-full">
              <CollaborativeEditor
                roomId={roomId}
                initialParticipants={participants}
                currentUserId="1"
                currentUsername="Guest"
                initialFiles={[{ name: "main.js", language: "javascript", content: code }]}
                onCodeChange={setCode}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Chat & Participants */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Participants</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowChat(!showChat)}
                  >
                    <MessageSquare className={`h-4 w-4 ${showChat ? "text-primary" : "text-muted-foreground"}`} />
                  </Button>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: participant.color }}
                    />
                    <span className="text-sm">{participant.username}</span>
                    <div className={`w-2 h-2 rounded-full ml-auto ${participant.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {showChat && (
            <Card className="h-96">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Discussion</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ChatPanel />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Submission Status */}
      {submissionResult && (
        <div className="fixed bottom-4 right-4">
          <Card className={`${submissionResult.status === "accepted" ? "bg-green-50 border-green-200" :
            submissionResult.status === "pending" ? "bg-yellow-50 border-yellow-200" :
              "bg-red-50 border-red-200"
            }`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {submissionResult.status === "accepted" && <CheckCircle className="h-5 w-5 text-green-600" />}
                {submissionResult.status === "pending" && <Clock className="h-5 w-5 text-yellow-600" />}
                {submissionResult.status === "wrong_answer" && <div className="w-5 h-5 text-red-600">❌</div>}

                <div>
                  <div className="font-medium capitalize">
                    {submissionResult.status.replace("_", " ")}
                  </div>
                  {submissionResult.runtime && submissionResult.memory && (
                    <div className="text-sm text-muted-foreground">
                      Runtime: {submissionResult.runtime}ms • Memory: {submissionResult.memory}MB
                    </div>
                  )}
                  {submissionResult.testCasesPassed && (
                    <div className="text-sm text-muted-foreground">
                      {submissionResult.testCasesPassed}/{submissionResult.totalTestCases} test cases passed
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}