import { prisma } from "./prisma";

/**
 * Gets the creator of a room by room ID
 * @param roomId - The ID of the room
 * @returns The user object of the room creator or null if not found
 */
export async function getRoomCreator(roomId: string) {
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          }
        },
      },
    });

    return room?.owner || null;
  } catch (error) {
    console.error("Failed to fetch room creator:", error);
    return null;
  }
}

/**
 * Checks if a user is the creator of a room
 * @param roomId - The ID of the room
 * @param userId - The ID of the user to check
 * @returns Boolean indicating if the user is the room creator
 */
export async function isRoomCreator(roomId: string, userId: string) {
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    return room?.ownerId === userId;
  } catch (error) {
    console.error("Failed to check room creator:", error);
    return false;
  }
}

/**
 * Client-side function to get room creator information
 * @param roomId - The ID of the room
 * @returns The creator information or null if not found/error
 */
export async function getRoomCreatorClient(roomId: string) {
  try {
    const response = await fetch(`/api/rooms/${roomId}/creator`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.creator;
    } else {
      console.error('Failed to fetch room creator:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error fetching room creator:', error);
    return null;
  }
}