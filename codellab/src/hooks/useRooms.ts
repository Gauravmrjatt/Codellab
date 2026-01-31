import { useState, useCallback } from "react";

export interface Room {
    id: string;
    name: string;
    description?: string;
    inviteCode: string;
    isPublic: boolean;
    maxParticipants: number;
    language: string;
    difficulty: string;
    createdAt: string;
    _count?: {
        members: number;
    };
}

export function useRooms() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createRoom = useCallback(async (
        name: string,
        isPublic: boolean,
        description?: string,
        language: string = "javascript",
        difficulty: string = "medium",
        maxParticipants: number = 5
    ) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    isPublic,
                    description,
                    language,
                    difficulty,
                    maxParticipants
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to create room");
            return data as Room;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getPublicRooms = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/rooms");
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to fetch rooms");
            return data as Room[];
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getMyRooms = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/rooms/my");
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to fetch your rooms");
            return data as Room[];
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const joinRoomByInvite = useCallback(async (code: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/rooms/invite/${code}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to join room");
            return data as { id: string; isPublic: boolean };
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const joinRoom = useCallback(async (roomId: string, inviteCode?: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/rooms/${roomId}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to join room");
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return { createRoom, getPublicRooms, getMyRooms, joinRoomByInvite, joinRoom, loading, error };
}
