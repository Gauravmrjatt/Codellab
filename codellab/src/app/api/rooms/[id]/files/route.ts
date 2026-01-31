import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const FileSchema = z.object({
    name: z.string().min(1),
    content: z.string().optional().default(""),
    path: z.string().optional().default("/"),
});

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const files = await prisma.file.findMany({
            where: { roomId: id },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json(files);
    } catch (error) {
        console.error("Failed to fetch files:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, content, path } = FileSchema.parse(body);

        // Check room membership
        const membership = await prisma.roomMember.findUnique({
            where: {
                roomId_userId: {
                    roomId: id,
                    userId: session.user.id,
                },
            },
        });

        if (!membership) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const file = await prisma.file.create({
            data: {
                name,
                content,
                path,
                roomId: id,
            },
        });

        return NextResponse.json(file, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Failed to create file:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}