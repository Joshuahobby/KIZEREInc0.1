
import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { createLogger } from "./utils/logger";

const logger = createLogger("WebSocket");

let io: Server | null = null;

// Map of userId -> Set of socket IDs
const userSockets = new Map<number, Set<string>>();

export function setupWebSocket(httpServer: HttpServer): Server {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.NODE_ENV === "production"
                ? process.env.FRONTEND_URL || false
                : "*",
            credentials: true,
        },
        path: "/ws",
        transports: ["websocket", "polling"],
    });

    io.on("connection", (socket: Socket) => {
        logger.info("Socket connected", { socketId: socket.id });

        // Authenticate: client sends userId after connecting
        socket.on("auth", (userId: number) => {
            if (!userId) return;

            // Join a user-specific room
            socket.join(`user:${userId}`);

            // Track the mapping
            if (!userSockets.has(userId)) {
                userSockets.set(userId, new Set());
            }
            userSockets.get(userId)!.add(socket.id);

            logger.info("User authenticated on socket", { userId, socketId: socket.id });
        });

        // Chat: join a specific chat room
        socket.on("chat:join", (chatId: number) => {
            socket.join(`chat:${chatId}`);
            logger.info("Socket joined chat room", { chatId, socketId: socket.id });
        });

        // Chat: leave a specific chat room
        socket.on("chat:leave", (chatId: number) => {
            socket.leave(`chat:${chatId}`);
        });

        // Chat: typing indicator
        socket.on("chat:typing", (data: { chatId: number; userId: number; isTyping: boolean }) => {
            socket.to(`chat:${data.chatId}`).emit("chat:typing", {
                userId: data.userId,
                isTyping: data.isTyping,
            });
        });

        // Cleanup on disconnect
        socket.on("disconnect", () => {
            // Clean up userSockets map
            for (const [userId, sockets] of Array.from(userSockets.entries())) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    userSockets.delete(userId);
                }
            }
            logger.info("Socket disconnected", { socketId: socket.id });
        });
    });

    logger.info("WebSocket server initialized");
    return io;
}

/**
 * Get the Socket.IO server instance
 */
export function getIO(): Server | null {
    return io;
}

/**
 * Emit a notification to a specific user
 */
export function emitToUser(userId: number, event: string, data: any) {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, data);
}

/**
 * Emit a new chat message to a chat room
 */
export function emitChatMessage(chatId: number, message: any) {
    if (!io) return;
    io.to(`chat:${chatId}`).emit("chat:message", message);
}

/**
 * Emit a notification event (for live badge updates)
 */
export function emitNotification(userId: number, notification: any) {
    if (!io) return;
    io.to(`user:${userId}`).emit("notification:new", notification);
}

/**
 * Check if a user is currently online
 */
export function isUserOnline(userId: number): boolean {
    return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
}
