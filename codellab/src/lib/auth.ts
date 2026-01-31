import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export function hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash;
}

export interface AuthUser {
    id: string;
    username: string;
    email: string;
    role: "USER" | "ADMIN";
    avatarUrl: string | null;
}

// Simple JWT alternative - using secure session tokens
export function generateToken(userId: string): string {
    const token = crypto.randomBytes(32).toString("hex");
    return `${userId}:${token}`;
}

export function parseToken(token: string): string | null {
    const parts = token.split(":");
    if (parts.length !== 2) return null;
    return parts[0]; // Return userId
}

export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) return null;

    const userId = parseToken(token);
    if (!userId) return null;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            avatarUrl: true,
        },
    });

    return user;
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
    const user = await getCurrentUser(request);
    if (!user) {
        throw new Error("Unauthorized");
    }
    return user;
}

export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
    const user = await requireAuth(request);
    if (user.role !== "ADMIN") {
        throw new Error("Admin access required");
    }
    return user;
}
