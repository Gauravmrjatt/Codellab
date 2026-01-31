import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Clock, Users, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function ContestsPage() {
    const allContests = await prisma.contest.findMany({
        include: {
            _count: {
                select: {
                    participants: true,
                    questions: true
                }
            }
        },
        orderBy: {
            startTime: 'desc'
        }
    })

    const now = new Date()

    const activeContests = allContests.filter(c => c.startTime <= now && c.endTime >= now)
    const upcomingContests = allContests.filter(c => c.startTime > now)
    const pastContests = allContests.filter(c => c.endTime < now)

    const ContestCard = ({ contest, status }: { contest: any, status: 'active' | 'upcoming' | 'past' }) => (
        <Card key={contest.id} className="group overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                    <Badge variant={status === 'active' ? "default" : status === 'upcoming' ? "secondary" : "outline"}>
                        {status.toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{new Date(contest.startTime).toLocaleDateString()}</span>
                    </div>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {contest.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                    {contest.description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between gap-4 pt-4 border-t">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{contest._count.participants}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Trophy className="h-4 w-4" />
                            <span>{contest._count.questions} Problems</span>
                        </div>
                    </div>
                    <Button variant={status === 'active' ? "default" : "outline"} size="sm" asChild>
                        <Link href={`/contests/${contest.id}`}>
                            {status === 'active' ? 'Join Now' : 'View Details'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="container mx-auto py-10 px-4 max-w-7xl mt-10" >
            <div className="flex flex-col gap-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Contests</h1>
                    <p className="text-muted-foreground mt-2">
                        Compete with others and climb the leaderboard.
                    </p>
                </div>

                {activeContests.length > 0 && (
                    <section className="space-y-6">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            Active Contests
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeContests.map(c => (
                                <ContestCard key={c.id} contest={c} status="active" />
                            ))}
                        </div>
                    </section>
                )}

                <section className="space-y-6">
                    <h2 className="text-2xl font-semibold">Upcoming Contests</h2>
                    {upcomingContests.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingContests.map(c => (
                                <ContestCard key={c.id} contest={c} status="upcoming" />
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 border rounded-lg border-dashed text-center text-muted-foreground bg-muted/20">
                            No upcoming contests scheduled. Check back later!
                        </div>
                    )}
                </section>

                {pastContests.length > 0 && (
                    <section className="space-y-6">
                        <h2 className="text-2xl font-semibold">Past Contests</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pastContests.map(c => (
                                <ContestCard key={c.id} contest={c} status="past" />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}
