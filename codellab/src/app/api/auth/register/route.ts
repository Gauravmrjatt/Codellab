import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken } from "@/lib/auth";
import { z } from "zod";

const RegisterSchema = z.object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    password: z.string().min(6),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, email, password } = RegisterSchema.parse(body);

        // Check if user already exists
        const existing = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: "User with this email or username already exists" },
                { status: 400 }
            );
        }

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashPassword(password),
                role: "USER",
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
            },
        });

        const token = generateToken(user.id);

        return NextResponse.json(
            {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    avatarUrl: user.avatarUrl,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues },
                { status: 400 }
            );
        }
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
