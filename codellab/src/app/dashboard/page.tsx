import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Code2, Star, Timer, CheckCircle2, History, ArrowRight } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    const userId = session.user.id

    const [
        submissionCount,
        solvedCount,
        contestCount,
        recentSubmissions,
    ] = await Promise.all([
        prisma.submission.count({ where: { userId } }),
        prisma.submission.count({
            where: {
                userId,
                status: "ACCEPTED"
            }
        }),
        prisma.contestParticipant.count({ where: { userId } }),
        prisma.submission.findMany({
            where: { userId },
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                question: true
            }
        })
    ])

    const stats = [
        {
            title: "Total Submissions",
            value: submissionCount,
            icon: History,
            description: "Lifetime code submissions",
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            border: "border-blue-400/20"
        },
        {
            title: "Problems Solved",
            value: solvedCount,
            icon: CheckCircle2,
            description: "Successfully accepted solutions",
            color: "text-green-400",
            bg: "bg-green-400/10",
            border: "border-green-400/20"
        },
        {
            title: "Contests Joined",
            value: contestCount,
            icon: Trophy,
            description: "Competitive events attended",
            color: "text-yellow-400",
            bg: "bg-yellow-400/10",
            border: "border-yellow-400/20"
        },
        {
            title: "Success Rate",
            value: submissionCount > 0 ? `${Math.round((solvedCount / submissionCount) * 100)}%` : "0%",
            icon: Star,
            description: "Accepted vs total submissions",
            color: "text-purple-400",
            bg: "bg-purple-400/10",
            border: "border-purple-400/20"
        }
    ]

    return (
        <div className="space-y-8 p-2">
            <div>
                <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    Welcome back, <span className="text-[#edae00]">{session.user.name || session.user.username || "Coder"}</span>!
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Here&apos;s what&apos;s happening with your coding journey.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.title} className={`border ${stat.border} bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10 hover:-translate-y-1`}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-white/10 bg-white/5 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-[#edae00]" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>Your latest submissions and their status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentSubmissions.length > 0 ? (
                            <div className="space-y-4">
                                {recentSubmissions.map((submission) => (
                                    <div key={submission.id} className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20 hover:border-[#edae00]/30 hover:bg-white/5 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${submission.status === "ACCEPTED" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                                {submission.status === "ACCEPTED" ? <CheckCircle2 className="h-5 w-5" /> : <Timer className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <Link href={`/editor?questionId=${submission.questionId}`} className="font-semibold hover:text-[#edae00] transition-colors">
                                                    {submission.question.title}
                                                </Link>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {new Date(submission.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant={submission.status === "ACCEPTED" ? "default" : "destructive"} className="px-3">
                                            {submission.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/5">
                                <Code2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>No recent activity. Go solve some problems!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/5 backdrop-blur-sm h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-[#edae00]" />
                            Recommended
                        </CardTitle>
                        <CardDescription>Challenges to keep you sharp.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-5 rounded-xl bg-gradient-to-br from-[#edae00]/20 to-orange-500/10 border border-[#edae00]/20 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[#edae00]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h4 className="font-bold flex items-center gap-2 text-[#edae00] mb-2">
                                <Trophy className="h-5 w-5" />
                                Weekly Contest
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">Starts in 2 days. Compete with others and climb the leaderboard!</p>
                            <Button size="sm" className="w-full bg-[#edae00] text-black hover:bg-[#d49b00]" asChild>
                                <Link href="/contests">View Contests</Link>
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Daily Challenges</h4>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors border border-transparent hover:border-white/10">
                                    <span className="text-sm font-medium group-hover:text-[#edae00] transition-colors">Daily Coding Challenge #{i + 10}</span>
                                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#edae00]" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function Button({ children, className, asChild, size, ...props }: any) {
    const Comp = asChild ? "div" : "button"
    return (
        <Comp className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2", className)} {...props}>
            {children}
        </Comp>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ")
}