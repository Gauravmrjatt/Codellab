import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const room = await prisma.room.findUnique({
      where: { inviteCode: code },
      select: { id: true, isPublic: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error("Failed to find room by invite code:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
