import { Server } from "socket.io";
import { createServer } from "http";
import { PrismaClient } from "@prisma/client";
import * as Y from "yjs";

const prisma = new PrismaClient();
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for now, or configure as needed
    methods: ["GET", "POST"],
  },
});

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  type: "text" | "code" | "audio";
  roomId: string;
  audioUrl?: string;
  duration?: number;
  mentionedUsers?: string[];
}

interface CursorPosition {
  userId: string;
  username: string;
  position: { x: number; y: number };
  roomId: string;
}

interface CodeChange {
  userId: string;
  fileId: string;
  changes: any[];
  roomId: string;
  fullContent?: string;
}

interface PasteEvent {
  userId: string;
  roomId: string;
  length: number;
  timestamp: number;
}

const roomParticipants = new Map<string, Map<string, any>>();
const chatHistory = new Map<string, ChatMessage[]>();
const usersInCall = new Map<string, Set<string>>(); // roomId -> Set of userIds in call

// ────────────────────────────────────────────────
//   Yjs document storage for TipTap/BlockNote collaboration
// ────────────────────────────────────────────────

// Store actual Y.Doc instances for proper update merging
const yjsDocInstances = new Map<string, Y.Doc>(); // roomId → Y.Doc instance
const yjsPersistenceTimers = new Map<string, NodeJS.Timeout>(); // Debounce timers for DB writes
const PERSISTENCE_DELAY = 3000; // Save to DB every 3 seconds

// Helper to get or create a Y.Doc for a room
function getOrCreateYDoc(roomId: string): Y.Doc {
  let doc = yjsDocInstances.get(roomId);
  if (!doc) {
    doc = new Y.Doc();
    yjsDocInstances.set(roomId, doc);
  }
  return doc;
}


// ────────────────────────────────────────────────
//   Typing state per room
// ────────────────────────────────────────────────
const typingUsersPerRoom = new Map<string, Set<string>>(); // roomId → Set<username>
const typingTimeouts = new Map<string, NodeJS.Timeout>();   // `${roomId}-${username}` → timeout

const COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
];

