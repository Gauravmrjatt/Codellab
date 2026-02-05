import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { ContestInterface } from "@/components/contest-interface"

export default async function ContestPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return redirect("/login")

  const { id } = await params

  const contest = await prisma.contest.findUnique({
    where: { id },
    include: {
      questions: {
        include: {
          question: {
            include: {
              testCases: { where: { visibility: "PUBLIC" } }
            }
          }
        },
        orderBy: { order: 'asc' }
      },
      participants: {
        include: { user: true },
        orderBy: { rank: 'asc' },
        take: 50
      }
    }
  })

  if (!contest) return notFound()

  // Redirect to the first question of the contest in the problem solver
  if (contest.questions.length > 0) {
    return redirect(`/problem/${contest.questions[0].question.slug}?contestId=${id}`)
  }

  // Helper to determine status
  const now = new Date()
  let status: "upcoming" | "active" | "finished" = "upcoming"
  if (now > contest.endTime) status = "finished"
  else if (now >= contest.startTime) status = "active"

  // Transform to ContestInterface format
  const formattedContest = {
    id: contest.id,
    name: contest.title,
    description: contest.description || "",
    startTime: contest.startTime.toISOString(),
    endTime: contest.endTime.toISOString(),
    duration: (contest.endTime.getTime() - contest.startTime.getTime()) / (1000 * 60),
    participants: contest.participants.length,
    maxParticipants: 1000, 
    difficulty: "medium" as const, // Default or derive
    status,
    problems: contest.questions.map(cq => ({
      id: cq.question.id,
      title: cq.question.title,
      description: cq.question.description,
      difficulty: cq.question.difficulty.toLowerCase() as "easy" | "medium" | "hard",
      points: cq.points,
      solvedBy: 0, 
      totalAttempts: 0, 
      starterCode: cq.question.starterCode || "",
      testCases: cq.question.testCases.map(tc => ({
        input: tc.input || "",
        expectedOutput: tc.expectedOutput ? JSON.stringify(tc.expectedOutput) : "",
        isPublic: true
      }))
    })),
    leaderboard: contest.participants.map((p, index) => ({
      rank: p.rank || index + 1,
      username: p.user.username,
      score: p.score,
      solvedProblems: 0, 
      totalTime: 0, 
      lastSubmission: new Date().toISOString() 
    }))
  }

  return (
    <ContestInterface 
      initialContest={formattedContest} 
      contestId={id} 
      userId={session.user.id!} 
      username={session.user.username || "User"} 
    />
  )
}