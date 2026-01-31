import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;
        const { id: roomId } = await params;

        const body = await req.json();
        const { inviteCode } = body || {};

        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: { members: true }
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        // Check if already a member
        const isMember = room.members.some(m => m.userId === userId);
        if (isMember) {
            return NextResponse.json({ message: "Already a member" });
        }

        // Check permissions
        if (!room.isPublic) {
            if (!inviteCode || inviteCode !== room.inviteCode) {
                return NextResponse.json({ error: "Invalid invite code" }, { status: 403 });
            }
        }

        // Add member
        await prisma.roomMember.create({
            data: {
                roomId,
                userId,
            }
        });

        // Also create permission entry (default role)
        await prisma.permission.create({
            data: {
                roomId,
                userId,
                role: "USER", // Use the Role enum value
                canWriteCode: true,
                canWriteNotes: true,
                canDraw: true
            }
        });

        return NextResponse.json({ message: "Joined successfully" });
    } catch (error) {
        console.error("Failed to join room:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
