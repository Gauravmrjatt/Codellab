import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Users, ArrowRight, ExternalLink, Plus, Calendar } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function DashboardContestsPage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    const participations = await prisma.contestParticipant.findMany({
        where: { userId: session.user.id },
        include: {
            contest: {
                include: {
                    _count: {
                        select: {
                            participants: true,
                            questions: true
                        }
                    }
                }
            }
        },
        orderBy: {
            contest: {
                startTime: 'desc'
            }
        }
    })

    return (
        <div className="space-y-8 p-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">My Contests</h1>
                    <p className="text-muted-foreground mt-2">
                        Contests you&apos;ve participated in or are registered for.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-white/10 hover:bg-white/5" asChild>
                        <Link href="/contests">
                            Browse Public
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button className="bg-[#edae00] text-black hover:bg-[#d49b00]" asChild>
                        <Link href="/dashboard/contests/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Contest
                        </Link>
                    </Button>
                </div>
            </div>

            {participations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {participations.map(({ contest }) => {
                        const isFinished = new Date(contest.endTime) < new Date();
                        return (
                            <Card key={contest.id} className="group border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all hover:-translate-y-1">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <Badge variant={isFinished ? "outline" : "default"} className={isFinished ? "border-white/20 text-muted-foreground" : "bg-[#edae00] text-black hover:bg-[#d49b00]"}>
                                            {isFinished ? "FINISHED" : "ACTIVE"}
                                        </Badge>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <Calendar className="mr-1 h-3 w-3" />
                                            {new Date(contest.startTime).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-[#edae00] transition-colors">{contest.title}</CardTitle>
                                    <CardDescription className="line-clamp-2 mt-1">{contest.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <Users className="h-4 w-4" />
                                                <span>{contest._count.participants}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <Trophy className="h-4 w-4" />
                                                <span>{contest._count.questions} Qs</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="hover:text-[#edae00] hover:bg-[#edae00]/10 -mr-2" asChild>
                                            <Link href={`/contests/${contest.id}`}>
                                                Details
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-24 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <div className="mx-auto h-16 w-16 bg-[#edae00]/10 rounded-full flex items-center justify-center mb-6">
                        <Trophy className="h-8 w-8 text-[#edae00]" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">No contests yet</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                        You haven&apos;t joined any contests. Start competing today!
                    </p>
                    <Button asChild className="bg-[#edae00] text-black hover:bg-[#d49b00] h-12 px-8">
                        <Link href="/contests">Explore Contests</Link>
                    </Button>
                </div>
            )}
        </div>
    )
}