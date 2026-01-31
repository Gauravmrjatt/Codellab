import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code2, CheckCircle2, Circle, ExternalLink, ArrowUpRight, Plus, Pencil } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function DashboardProblemsPage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    const [submissions, authoredProblems] = await Promise.all([
        prisma.submission.findMany({
            where: { userId: session.user.id },
            include: {
                question: {
                    include: {
                        tags: {
                            include: {
                                tag: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.question.findMany({
            where: { authorId: session.user.id },
            include: {
                tags: {
                    include: {
                        tag: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
    ])

    // Group by question to show latest status per problem
    const problemStatus = submissions.reduce((acc: any, sub) => {
        if (!acc[sub.questionId] || new Date(sub.createdAt) > new Date(acc[sub.questionId].createdAt)) {
            acc[sub.questionId] = sub
        }
        return acc
    }, {})

    const attemptedProblems = Object.values(problemStatus)

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "EASY": return "text-green-400 bg-green-400/10 border-green-400/20"
            case "MEDIUM": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
            case "HARD": return "text-red-400 bg-red-400/10 border-red-400/20"
            default: return "text-primary"
        }
    }

    return (
        <div className="space-y-8 p-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">My Problems</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your authored problems and view your progress.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-white/10 hover:bg-white/5" asChild>
                        <Link href="/dashboard/problems/all">
                            Browse All
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button className="bg-[#edae00] text-black hover:bg-[#d49b00]" asChild>
                        <Link href="/dashboard/problems/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Problem
                        </Link>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="authored" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-white/5 border border-white/10">
                    <TabsTrigger value="authored" className="data-[state=active]:bg-[#edae00] data-[state=active]:text-black">Authored</TabsTrigger>
                    <TabsTrigger value="attempted" className="data-[state=active]:bg-[#edae00] data-[state=active]:text-black">Attempted</TabsTrigger>
                </TabsList>

                <TabsContent value="attempted" className="mt-6">
                    <Card className="border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
                        <CardContent className="p-0">
                            {attemptedProblems.length > 0 ? (
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="border-white/10 hover:bg-transparent">
                                            <TableHead className="w-[120px] text-muted-foreground">Status</TableHead>
                                            <TableHead className="text-muted-foreground">Problem</TableHead>
                                            <TableHead className="text-muted-foreground">Difficulty</TableHead>
                                            <TableHead className="text-muted-foreground">Tags</TableHead>
                                            <TableHead className="text-right text-muted-foreground">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attemptedProblems.map((sub: any) => (
                                            <TableRow key={sub.questionId} className="border-white/5 hover:bg-white/5 transition-colors">
                                                <TableCell>
                                                    {sub.status === "ACCEPTED" ? (
                                                        <div className="flex items-center gap-2 text-green-400">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            <span className="text-xs font-semibold">Solved</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Circle className="h-4 w-4" />
                                                            <span className="text-xs font-medium">Attempted</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium text-white">
                                                    {sub.question.title}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`border ${getDifficultyColor(sub.question.difficulty)}`}>
                                                        {sub.question.difficulty}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {sub.question.tags.map((t: any) => (
                                                            <Badge key={t.tagId} variant="secondary" className="text-[10px] px-2 py-0.5 bg-white/10 hover:bg-white/20 text-muted-foreground">
                                                                {t.tag.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="hover:text-[#edae00] hover:bg-[#edae00]/10" asChild>
                                                        <Link href={`/editor?questionId=${sub.questionId}`}>
                                                            Solve Again
                                                            <ArrowUpRight className="ml-2 h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-24">
                                    <div className="mx-auto h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                        <Code2 className="h-6 w-6 text-muted-foreground opacity-50" />
                                    </div>
                                    <h3 className="text-lg font-medium text-white">No problems attempted</h3>
                                    <p className="text-muted-foreground mb-6">You haven&apos;t tried any problems yet.</p>
                                    <Button asChild className="bg-[#edae00] text-black hover:bg-[#d49b00]">
                                        <Link href="/problems">Explore Problems</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="authored" className="mt-6">
                    <Card className="border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
                        <CardContent className="p-0">
                            {authoredProblems.length > 0 ? (
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="border-white/10 hover:bg-transparent">
                                            <TableHead className="text-muted-foreground">Problem</TableHead>
                                            <TableHead className="text-muted-foreground">Slug</TableHead>
                                            <TableHead className="text-muted-foreground">Difficulty</TableHead>
                                            <TableHead className="text-muted-foreground">Tags</TableHead>
                                            <TableHead className="text-right text-muted-foreground">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {authoredProblems.map((problem: any) => (
                                            <TableRow key={problem.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                                <TableCell className="font-medium text-white">
                                                    {problem.title}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm font-mono">
                                                    {problem.slug}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`border ${getDifficultyColor(problem.difficulty)}`}>
                                                        {problem.difficulty}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {problem.tags.map((t: any) => (
                                                            <Badge key={t.tagId} variant="secondary" className="text-[10px] px-2 py-0.5 bg-white/10 hover:bg-white/20 text-muted-foreground">
                                                                {t.tag.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" className="hover:text-blue-400 hover:bg-blue-400/10" asChild>
                                                            <Link href={`/dashboard/problems/${problem.id}/edit`}>
                                                                Edit
                                                                <Pencil className="ml-2 h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="hover:text-[#edae00] hover:bg-[#edae00]/10" asChild>
                                                            <Link href={`/editor?questionId=${problem.id}`}>
                                                                View
                                                                <ArrowUpRight className="ml-2 h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-24">
                                    <div className="mx-auto h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                        <Code2 className="h-6 w-6 text-muted-foreground opacity-50" />
                                    </div>
                                    <h3 className="text-lg font-medium text-white">No problems authored</h3>
                                    <p className="text-muted-foreground mb-6">You haven&apos;t created any problems yet.</p>
                                    <Button asChild className="bg-[#edae00] text-black hover:bg-[#d49b00]">
                                        <Link href="/dashboard/problems/create">Create Your First Problem</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}