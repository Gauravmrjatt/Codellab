import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { IndividualEditor } from "@/app/workspace/Individual-Editor"
import { notFound, redirect } from "next/navigation"

interface PageProps {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ contestId?: string }>
}

export default async function ProblemPage({ params, searchParams }: PageProps) {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }

    const { slug } = await params
    const { contestId } = await searchParams

    const [question, rawRooms, contest] = await Promise.all([
        prisma.question.findUnique({
            where: { slug },
            include: {
                testCases: {
                    where: { visibility: "PUBLIC" }, // Only fetch public test cases for the frontend
                    take: 3
                },
                inputs: { orderBy: { order: 'asc' } },
                output: true
            }
        }),
        prisma.room.findMany({
            where: {
                OR: [
                    { ownerId: session.user.id },
                    { members: { some: { userId: session.user.id } } }
                ]
            },
            select: {
                id: true,
                name: true,
                updatedAt: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        }),
        contestId ? prisma.contest.findUnique({
            where: { id: contestId },
            include: {
                questions: {
                    include: { question: true },
                    orderBy: { order: 'asc' }
                }
            }
        }) : Promise.resolve(null)
    ])

    if (!question) {
        notFound()
    }

    const userRooms = rawRooms.map(room => ({
        ...room,
        updatedAt: room.updatedAt.toISOString()
    }))

    // Construct initial files for the editor
    const initialFiles = [{
        name: 'main.js', // Default to JS, or infer from somewhere if needed
        language: 'javascript',
        content: question.starterCode || `// Solve the problem: ${question.title}\n\nfunction solution() {\n  // Your code here\n}\n\nconsole.log(solution());`
    }]

    // Construct initial participants (just the current user)
    const initialParticipants = [{
        id: session.user.id!,
        username: session.user.username || "User",
        color: "#3b82f6", // Default color
        isOnline: true,
        role: "admin" as const,
        cursor: { x: 0, y: 0 }
    }]

    return (
        <div className="h-screen bg-background">
            <IndividualEditor
                key={question.id}
                roomId={`individual-${question.id}`}
                roomName={question.title}
                questionId={question.id}
                initialFiles={initialFiles}
                initialParticipants={initialParticipants}
                currentUserId={session.user.id!}
                currentUsername={session.user.username || "User"}
                userRooms={userRooms}
                contestId={contestId}
                contest={contest}
            />
        </div>
    )
}