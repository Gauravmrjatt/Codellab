import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
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
            },
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        // Allow access if room is public, or if user is authenticated and is a member
        let hasAccess = room.isPublic;

        if (session?.user?.id) {
            // Check if user is a member of the room
            const isMember = await prisma.roomMember.findFirst({
                where: {
                    roomId: roomId,
                    userId: session.user.id,
                }
            });
            hasAccess = hasAccess || !!isMember;
        }

        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({
            creator: room.owner,
            roomId: room.id,
            roomName: room.name,
        });
    } catch (error) {
        console.error("Failed to fetch room creator:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}