import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;

        const rooms = await prisma.room.findMany({
            where: {
                OR: [
                    { ownerId: userId },
                    { members: { some: { userId } } }
                ]
            },
            include: {
                _count: {
                    select: { members: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(rooms);
    } catch (error) {
        console.error("Failed to fetch user rooms:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
