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
import Link from "next/link"
import { CheckCircle2, Circle } from "lucide-react"

export default async function ProblemsPage() {
    const problems = await prisma.question.findMany({
        include: {
            tags: {
                include: {
                    tag: true
                }
            },
            submissions: {
                take: 1,
                orderBy: {
                    createdAt: 'desc'
                }
            }
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
                return "text-gray-500 bg-gray-500/10 border-gray-500/20"
        }
    }

    return (
        <div className="container mx-auto py-10 px-4 max-w-7xl mt-10 pt-15">
            <div className="flex flex-col gap-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Problems</h1>
                    <p className="text-muted-foreground mt-2">
                        Practice your coding skills with our curated set of challenges.
                    </p>
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Status</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Difficulty</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Points</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {problems.map((problem) => (
                                <TableRow key={problem.id} className="group">
                                    <TableCell>
                                        {problem.submissions.length > 0 ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-muted-foreground/30" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/editor?questionId=${problem.id}`}
                                            className="font-medium hover:text-primary transition-colors"
                                        >
                                            {problem.title}
                                        </Link>
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
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
