import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, ArrowLeft, ArrowUpRight, Plus } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function AllProblemsPage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    const problems = await prisma.question.findMany({
        include: {
            tags: {
                include: {
                    tag: true
                }
            },
            submissions: {
                where: { userId: session.user.id },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 1
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "EASY":
                return "text-green-500 bg-green-500/10 border-green-500/20"
            case "MEDIUM":
                return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
            case "HARD":
                return "text-red-500 bg-red-500/10 border-red-500/20"
            default:
                return "text-primary"
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" asChild className="-ml-2 h-8">
                            <Link href="/dashboard/problems">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to My Problems
                            </Link>
                        </Button>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Browse All Problems</h1>
                    <p className="text-muted-foreground mt-2">
                        Explore all available challenges and sharpen your skills.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/problems/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Problem
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead>Problem</TableHead>
                            <TableHead>Difficulty</TableHead>
                            <TableHead>Tags</TableHead>
                            <TableHead className="text-right">Points</TableHead>
                            <TableHead className="text-right w-[150px]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {problems.map((problem) => (
                            <TableRow key={problem.id}>
                                <TableCell>
                                    {problem.submissions.length > 0 ? (
                                        problem.submissions[0].status === "ACCEPTED" ? (
                                            <div className="flex items-center gap-2 text-green-500">
                                                <CheckCircle2 className="h-4 w-4" />
                                                <span className="text-xs font-medium">Solved</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-yellow-500">
                                                <Circle className="h-4 w-4 fill-yellow-500/20" />
                                                <span className="text-xs font-medium">Attempted</span>
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground/30">
                                            <Circle className="h-4 w-4" />
                                            <span className="text-xs font-medium">Todo</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {problem.title}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={getDifficultyColor(problem.difficulty)}
                                    >
                                        {problem.difficulty}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-1 flex-wrap">
                                        {problem.tags.map((t) => (
                                            <Badge key={t.tagId} variant="secondary" className="text-[10px] px-1.5 py-0">
                                                {t.tag.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-muted-foreground">
                                    {problem.points}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/problem/${problem.slug}?questionId=${problem.id}`}>
                                            {problem.submissions.length > 0 ? "Try Again" : "Solve"}
                                            <ArrowUpRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
