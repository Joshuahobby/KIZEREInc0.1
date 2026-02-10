import { Router } from "express";
import { storage } from "../storage";
import { insertMessageSchema, insertChatSchema } from "@shared/schema";
import { z } from "zod";
import { createLogger } from "../utils/logger";

const logger = createLogger('ChatRoutes');
const router = Router();

/**
 * GET /api/chats
 * Get all chats for the current user
 */
router.get("/", async (req, res) => {
    try {
        const chats = await storage.getUserChats(req.user!.id);
        res.json(chats);
    } catch (error) {
        logger.error("Failed to fetch user chats:", error);
        res.status(500).json({ message: "Failed to fetch chats" });
    }
});

/**
 * GET /api/chats/:id
 * Get a specific chat with its messages
 */
router.get("/:id", async (req, res) => {
    try {
        const chatId = parseInt(req.params.id);
        if (isNaN(chatId)) return res.status(400).json({ message: "Invalid chat ID" });

        const chat = await storage.getChat(chatId);
        if (!chat) return res.status(404).json({ message: "Chat not found" });

        // Authorization check
        if (chat.finderId !== req.user!.id && chat.claimantId !== req.user!.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        const messages = await storage.getMessages(chatId);
        res.json({ ...chat, messages });
    } catch (error) {
        logger.error("Failed to fetch chat:", error);
        res.status(500).json({ message: "Failed to fetch chat" });
    }
});

/**
 * POST /api/chats/initialize
 * Create a new chat for a claim (usually triggered when a claim is verified or when coordination starts)
 */
router.post("/initialize", async (req, res) => {
    try {
        const { claimId } = req.body;
        if (!claimId) return res.status(400).json({ message: "Claim ID is required" });

        const claim = await storage.getClaim(claimId);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        const report = await storage.getReport(claim.reportId);
        if (!report) return res.status(404).json({ message: "Report not found" });

        // Authorization check: Only finder or claimant can start a chat
        const isFinder = report.userId === req.user!.id;
        const isClaimant = claim.userId === req.user!.id;

        if (!isFinder && !isClaimant) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Check if chat already exists
        let chat = await storage.getChatForClaim(claimId);
        if (!chat) {
            chat = await storage.createChat({
                claimId,
                reportId: report.id,
                finderId: report.userId,
                claimantId: claim.userId
            });
            logger.info('New chat initialized', { chatId: chat.id, claimId });
        }

        res.status(201).json(chat);
    } catch (error) {
        logger.error("Failed to initialize chat:", error);
        res.status(500).json({ message: "Failed to initialize chat" });
    }
});

/**
 * POST /api/chats/:id/messages
 * Send a message in a chat
 */
router.post("/:id/messages", async (req, res) => {
    try {
        const chatId = parseInt(req.params.id);
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: "Message content is required" });
        }

        const chat = await storage.getChat(chatId);
        if (!chat) return res.status(404).json({ message: "Chat not found" });

        // Authorization check
        if (chat.finderId !== req.user!.id && chat.claimantId !== req.user!.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        const newMessage = await storage.createMessage({
            chatId,
            senderId: req.user!.id,
            content,
            isRead: false
        });

        // Notify the recipient (in-app)
        const recipientId = chat.finderId === req.user!.id ? chat.claimantId : chat.finderId;
        const report = await storage.getReport(chat.reportId);

        await storage.createNotification({
            userId: recipientId,
            title: "New Message",
            message: `You have a new message regarding: ${report?.title || 'Claim #' + chat.claimId}`,
            type: 'chat_message',
            isRead: false,
            relatedReportId: chat.reportId
        });

        res.status(201).json(newMessage);
    } catch (error) {
        logger.error("Failed to send message:", error);
        res.status(500).json({ message: "Failed to send message" });
    }
});

/**
 * PATCH /api/chats/:id/read
 * Mark messages in a chat as read
 */
router.patch("/:id/read", async (req, res) => {
    try {
        const chatId = parseInt(req.params.id);
        await storage.markMessagesAsRead(chatId, req.user!.id);
        res.json({ success: true });
    } catch (error) {
        logger.error("Failed to mark messages as read:", error);
        res.status(500).json({ message: "Failed to update read status" });
    }
});

export default router;
