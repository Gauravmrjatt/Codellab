import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const cheatLogs = await prisma.cheatLog.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            username: true,
          }
        },
        submission: {
          select: {
            id: true,
          }
        }
      }
    });

    const total = await prisma.cheatLog.count();

    return NextResponse.json({
      cheatLogs,
      total,
      hasNext: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching cheat logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}