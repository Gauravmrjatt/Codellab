import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const FileSchema = z.object({
    name: z.string().min(1).max(255),
    path: z.string(),
    content: z.string(),
    roomId: z.string(),
});

// Helper to check if user has write permission
async function checkWritePermission(userId: string, roomId: string): Promise<boolean> {
    const permission = await prisma.permission.findUnique({
        where: {
            roomId_userId: {
                roomId,
                userId,
            },
        },
    });

    return permission?.canWriteCode ?? false;
}

// GET files for a room
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const roomId = searchParams.get("roomId");

        if (!roomId) {
            return NextResponse.json(
                { error: "roomId is required" },
                { status: 400 }
            );
        }

        const files = await prisma.file.findMany({
            where: { roomId },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ files });
    } catch (error) {
        console.error("Get files error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// POST create new file
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const data = FileSchema.parse(body);

        // Check if user has write permission
        const hasPermission = await checkWritePermission(user.id, data.roomId);

        if (!hasPermission) {
            return NextResponse.json(
                { error: "No write permission for this room" },
                { status: 403 }
            );
        }

        const file = await prisma.file.create({
            data: {
                name: data.name,
                path: data.path,
                content: data.content,
                roomId: data.roomId,
            },
        });

        return NextResponse.json(file, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues },
                { status: 400 }
            );
        }
        console.error("Create file error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// PUT update file
export async function PUT(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { id, content, roomId } = body;

        if (!id || content === undefined) {
            return NextResponse.json(
                { error: "id and content are required" },
                { status: 400 }
            );
        }

        // Check if user has write permission
        if (roomId) {
            const hasPermission = await checkWritePermission(user.id, roomId);

            if (!hasPermission) {
                return NextResponse.json(
                    { error: "No write permission for this room" },
                    { status: 403 }
                );
            }
        }

        const file = await prisma.file.update({
            where: { id },
            data: {
                content,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(file);
    } catch (error) {
        console.error("Update file error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// DELETE file
export async function DELETE(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const roomId = searchParams.get("roomId");

        if (!id) {
            return NextResponse.json(
                { error: "id is required" },
                { status: 400 }
            );
        }

        // Check if user has write permission
        if (roomId) {
            const hasPermission = await checkWritePermission(user.id, roomId);

            if (!hasPermission) {
                return NextResponse.json(
                    { error: "No write permission for this room" },
                    { status: 403 }
                );
            }
        }

        await prisma.file.delete({
            where: { id },
        });

        return NextResponse.json({ message: "File deleted successfully" });
    } catch (error) {
        console.error("Delete file error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
