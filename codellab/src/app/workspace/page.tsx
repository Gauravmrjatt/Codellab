import { Suspense } from "react"
import { CollaborativeEditor } from "./Collabrator-Editor"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

interface PageProps {
  searchParams: Promise<{ room?: string; questionId?: string }>
}

async function EditorContent({ roomParam, questionId }: { roomParam?: string, questionId?: string }) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const roomId = roomParam || "demo-room"

  // Fetch room details server-side
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            }
          }
        }
      },
      files: true,
      permissions: true
    }
  })

  // Fetch question details if questionId is provided
  let question = null;
  if (questionId) {
    question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        testCases: true
      }
    });
  }

  // Format participants for the component
  const participants = room?.members.map(m => {
    const userPermission = room.permissions.find(p => p.userId === m.user.id);
    return {
      id: m.user.id,
      username: m.user.username,
      color: "bg-blue-500", // Default color, socket server will update this
      isOnline: false,      // Will be updated by WebSocket
      role: (userPermission?.role as "admin" | "writer" | "reader") || "writer",
      roomId: roomId,
      userId: m.user.id,
      canWriteCode: userPermission?.canWriteCode ?? true,
      canWriteNotes: userPermission?.canWriteNotes ?? true,
      canDraw: userPermission?.canDraw ?? true,
    }
  }) || []

  return (
    <div className="h-screen bg-background">
      <CollaborativeEditor
        roomId={roomId}
        roomName = {room?.name || "Demo Room"}
        questionId={questionId}
        currentUserId={session.user.id!}
        currentUsername={session.user.username!}
        initialParticipants={participants}
        inviteCode={room?.inviteCode}
        isPublic={room?.isPublic}
        initialFiles={question ? [
          {
            name: question.title.replace(/\s+/g, '_').toLowerCase() + '.js',
            language: 'javascript',
            content: question.starterCode || `// Solve the problem: ${question.title}\n\nfunction solution() {\n  // Your code here\n}\n\nconsole.log(solution());`
          }
        ] : room?.files.map(f => ({
          name: f.name,
          language: f.name.endsWith('.py') ? 'python' : f.name.endsWith('.java') ? 'java' : f.name.endsWith('.ts') ? 'typescript' : 'javascript',
          content: f.content
        })) || [
          {
            name: 'main.js',
            language: 'javascript',
            content: '// Welcome to CodeLab!\nfunction solution() {\n // Your solution here\n return "Hello, World!";\n}\n\nconsole.log(solution());'
          }
        ]}
      />
    </div>
  )
}

export default async function EditorPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading editor...</div>}>
      <EditorContent roomParam={params.room} questionId={params.questionId} />
    </Suspense>
  )
}