
import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import passport from "passport";
import { createLogger } from "./utils/logger";
import { sessionMiddleware } from "./auth";
import { storage } from "./storage";

const logger = createLogger("WebSocket");

let io: Server | null = null;

// Map of userId -> Set of socket IDs
const userSockets = new Map<number, Set<string>>();

// Wraps Express middleware so Socket.IO can use it on the upgrade request
const wrap = (middleware: any) => (socket: any, next: any) =>
  middleware(socket.request, socket.request.res || {}, next);

export function setupWebSocket(httpServer: HttpServer): Server | null {
    // Socket.io is not compatible with Vercel serverless functions
    if (process.env.VERCEL === "1") {
        logger.info("WebSocket: Skipping initialization on Vercel (serverless environment)");
        return null;
    }

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

    // Apply session + passport middleware so socket.request.user is populated
    io.use(wrap(sessionMiddleware));
    io.use(wrap(passport.initialize()));
    io.use(wrap(passport.session()));

    // Reject unauthenticated connections at the handshake level
    io.use((socket, next) => {
        const user = (socket.request as any).user;
        if (!user) {
            logger.warn("WebSocket: rejected unauthenticated connection", { socketId: socket.id });
            return next(new Error("Authentication required"));
        }
        next();
    });

    io.on("connection", (socket: Socket) => {
        const sessionUser = (socket.request as any).user;
        logger.info("Socket connected", { socketId: socket.id, userId: sessionUser.id });

        // Auto-join the authenticated user's notification room
        socket.join(`user:${sessionUser.id}`);
        if (!userSockets.has(sessionUser.id)) {
            userSockets.set(sessionUser.id, new Set());
        }
        userSockets.get(sessionUser.id)!.add(socket.id);

        // "auth" event is kept for backwards compatibility but now verifies against the session user
        socket.on("auth", (userId: number) => {
            if (!userId || userId !== sessionUser.id) {
                logger.warn("WebSocket: auth event userId mismatch — ignoring", {
                    claimed: userId,
                    actual: sessionUser.id,
                });
                return;
            }
            logger.info("User confirmed auth on socket", { userId, socketId: socket.id });
        });

        // Chat: join a specific chat room (verify the user is a participant)
        socket.on("chat:join", async (chatId: number) => {
            try {
                const chat = await storage.getChat(chatId);
                if (!chat) return;
                if (chat.finderId !== sessionUser.id && chat.claimantId !== sessionUser.id) {
                    logger.warn("WebSocket: unauthorized chat:join attempt", {
                        userId: sessionUser.id,
                        chatId,
                    });
                    return;
                }
                socket.join(`chat:${chatId}`);
                logger.info("Socket joined chat room", { chatId, socketId: socket.id });
            } catch (err) {
                logger.error("chat:join error", { err });
            }
        });

        // Chat: leave a specific chat room
        socket.on("chat:leave", (chatId: number) => {
            socket.leave(`chat:${chatId}`);
        });

        // Chat: typing indicator (broadcast to other participants only)
        socket.on("chat:typing", (data: { chatId: number; isTyping: boolean }) => {
            socket.to(`chat:${data.chatId}`).emit("chat:typing", {
                userId: sessionUser.id,
                isTyping: data.isTyping,
            });
        });

        // Cleanup on disconnect
        socket.on("disconnect", () => {
            const sockets = userSockets.get(sessionUser.id);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    userSockets.delete(sessionUser.id);
                }
            }
            logger.info("Socket disconnected", { socketId: socket.id, userId: sessionUser.id });
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
 * Emit a security alert to a specific user (Retailer/Admin)
 */
export function emitSecurityAlert(userId: number, data: {
    type: "stolen_item_detected";
    serialNumber: string;
    itemName: string;
    source: string;
    timestamp: string;
}) {
    if (!io) return;
    io.to(`user:${userId}`).emit("security:alert", data);
}

/**
 * Check if a user is currently online
 */
export function isUserOnline(userId: number): boolean {
    return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
}
