"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWebSocket } from "@/hooks/use-websocket"
import { QuestionInterface, type Question } from "@/components/question-interface"
import { 
  Trophy, 
  Clock, 
  Users,
  Play,
  CheckCircle,
  Circle,
  AlertCircle
} from "lucide-react"

interface Contest {
  id: string
  name: string
  description: string
  startTime: Date | string
  endTime: Date | string
  duration: number // minutes
  participants: number
  maxParticipants: number
  difficulty: "easy" | "medium" | "hard"
  status: "upcoming" | "active" | "finished"
  problems: ContestProblem[]
  leaderboard: LeaderboardEntry[]
}

interface ContestProblem {
  id: string
  title: string
  description: string
  difficulty: "easy" | "medium" | "hard"
  points: number
  solvedBy: number
  totalAttempts: number
  starterCode: string
  testCases: TestCase[]
}

interface TestCase {
  input: string
  expectedOutput: string
  isPublic: boolean
}

interface LeaderboardEntry {
  rank: number
  username: string
  score: number
  solvedProblems: number
  totalTime: number
  lastSubmission: Date | string
}

interface ContestInterfaceProps {
  contestId?: string
  initialContest?: Contest
  userId: string
  username: string
}

const mockContest: Contest = {
  id: "1",
  name: "Weekly Contest #123",
  description: "Test your algorithmic skills with 4 challenging problems",
  startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  endTime: new Date(Date.now() + 90 * 60 * 1000), // 90 minutes from now
  duration: 120, // 2 hours
  participants: 156,
  maxParticipants: 1000,
  difficulty: "medium",
  status: "active",
  problems: [
    {
      id: "1",
      title: "Two Sum",
      description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      difficulty: "easy",
      points: 100,
      solvedBy: 145,
      totalAttempts: 200,
      starterCode: "function twoSum(nums, target) {\n  // Your code here\n}",
      testCases: [
        { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", isPublic: true },
        { input: "[3,2,4], 6", expectedOutput: "[1,2]", isPublic: true }
      ]
    },
    {
      id: "2",
      title: "Add Two Numbers",
      description: "You are given two non-empty linked lists representing two non-negative integers.",
      difficulty: "medium",
      points: 200,
      solvedBy: 89,
      totalAttempts: 150,
      starterCode: "function addTwoNumbers(l1, l2) {\n  // Your code here\n}",
      testCases: [
        { input: "[2,4,3], [5,6,4]", expectedOutput: "[7,0,8]", isPublic: true }
      ]
    },
    {
      id: "3",
      title: "Longest Substring",
      description: "Given a string s, find the length of the longest substring without repeating characters.",
      difficulty: "medium",
      points: 200,
      solvedBy: 67,
      totalAttempts: 120,
      starterCode: "function lengthOfLongestSubstring(s) {\n  // Your code here\n}",
      testCases: [
        { input: '"abcabcbb"', expectedOutput: "3", isPublic: true },
        { input: '"bbbbb"', expectedOutput: "1", isPublic: true }
      ]
    },
    {
      id: "4",
      title: "Median of Two Sorted Arrays",
      description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
      difficulty: "hard",
      points: 300,
      solvedBy: 23,
      totalAttempts: 80,
      starterCode: "function findMedianSortedArrays(nums1, nums2) {\n  // Your code here\n}",
      testCases: [
        { input: "[1,3], [2]", expectedOutput: "2.0", isPublic: true },
        { input: "[1,2], [3,4]", expectedOutput: "2.5", isPublic: true }
      ]
    }
  ],
  leaderboard: [
    { rank: 1, username: "code_master", score: 800, solvedProblems: 4, totalTime: 45, lastSubmission: new Date(Date.now() - 15 * 60 * 1000) },
    { rank: 2, username: "algo_expert", score: 700, solvedProblems: 3, totalTime: 52, lastSubmission: new Date(Date.now() - 20 * 60 * 1000) },
    { rank: 3, username: "dp_king", score: 600, solvedProblems: 3, totalTime: 58, lastSubmission: new Date(Date.now() - 25 * 60 * 1000) },
    { rank: 4, username: "you", score: 300, solvedProblems: 2, totalTime: 35, lastSubmission: new Date(Date.now() - 10 * 60 * 1000) },
    { rank: 5, username: "newbie_coder", score: 100, solvedProblems: 1, totalTime: 65, lastSubmission: new Date(Date.now() - 30 * 60 * 1000) }
  ]
}

export function ContestInterface({ contestId = "1", initialContest, userId, username }: ContestInterfaceProps) {
  const [contest] = useState(initialContest || mockContest)
  const [activeProblem, setActiveProblem] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [userSubmissions, setUserSubmissions] = useState<Record<string, string>>({})
  const [leaderboard, setLeaderboard] = useState(contest.leaderboard)
  const [contestSubmissions, setContestSubmissions] = useState<Record<string, { status: string; score: number; username: string; timestamp?: Date }>>({})
  
  const { sendMessage, messages, isConnected } = useWebSocket(
    `contest-${contestId}`,
    userId,
    username
  )

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const endTime = new Date(contest.endTime).getTime()
      const remaining = Math.max(0, endTime - now)
      setTimeRemaining(remaining)
    }, 1000)

    return () => clearInterval(timer)
  }, [contest.endTime])

  // ... (keep useEffects)

  // ...

  // Inside render:
  // Use new Date() for timestamp and startTime
  // ...
  // contest.startTime.toLocaleString() -> new Date(contest.startTime).toLocaleString()


  // Handle WebSocket contest events
  useEffect(() => {
    // Listen for leaderboard updates
    const handleLeaderboardUpdate = (event: CustomEvent) => {
      if (event.detail.type === 'leaderboard_update') {
        setLeaderboard(event.detail.data)
      }
    }

    // Listen for new submissions
    const handleSubmission = (event: CustomEvent) => {
      if (event.detail.type === 'submission_result') {
        const { problemId, status, score, username } = event.detail.data
        
        // Update contest submissions
        setContestSubmissions(prev => ({
          ...prev,
          [problemId]: { status, score, username, timestamp: new Date() }
        }))

        // Update user submissions if it's the current user
        if (username === "you") {
          setUserSubmissions(prev => ({
            ...prev,
            [problemId]: "submitted"
          }))
        }

        // Send notification message
        const message = `${username} solved ${contest.problems.find(p => p.id === problemId)?.title}! 🎉`
        sendMessage(message, "text")
      }
    }

    // Add event listeners (this would be handled by WebSocket hook in real implementation)
    window.addEventListener('contest:leaderboard_update', handleLeaderboardUpdate as EventListener)
    window.addEventListener('contest:submission_result', handleSubmission as EventListener)

    return () => {
      window.removeEventListener('contest:leaderboard_update', handleLeaderboardUpdate as EventListener)
      window.removeEventListener('contest:submission_result', handleSubmission as EventListener)
    }
  }, [contest.problems, sendMessage])

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case "upcoming": return "bg-blue-500"
  //     case "active": return "bg-green-500"
  //     case "finished": return "bg-gray-500"
  //     default: return "bg-gray-500"
  //   }
  // }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "text-green-600"
      case "medium": return "text-yellow-600"
      case "hard": return "text-red-600"
      default: return "text-gray-600"
    }
  }

  const handleSubmit = (problemId: string, code: string) => {
    // Update local submission state
    setUserSubmissions(prev => ({
      ...prev,
      [problemId]: code
    }))

    // Send submission via WebSocket
    if (isConnected) {
      sendMessage(JSON.stringify({
        type: 'submission',
        problemId,
        code,
        contestId,
        timestamp: new Date().toISOString()
      }), 'text')

      // Simulate submission result (in real implementation, this would come from server)
      setTimeout(() => {
        const event = new CustomEvent('contest:submission_result', {
          detail: {
            problemId,
            status: 'accepted',
            score: contest.problems.find(p => p.id === problemId)?.points || 0,
            username: 'you'
          }
        })
        window.dispatchEvent(event)
      }, 2000)
    }
  }

  const currentProblem = contest.problems[activeProblem]
  const isContestActive = contest.status === "active"
  const isContestFinished = contest.status === "finished"

  // Convert contest problem to question format for QuestionInterface
  const convertProblemToQuestion = (problem: ContestProblem): Question => ({
    id: problem.id,
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    points: problem.points,
    constraints: [], // Contest problems might not have constraints listed
    examples: problem.testCases.filter(tc => tc.isPublic).map(tc => ({
      input: tc.input,
      output: tc.expectedOutput
    })),
    starterCode: problem.starterCode,
    testCases: problem.testCases,
    tags: [], // Contest problems might not have tags
    timeLimit: 1, // Default time limit
    memoryLimit: 50 // Default memory limit
  })

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Contest Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <CardTitle className="text-2xl">{contest.name}</CardTitle>
                <Badge variant={contest.status === "active" ? "default" : "secondary"}>
                  {contest.status.toUpperCase()}
                </Badge>
              </div>
              <CardDescription>{contest.description}</CardDescription>
            </div>
            
            <div className="text-right space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-2xl font-mono font-bold">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{contest.participants}/{contest.maxParticipants} participants</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Problems List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Problems</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contest.problems.map((problem, index) => (
                <button
                  key={problem.id}
                  onClick={() => setActiveProblem(index)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    activeProblem === index 
                      ? "bg-primary/10 border-primary" 
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{index + 1}. {problem.title}</span>
                    {userSubmissions[problem.id] && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-medium ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty.toUpperCase()}
                    </span>
                    <span className="text-muted-foreground">
                      {problem.points} pts
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{problem.solvedBy}/{problem.totalAttempts} solved</span>
                  </div>
                </button>
              ))}
            </CardContent>

            {/* Recent Activity */}
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium text-sm mb-2">Recent Activity</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                {messages.slice(-3).reverse().map((message, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    <span>{message.content}</span>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center py-2 text-muted-foreground">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Leaderboard */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaderboard.slice(0, 5).map((entry) => (
                <div key={entry.rank} className={`flex items-center justify-between p-2 rounded ${
                  entry.username === "you" ? "bg-primary/10" : ""
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm w-4">{entry.rank}</span>
                    <span className="text-sm font-medium">{entry.username}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{entry.score}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.solvedProblems} solved
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Problem Details */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="problem" className="space-y-4">
            <TabsList>
              <TabsTrigger value="problem">Problem</TabsTrigger>
              <TabsTrigger value="editor">Code Editor</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="leaderboard">Full Leaderboard</TabsTrigger>
            </TabsList>

            <TabsContent value="problem" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{currentProblem.title}</CardTitle>
                    <Badge className={getDifficultyColor(currentProblem.difficulty)}>
                      {currentProblem.difficulty.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription>
                    Points: {currentProblem.points} • Solved by {currentProblem.solvedBy} participants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p>{currentProblem.description}</p>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Examples:</h4>
                    {currentProblem.testCases.filter(tc => tc.isPublic).map((testCase, index) => (
                      <div key={index} className="bg-muted p-3 rounded-lg mb-2">
                        <div className="text-sm">
                          <strong>Input:</strong> {testCase.input}
                        </div>
                        <div className="text-sm mt-1">
                          <strong>Output:</strong> {testCase.expectedOutput}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="editor" className="space-y-4">
              {isContestActive ? (
                <QuestionInterface
                  questionId={currentProblem.id}
                  roomId={`contest-${contestId}-problem-${currentProblem.id}-user-${userId}`}
                  contestId={contestId}
                  question={convertProblemToQuestion(currentProblem)}
                  participants={[
                    { id: userId, username: username, isOnline: true, color: "#FF6B6B", role: "writer", roomId: `contest-${contestId}`, userId: userId }
                  ]}
                  onSubmit={(code) => handleSubmit(currentProblem.id, code)}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Code Editor</CardTitle>
                      <Badge variant="outline">JavaScript</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!isContestActive && !isContestFinished && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-yellow-700 dark:text-yellow-300">
                            Contest hasn&apos;t started yet. Come back at {new Date(contest.startTime).toLocaleString()}.
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {isContestFinished && (
                      <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Circle className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Contest has ended. Thank you for participating!
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="submissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(userSubmissions).length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No submissions yet. Start solving problems!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(userSubmissions).map(([problemId]) => {
                        const problem = contest.problems.find(p => p.id === problemId)
                        const submission = contestSubmissions[problemId]
                        return (
                          <div key={problemId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                              <span className="font-medium">{problem?.title}</span>
                              <div className="text-sm text-muted-foreground">
                                Submitted {submission?.timestamp?.toLocaleTimeString() || new Date().toLocaleTimeString()}
                              </div>
                            </div>
                            <Badge variant={submission?.status === 'accepted' ? 'default' : 'destructive'}>
                              {submission?.status === 'accepted' ? 'Accepted' : 'Pending'}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contest Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leaderboard.map((entry) => (
                      <div key={entry.rank} className={`flex items-center justify-between p-3 rounded-lg ${
                        entry.username === "you" ? "bg-primary/10 border border-primary" : "bg-muted"
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            entry.rank === 1 ? "bg-yellow-500 text-white" :
                            entry.rank === 2 ? "bg-gray-400 text-white" :
                            entry.rank === 3 ? "bg-orange-600 text-white" :
                            "bg-muted"
                          }`}>
                            {entry.rank}
                          </div>
                          <div>
                            <span className="font-medium">{entry.username}</span>
                            {entry.username === "you" && (
                              <Badge variant="outline" className="ml-2">You</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{entry.score} pts</div>
                          <div className="text-sm text-muted-foreground">
                            {entry.solvedProblems} problems • {entry.totalTime}min
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}