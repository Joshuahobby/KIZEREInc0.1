
import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./use-auth";

let globalSocket: Socket | null = null;

export function useSocket() {
    const { user } = useAuth();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const isVercel = window.location.hostname.endsWith('vercel.app');
        if (isVercel) {
            console.info("[Socket] Skipping connection on Vercel (WebSockets limited)");
            return;
        }

        const socket = io(window.location.origin, {
            path: "/ws",
            transports: ["polling", "websocket"],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 3, // Reduced from 5
            reconnectionDelay: 5000, // Increased from 3000
        });

        socket.on("connect", () => {
            console.log("[Socket] Connected:", socket.id);
            // Authenticate with userId
            socket.emit("auth", user.id);
        });

        socket.on("disconnect", (reason) => {
            console.log("[Socket] Disconnected:", reason);
        });

        socket.on("connect_error", (err) => {
            console.warn("[Socket] Connection error:", err.message);
        });

        globalSocket = socket;
        socketRef.current = socket;

        return () => {
            // Don't disconnect on unmount — keep connection alive across navigation
        };
    }, [user]);

    const joinChat = useCallback((chatId: number) => {
        socketRef.current?.emit("chat:join", chatId);
    }, []);

    const leaveChat = useCallback((chatId: number) => {
        socketRef.current?.emit("chat:leave", chatId);
    }, []);

    const sendTyping = useCallback((chatId: number, isTyping: boolean) => {
        if (!user) return;
        socketRef.current?.emit("chat:typing", { chatId, userId: user.id, isTyping });
    }, [user]);

    const onEvent = useCallback((event: string, handler: (...args: any[]) => void) => {
        socketRef.current?.on(event, handler);
        return () => {
            socketRef.current?.off(event, handler);
        };
    }, []);

    return {
        socket: socketRef.current,
        joinChat,
        leaveChat,
        sendTyping,
        onEvent,
        isConnected: socketRef.current?.connected ?? false,
    };
}
