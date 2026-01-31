import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: roomId } = await params;

        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: {
                owner: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    }
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                files: true,
                permissions: {
                    where: { userId: session.user.id },
                },
            },
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        // Check if user is a member
        const isMember = room.members.some(m => m.userId === session.user.id);
        if (!isMember && !room.isPublic) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(room);
    } catch (error) {
        console.error("Failed to fetch room details:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}