io.on("connection", async (socket) => {
  const { roomId, userId, username: rawUsername } = socket.handshake.query as {
    roomId: string;
    userId: string;
    username: string;
  };

  const username = rawUsername || `User-${(userId || "").substring(0, 4)}`;

  if (!roomId || !userId) {
    socket.disconnect();
    return;
  }

  socket.join(roomId);

  // Initialize room if first user
  if (!roomParticipants.has(roomId)) {
    roomParticipants.set(roomId, new Map());
  }

  const participants = roomParticipants.get(roomId)!;

  // Assign color
  const color = COLORS[participants.size % COLORS.length];
  
  // Check DB for existing permission
  let dbPermission = await prisma.permission.findUnique({
    where: { roomId_userId: { roomId, userId } }
  });

  if (!dbPermission) {
     let initialRole = "writer";
     
     // Check if user is the owner of the room
     let roomExists = false;
     try {
       const room = await prisma.room.findUnique({
         where: { id: roomId },
         select: { ownerId: true }
       });
       
       if (room) {
         roomExists = true;
         if (room.ownerId === userId) {
           initialRole = "admin";
         } else {
           // Fallback: first joiner is admin (legacy behavior)
           initialRole = participants.size === 0 ? "admin" : "writer";
         }
       } else {
         // Fallback: first joiner is admin (legacy behavior)
         initialRole = participants.size === 0 ? "admin" : "writer";
       }
     } catch (err) {
       console.error("Error fetching room owner:", err);
       initialRole = participants.size === 0 ? "admin" : "writer";
     }

     if (roomExists) {
       try {
         dbPermission = await prisma.permission.create({
            data: {
               roomId,
               userId,
               role: initialRole,
               canWriteCode: true, 
               canWriteNotes: true,
               canDraw: true
            }
         });
       } catch (e: any) {
         if (e.code === 'P2003') {
            console.warn(`Skipping permission creation: User ${userId} or Room ${roomId} not found in DB.`);
         } else {
            console.error("Error creating permission:", e);
         }
       }
     }

     if (!dbPermission) {
       dbPermission = { 
         role: initialRole, 
         canWriteCode: true, 
         canWriteNotes: true, 
         canDraw: true 
       } as any;
     }
  }
  
  // Ensure we have a valid permission object
  const finalPermission = dbPermission!;

  // Map database roles to frontend roles
  const mapRoleToFrontend = (dbRole: string): "admin" | "writer" | "reader" => {
    switch(dbRole.toUpperCase()) {
      case "ADMIN":
        return "admin";
      case "USER":
        return "writer"; // Map database USER to frontend writer
      default:
        return "reader"; // Default fallback
    }
  };

  participants.set(userId, {
    id: userId,
    username,
    color,
    isOnline: true,
    role: mapRoleToFrontend(finalPermission.role),
    canWriteCode: finalPermission.canWriteCode,
    canWriteNotes: finalPermission.canWriteNotes,
    canDraw: finalPermission.canDraw,
  });

  console.log(`User ${username} (${userId}) joined room ${roomId}`);

  // Send updated participants list to everyone in room
  io.to(roomId).emit("room:users", Array.from(participants.values()));

  // Load chat history from database and initialize in-memory cache if needed
  if (!chatHistory.has(roomId)) {
    try {
      const dbMessages = await prisma.message.findMany({
        where: { roomId: roomId.startsWith("room-") ? roomId.replace("room-", "") : roomId },
        orderBy: { createdAt: 'asc' },
      });

      const formattedMessages: ChatMessage[] = dbMessages.map(msg => ({
        id: msg.id,
        userId: msg.userId,
        username: participants.get(msg.userId)?.username || 'Unknown User', // Get username from participants map
        content: msg.content,
        timestamp: msg.createdAt,
        type: msg.type as "text" | "code" | "audio" || "text",
        roomId: roomId,
        mentionedUsers: msg.mentionedUsers ? JSON.parse(msg.mentionedUsers as string) : [],
      }));

      chatHistory.set(roomId, formattedMessages);
    } catch (err) {
      console.error("Failed to load message history from database:", err);
      chatHistory.set(roomId, []);
    }
  }

  const history = chatHistory.get(roomId) || [];
  socket.emit("chat:history", history);

  // ────────────────────────────────────────────────
  //          Typing indicator events
  // ────────────────────────────────────────────────

  socket.on("chat:typing", (data: { isTyping: boolean }) => {
    if (typeof data.isTyping !== "boolean") return;

    const roomTypers = typingUsersPerRoom.get(roomId) ?? new Set<string>();

    const timeoutKey = `${roomId}-${username}`;

    if (data.isTyping) {
      // Start typing
      if (!roomTypers.has(username)) {
        roomTypers.add(username);
        typingUsersPerRoom.set(roomId, roomTypers);

        // Notify everyone in the room
        io.to(roomId).emit("chat:typing", { username });

        // Auto-remove after 5 seconds of inactivity
        if (typingTimeouts.has(timeoutKey)) {
          clearTimeout(typingTimeouts.get(timeoutKey)!);
        }

        const timeout = setTimeout(() => {
          roomTypers.delete(username);
          typingUsersPerRoom.set(roomId, roomTypers);
          io.to(roomId).emit("chat:typing:stop", { username });
          typingTimeouts.delete(timeoutKey);
        }, 5000);

        typingTimeouts.set(timeoutKey, timeout);
      }
    } else {
      // Stop typing (explicitly)
      if (roomTypers.has(username)) {
        roomTypers.delete(username);
        typingUsersPerRoom.set(roomId, roomTypers);

        io.to(roomId).emit("chat:typing:stop", { username });

        if (typingTimeouts.has(timeoutKey)) {
          clearTimeout(typingTimeouts.get(timeoutKey)!);
          typingTimeouts.delete(timeoutKey);
        }
      }
    }
  });

  // ────────────────────────────────────────────────
  //               Message handling
  // ────────────────────────────────────────────────

  socket.on("chat:message", async (data: Omit<ChatMessage, "id" | "timestamp">) => {
    let message: ChatMessage;

    try {
      // Save to database first to get the database ID
      const dbMessage = await prisma.message.create({
        data: {
          content: data.content,
          type: data.type,
          userId: data.userId,
          roomId: data.roomId.startsWith("room-")
            ? data.roomId.replace("room-", "")
            : data.roomId,
          mentionedUsers: data.mentionedUsers ? JSON.stringify(data.mentionedUsers) : undefined,
        },
      });

      // Create message with database ID
      message = {
        ...data,
        id: dbMessage.id, // Use database-generated ID
        timestamp: new Date(),
      };
    } catch (err) {
      console.error("Failed to save message to database:", err);
      // Fallback to random ID if database save fails
      message = {
        ...data,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(),
      };
    }

    if (!chatHistory.has(data.roomId)) {
      chatHistory.set(data.roomId, []);
    }
    chatHistory.get(data.roomId)!.push(message);

    io.to(data.roomId).emit("chat:message", message);
  });

  // ────────────────────────────────────────────────
  //               Delete message handling
  // ────────────────────────────────────────────────

  socket.on("chat:delete", async (data: { roomId: string, messageId: string }) => {
    try {
      // Remove from in-memory cache
      const roomHistory = chatHistory.get(data.roomId);
      if (roomHistory) {
        const updatedHistory = roomHistory.filter(msg => msg.id !== data.messageId);
        chatHistory.set(data.roomId, updatedHistory);
      }

      // Remove from database (with error handling for cases where message doesn't exist)
      try {
        await prisma.message.delete({
          where: {
            id: data.messageId
          }
        });
      } catch (dbErr: any) {
        if (dbErr.code === 'P2025') {
          // Record not found in database, but we'll continue to emit the event
          console.log(`Message ${data.messageId} not found in database, but removing from UI anyway`);
        } else {
          throw dbErr; // Re-throw if it's a different error
        }
      }

      // Notify all users in the room to remove the message
      io.to(data.roomId).emit("chat:delete", data.messageId);
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  });

  // ────────────────────────────────────────────────
  //               Other existing events
  // ────────────────────────────────────────────────

  socket.on("cursor:move", (data: CursorPosition) => {
    socket.to(data.roomId).emit("cursor:move", data);
  });

  socket.on("editor:active", (data: CursorPosition) => {
    socket.to(data.roomId).emit("editor:active", data);
  });

  socket.on("code:change", (data: CodeChange) => {
    // Legacy broadcast disabled in favor of Yjs
    socket.to(data.roomId).emit("code:change", data);

    // Paste/cheat detection logic (unchanged)
    if (data.changes && Array.isArray(data.changes)) {
      for (const change of data.changes) {
        const text = change.text || "";
        if (text.length > 50) {
          console.log(`[CHEAT DETECT] Possible paste by ${data.userId} (${text.length} chars)`);

          prisma.cheatLog
            .create({
              data: {
                userId: data.userId,
                type: "INSTANT_PASTE",
                severity: 5,
                metadata: { length: text.length, roomId: data.roomId },
              },
            })
            .catch((e) => console.error("Cheat log error:", e));
        }
      }
    }
  });

  // Handle role change requests from admin users
  socket.on("user:role-change", async (data: { roomId: string, userId: string, newRole: "admin" | "writer" | "reader", changerId: string }) => {
    try {
      // Verify that the changer is an admin
      const participants = roomParticipants.get(data.roomId);
      if (!participants) return;

      const changer = participants.get(data.changerId);
      if (changer?.role !== "admin") {
        console.log(`[PERMISSION] User ${data.changerId} attempted to change role without admin privileges`);
        return;
      }

      // Prevent admin from demoting themselves
      if (data.userId === data.changerId && data.newRole !== "admin") {
        console.log(`[PERMISSION] Admin ${data.changerId} attempted to demote themselves`);
        return;
      }

      // Update DB
      await prisma.permission.update({
        where: { roomId_userId: { roomId: data.roomId, userId: data.userId } },
        data: {
          role: data.newRole,
          canWriteCode: data.newRole !== "reader",
          canWriteNotes: data.newRole !== "reader",
          canDraw: data.newRole !== "reader"
        }
      });

      // Update the user's role in memory
      const userToUpdate = participants.get(data.userId);
      if (userToUpdate) {
        userToUpdate.role = data.newRole;

        // Update the user's permissions based on the new role
        userToUpdate.canWriteCode = data.newRole !== "reader";
        userToUpdate.canWriteNotes = data.newRole !== "reader";
        userToUpdate.canDraw = data.newRole !== "reader";

        // Notify all users in the room about the role change
        io.to(data.roomId).emit("user:role-changed", userToUpdate);

        // Also update the room participants list
        io.to(data.roomId).emit("room:users", Array.from(participants.values()));

        console.log(`[ROLE CHANGE] User ${data.userId}'s role changed to ${data.newRole} by ${data.changerId}`);
      }
    } catch (error) {
      console.error("Error handling role change:", error);
    }
  });

  // Handle permission change requests from admin users
  socket.on("user:permission-change", async (data: { roomId: string, userId: string, permissions: { canWriteCode: boolean, canWriteNotes: boolean, canDraw: boolean }, changerId: string }) => {
    try {
      // Verify that the changer is an admin
      const participants = roomParticipants.get(data.roomId);
      if (!participants) return;

      const changer = participants.get(data.changerId);
      if (changer?.role !== "admin") {
        console.log(`[PERMISSION] User ${data.changerId} attempted to change permissions without admin privileges`);
        return;
      }

      // Prevent admin from changing their own permissions
      if (data.userId === data.changerId) {
        console.log(`[PERMISSION] Admin ${data.changerId} attempted to change their own permissions`);
        return;
      }

      // Update DB
      await prisma.permission.update({
        where: { roomId_userId: { roomId: data.roomId, userId: data.userId } },
        data: {
          canWriteCode: data.permissions.canWriteCode,
          canWriteNotes: data.permissions.canWriteNotes,
          canDraw: data.permissions.canDraw
        }
      });

      // Update the user's permissions in memory
      const userToUpdate = participants.get(data.userId);
      if (userToUpdate) {
        userToUpdate.canWriteCode = data.permissions.canWriteCode;
        userToUpdate.canWriteNotes = data.permissions.canWriteNotes;
        userToUpdate.canDraw = data.permissions.canDraw;

        // Notify all users in the room about the permission change
        io.to(data.roomId).emit("user:permission-changed", userToUpdate);

        // Also update the room participants list
        io.to(data.roomId).emit("room:users", Array.from(participants.values()));

        console.log(`[PERMISSION CHANGE] User ${data.userId}'s permissions updated by ${data.changerId}`, data.permissions);
      }
    } catch (error) {
      console.error("Error handling permission change:", error);
    }
  });

  socket.on("report:paste", (data: PasteEvent) => {
    console.log(`Reported paste: ${data.userId} pasted ${data.length} chars`);
    prisma.cheatLog
      .create({
        data: {
          userId: data.userId,
          type: "REPORTED_PASTE",
          severity: 3,
          metadata: data as any,
        },
      })
      .catch((e) => console.error("Cheat log error:", e));
  });

  // ────────────────────────────────────────────────
  //               Drawing Events (Yjs-based)
  // ────────────────────────────────────────────────

  // Debounce map for database writes per room
  const drawingUpdateTimeouts = new Map<string, NodeJS.Timeout>();

  socket.on("drawing:request", async (data: { roomId: string }) => {
    try {
      // 1. Try to get from memory first for freshest state
      const doc = yjsDocInstances.get(data.roomId);
      if (doc) {
        const state = Y.encodeStateAsUpdate(doc);
        if (state.length > 2) { // Empty doc is usually 2 bytes
             socket.emit("drawing:snapshot", { state: state }); // Send as binary buffer
             return;
        }
      }

      // 2. Fallback to Database
      const drawing = await prisma.drawing.findUnique({
        where: { roomId: data.roomId },
      });

      if (drawing?.snapshot) {
          // Load into memory for future speed
          const memDoc = getOrCreateYDoc(data.roomId);
          
          let state: Uint8Array = new Uint8Array();
          const snapshot = drawing.snapshot as any;

          try {
            if (snapshot.state) {
               // Handle Buffer serialized as JSON { type: 'Buffer', data: [...] }
               if (snapshot.state.type === 'Buffer' && Array.isArray(snapshot.state.data)) {
                   state = new Uint8Array(snapshot.state.data);
               } else {
                   // Try treating as array or buffer directly
                   state = new Uint8Array(snapshot.state);
               }
            } else {
               // Fallback: maybe stored directly
               state = new Uint8Array(snapshot);
            }

            if (state.byteLength > 0) {
               Y.applyUpdate(memDoc, state);
            }
          } catch (e) {
            console.error("Error hydrating Yjs doc from DB snapshot:", e);
          }
          
          socket.emit("drawing:snapshot", drawing.snapshot);
      } else {
         socket.emit("drawing:snapshot", null);
      }

    } catch (err) {
      console.error("Failed to load drawing:", err);
      socket.emit("drawing:snapshot", null);
    }
  });

  socket.on("drawing:yjs-update", async (data: { roomId: string; update: Uint8Array }) => { // Expect raw binary
    const { roomId, update } = data;
    try {
        // 1. Apply to Server-Side Doc (Critical for persistence & new users)
        const doc = getOrCreateYDoc(roomId);
        Y.applyUpdate(doc, update);

        // 2. Broadcast binary immediately (Low latency)
        socket.to(roomId).emit("drawing:yjs-update", update);

        // 3. Debounced Persistence (Don't write to DB on every stroke)
        if (drawingUpdateTimeouts.has(roomId)) {
            clearTimeout(drawingUpdateTimeouts.get(roomId)!);
        }

        const timeout = setTimeout(async () => {
            try {
                const snapshot = Y.encodeStateAsUpdate(doc);
                await prisma.drawing.upsert({
                    where: { roomId },
                    update: {
                        snapshot: { state: Buffer.from(snapshot) } as any, // Prisma expects Buffer/Json
                        updatedAt: new Date(),
                    },
                    create: {
                        roomId,
                        snapshot: { state: Buffer.from(snapshot) } as any,
                    },
                });
                socket.emit("drawing:saved");
                // console.log(`[Drawing] Saved ${snapshot.length} bytes for ${roomId}`);
            } catch (err) {
                console.error("Failed to save drawing:", err);
            }
            drawingUpdateTimeouts.delete(roomId);
        }, 2000); // Save after 2s of inactivity

        drawingUpdateTimeouts.set(roomId, timeout);

    } catch (e) {
        console.error("Error handling drawing update:", e);
    }
  });

  // socket.on("drawing:save") removed - server handles persistence now via updates


  // ────────────────────────────────────────────────
  //        Drawing Awareness (Ephemeral Previews)
  // ────────────────────────────────────────────────

  socket.on("drawing:awareness", (data: { roomId: string; clientID: number; state: any; timestamp: number }) => {
    // Forward awareness updates to all other users in the room
    // These are ephemeral stroke previews - never persisted
    socket.to(data.roomId).emit("drawing:awareness", data);
  });

  // ────────────────────────────────────────────────
  //               TipTap Yjs Sync Events
  // ────────────────────────────────────────────────

  socket.on("tiptap:init", async (data: { roomId: string }) => {
    const { roomId } = data;
    console.log(`[TipTap] Init requested for room ${roomId} by ${userId}`);

    // Get or create Y.Doc for this room
    const doc = getOrCreateYDoc(roomId);

    // Check if doc is empty
    const currentState = Y.encodeStateAsUpdate(doc);
    const isEmpty = currentState.length <= 2;

    // If doc is empty, try to load from database
    if (isEmpty) {
      try {
        const dbDoc = await prisma.tipTapDocument.findUnique({
          where: { roomId },
        });

        if (dbDoc && dbDoc.state) {
          const storedState = new Uint8Array(dbDoc.state as Buffer);
          Y.applyUpdate(doc, storedState);
          console.log(`[TipTap] Loaded ${storedState.length} bytes from DB for room ${roomId}`);
        } else {
          console.log(`[TipTap] No existing document found for room ${roomId}`);
        }
      } catch (err) {
        console.error("Failed to load TipTap document from DB:", err);
      }
    } else {
      console.log(`[TipTap] Using existing doc from memory for room ${roomId}`);
    }

    // Send full document state to newly joined user
    const fullState = Y.encodeStateAsUpdate(doc);
    socket.emit("tiptap:init", fullState);
  });

  socket.on("tiptap:update", (data: { roomId: string; update: Uint8Array }) => {
    const { roomId, update } = data;
    // Get the Y.Doc for this room and apply the update
    const doc = getOrCreateYDoc(roomId);
    try {
      Y.applyUpdate(doc, update);
    } catch (err) {
      console.error("[TipTap] Failed to apply update:", err);
    }

    // Broadcast update to all other clients in the room
    socket.to(roomId).emit("tiptap:update", update);

    // Debounced database persistence
    if (yjsPersistenceTimers.has(roomId)) {
      clearTimeout(yjsPersistenceTimers.get(roomId)!);
    }

    const timer = setTimeout(async () => {
      try {
        // Get full document state for persistence
        const fullState = Y.encodeStateAsUpdate(doc);

        await prisma.tipTapDocument.upsert({
          where: { roomId },
          update: {
            state: Buffer.from(fullState),
            updatedAt: new Date(),
          },
          create: {
            roomId,
            state: Buffer.from(fullState),
          },
        });
        console.log(`[TipTap] Persisted document for room ${roomId} (${fullState.byteLength} bytes)`);
      } catch (err) {
        console.error("Failed to persist TipTap document:", err);
      }
      yjsPersistenceTimers.delete(roomId);
    }, PERSISTENCE_DELAY);

    yjsPersistenceTimers.set(roomId, timer);
  });

  socket.on("tiptap:awareness", (data: { roomId: string; awareness: any }) => {
    // Broadcast awareness updates (cursors, selections) to other clients
    socket.to(data.roomId).emit("tiptap:awareness", data.awareness);
  });

  // ────────────────────────────────────────────────
  //               Notes Collaboration Events
  // ────────────────────────────────────────────────

  socket.on("notes:request-snapshot", async (data: { roomId: string }) => {
    console.log(`[Notes] Snapshot requested for room ${data.roomId} by ${userId}`);

    // Get or create Y.Doc for this room
    const doc = getOrCreateYDoc(data.roomId);

    // Check if doc is empty (no content loaded yet)
    const currentState = Y.encodeStateAsUpdate(doc);
    const isEmpty = currentState.length <= 2; // Empty doc has minimal bytes

    // If doc is empty, try to load from database
    if (isEmpty) {
      try {
        const dbDoc = await prisma.tipTapDocument.findUnique({
          where: { roomId: data.roomId },
        });

        if (dbDoc && dbDoc.state) {
          const storedState = new Uint8Array(dbDoc.state as Buffer);
          Y.applyUpdate(doc, storedState);
          console.log(`[Notes] Loaded ${storedState.length} bytes from DB for room ${data.roomId}`);
        } else {
          console.log(`[Notes] No existing document found for room ${data.roomId}`);
        }
      } catch (err) {
        console.error("Failed to load Notes document from DB:", err);
      }
    } else {
      console.log(`[Notes] Using existing doc from memory for room ${data.roomId}`);
    }

    // Send full document state to the requesting client
    const fullState = Y.encodeStateAsUpdate(doc);
    socket.emit("notes:snapshot", { state: Array.from(fullState) });
  });

  socket.on("notes:yjs-update", (data: { roomId: string; update: number[] }) => {
    const update = new Uint8Array(data.update);

    // Get the Y.Doc for this room and apply the update
    const doc = getOrCreateYDoc(data.roomId);
    try {
      Y.applyUpdate(doc, update);
    } catch (err) {
      console.error("[Notes] Failed to apply update:", err);
    }

    // Broadcast update to all other clients in the room
    socket.to(data.roomId).emit("notes:yjs-update", { update: data.update });

    // Debounced database persistence
    if (yjsPersistenceTimers.has(data.roomId)) {
      clearTimeout(yjsPersistenceTimers.get(data.roomId)!);
    }

    const timer = setTimeout(async () => {
      try {
        // Get full document state for persistence
        const fullState = Y.encodeStateAsUpdate(doc);

        await prisma.tipTapDocument.upsert({
          where: { roomId: data.roomId },
          update: {
            state: Buffer.from(fullState),
            updatedAt: new Date(),
          },
          create: {
            roomId: data.roomId,
            state: Buffer.from(fullState),
          },
        });
        console.log(`[Notes] Persisted document for room ${data.roomId} (${fullState.byteLength} bytes)`);
      } catch (err) {
        console.error("Failed to persist Notes document:", err);
      }
      yjsPersistenceTimers.delete(data.roomId);
    }, PERSISTENCE_DELAY);

    yjsPersistenceTimers.set(data.roomId, timer);
  });

  socket.on("notes:awareness", (data: { roomId: string; clientID: number; state: any }) => {
    // Broadcast awareness updates (cursors, selections) to other clients
    socket.to(data.roomId).emit("notes:awareness", data);
  });

  // ────────────────────────────────────────────────
  //               Code Editor Events (Yjs-based)
  // ────────────────────────────────────────────────

  socket.on("code:request-snapshot", async (data: { roomId: string }) => {
    try {
      // 1. Try to get from memory
      const doc = getOrCreateYDoc(data.roomId);
      const state = Y.encodeStateAsUpdate(doc);
      
      // If doc is empty (just created), we might want to check if there's persistence (optional, not implemented for code yet)
      // For now, just return the state. Client handles initialization if empty.
      socket.emit("code:snapshot", { state });
    } catch (err) {
      console.error("Failed to load code snapshot:", err);
      socket.emit("code:snapshot", null);
    }
  });

  socket.on("code:yjs-update", (data: { roomId: string; update: Uint8Array }) => {
    const { roomId, update } = data;
    const doc = getOrCreateYDoc(roomId);
    try {
      Y.applyUpdate(doc, update);
    } catch (err) {
      console.error("[Code] Failed to apply update:", err);
    }

    // Broadcast binary immediately
    socket.to(roomId).emit("code:yjs-update", update);
  });

  // ────────────────────────────────────────────────
  //               Output Sync Events
  // ────────────────────────────────────────────────

  socket.on("code:output", (data: { roomId: string; output: any; logs: any }) => {
    // Broadcast output to everyone else in the room
    socket.to(data.roomId).emit("code:output", data);
  });

  // ────────────────────────────────────────────────
  //               Video/Audio Call Events
  // ────────────────────────────────────────────────

  // Initialize call set for room if not exists
  if (!usersInCall.has(roomId)) {
    usersInCall.set(roomId, new Set());
  }

  socket.on("call:join", (data: { roomId: string }) => {
    const roomCallUsers = usersInCall.get(data.roomId) || new Set();

    // Add user to call
    roomCallUsers.add(userId);
    usersInCall.set(data.roomId, roomCallUsers);

    // Notify other users in the room that someone joined the call
    socket.to(data.roomId).emit("call:user-connected", { userId });

    console.log(`User ${username} joined call in room ${data.roomId}`);
  });

  socket.on("call:signal", (data: { roomId: string, targetUserId: string, signal: any }) => {
    // Find the socket of the target user and emit the signal to them
    for (const [socketId, socketInfo] of io.sockets.sockets) {
      if (socketInfo.handshake.query.userId === data.targetUserId &&
          socketInfo.handshake.query.roomId === data.roomId) {
        socket.to(socketId).emit("call:signal", {
          userId: userId,
          signal: data.signal
        });
        break;
      }
    }
  });

  socket.on("call:leave", (data: { roomId: string }) => {
    const roomCallUsers = usersInCall.get(data.roomId);
    if (roomCallUsers) {
      roomCallUsers.delete(userId);

      // Notify other users in the call that someone left
      socket.to(data.roomId).emit("call:user-disconnected", { userId });

      console.log(`User ${username} left call in room ${data.roomId}`);
    }
  });

  // ────────────────────────────────────────────────
  //               Disconnect cleanup
  // ────────────────────────────────────────────────

  socket.on("disconnect", () => {
    if (!roomId || !userId) return;

    const participants = roomParticipants.get(roomId);
    if (participants) {
      participants.delete(userId);
      io.to(roomId).emit("room:users", Array.from(participants.values()));

      if (participants.size === 0) {
        roomParticipants.delete(roomId);
        typingUsersPerRoom.delete(roomId);
        yjsDocInstances.delete(roomId); // Clean up Yjs document

        // Clean up call users for this room
        usersInCall.delete(roomId);
      }
    }

    // Clean up typing status
    const roomTypers = typingUsersPerRoom.get(roomId);
    if (roomTypers?.has(username)) {
      roomTypers.delete(username);
      io.to(roomId).emit("chat:typing:stop", { username });
    }

    const timeoutKey = `${roomId}-${username}`;
    if (typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingTimeouts.get(timeoutKey)!);
      typingTimeouts.delete(timeoutKey);
    }

    // Clean up call status
    const roomCallUsers = usersInCall.get(roomId);
    if (roomCallUsers?.has(userId)) {
      roomCallUsers.delete(userId);
      io.to(roomId).emit("call:user-disconnected", { userId });
    }

    console.log(`User ${username} (${userId}) left room ${roomId}`);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on http://localhost:${PORT}`);
});
