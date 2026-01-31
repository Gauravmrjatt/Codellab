import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET contest details with leaderboard
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: contestId } = await params;

        const contest = await prisma.contest.findUnique({
            where: { id: contestId },
            include: {
                questions: {
                    include: {
                        question: {
                            select: {
                                id: true,
                                title: true,
                                difficulty: true,
                                slug: true,
                                points: true,
                            },
                        },
                    },
                    orderBy: {
                        order: "asc",
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatarUrl: true,
                            },
                        },
                    },
                    orderBy: [
                        { score: "desc" },
                        { finishTime: "asc" },
                    ],
                    take: 100, // Top 100
                },
            },
        });

        if (!contest) {
            return NextResponse.json(
                { error: "Contest not found" },
                { status: 404 }
            );
        }

        const now = new Date();
        const status =
            contest.startTime > now
                ? "upcoming"
                : contest.endTime < now
                    ? "past"
                    : "active";

        return NextResponse.json({
            ...contest,
            status,
            leaderboard: contest.participants.map((p, index) => ({
                rank: p.rank || index + 1,
                user: p.user,
                score: p.score,
                finishTime: p.finishTime,
            })),
        });
    } catch (error) {
        console.error("Get contest error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// POST register for contest
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id: contestId } = await params;

        // Check if contest exists and hasn't ended
        const contest = await prisma.contest.findUnique({
            where: { id: contestId },
        });

        if (!contest) {
            return NextResponse.json(
                { error: "Contest not found" },
                { status: 404 }
            );
        }

        const now = new Date();
        if (contest.endTime < now) {
            return NextResponse.json(
                { error: "Contest has ended" },
                { status: 400 }
            );
        }

        // Check if already registered
        const existing = await prisma.contestParticipant.findUnique({
            where: {
                contestId_userId: {
                    contestId,
                    userId: user.id,
                },
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Already registered for this contest" },
                { status: 400 }
            );
        }

        // Register participant
        const participant = await prisma.contestParticipant.create({
            data: {
                contestId,
                userId: user.id,
                score: 0,
            },
        });

        return NextResponse.json({
            message: "Successfully registered for contest",
            participant,
        });
    } catch (error) {
        console.error("Register for contest error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
