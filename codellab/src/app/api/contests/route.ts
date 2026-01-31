import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
    const contests = await prisma.contest.findMany({
        include: {
            _count: {
                select: {
                    participants: true,
                    questions: true
                }
            }
        },
        orderBy: { startTime: 'desc' }
    });
    return NextResponse.json(contests);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, description, startTime, endTime, questionIds } = body;

        if (!title || !startTime || !endTime) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const contest = await prisma.contest.create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                questions: {
                    create: questionIds?.map((qId: string, index: number) => ({
                        questionId: qId,
                        order: index,
                        points: 100 // Default points override
                    })) || []
                }
            },
            include: {
                questions: true
            }
        });

        return NextResponse.json(contest);
    } catch (error: any) {
        console.error("Error creating contest:", error);
        return NextResponse.json({ error: error.message || "Failed to create contest" }, { status: 500 });
    }
}
