import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { z } from "zod";
import { auth } from "@/auth";

const RoomSchema = z.object({
    name: z.string().min(3).max(50),
    description: z.string().optional(),
    isPublic: z.boolean().optional().default(false),
    language: z.string().optional().default("javascript"),
    difficulty: z.string().optional().default("medium"),
    maxParticipants: z.number().optional().default(5),
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;

        const body = await req.json();
        const {
            name,
            isPublic,
            description,
            language,
            difficulty,
            maxParticipants
        } = RoomSchema.parse(body);

        const room = await prisma.room.create({
            data: {
                name,
                description,
                isPublic,
                language,
                difficulty,
                maxParticipants,
                ownerId: userId,
                inviteCode: nanoid(10),
                members: {
                    create: {
                        userId,
                    },
                },
                permissions: {
                    create: {
                        userId,
                        role: "admin",
                        canWriteCode: true,
                        canWriteNotes: true,
                        canDraw: true,
                    },
                },
            },
        });

        return NextResponse.json(room, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Failed to create room:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const rooms = await prisma.room.findMany({
            where: { isPublic: true },
            include: {
                _count: {
                    select: { members: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(rooms);
    } catch (error) {
        console.error("Failed to fetch rooms:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
