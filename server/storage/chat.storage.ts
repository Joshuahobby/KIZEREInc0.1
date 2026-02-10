import { db } from "../db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import {
    chats, messages, users,
    type Chat, type InsertChat, type Message, type InsertMessage
} from "@shared/schema";

/**
 * Get a single chat by ID
 */
export async function getChat(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat;
}

/**
 * Get chat for a specific claim
 */
export async function getChatForClaim(claimId: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.claimId, claimId));
    return chat;
}

/**
 * Get all chats for a user (either as finder or claimant)
 */
export async function getUserChats(userId: number): Promise<Chat[]> {
    return await db.select()
        .from(chats)
        .where(or(
            eq(chats.finderId, userId),
            eq(chats.claimantId, userId)
        ))
        .orderBy(desc(chats.createdAt));
}

/**
 * Create a new chat
 */
export async function createChat(chat: InsertChat): Promise<Chat> {
    const [newChat] = await db.insert(chats).values(chat).returning();
    return newChat;
}

/**
 * Get all messages for a chat
 */
export async function getMessages(chatId: number): Promise<Message[]> {
    return await db.select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(desc(messages.timestamp));
}

/**
 * Create a new message
 */
export async function createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
}

/**
 * Mark all messages in a chat as read for a specific recipient
 */
export async function markMessagesAsRead(chatId: number, userId: number): Promise<void> {
    await db.update(messages)
        .set({ isRead: true })
        .where(and(
            eq(messages.chatId, chatId),
            sql`${messages.senderId} != ${userId}`,
            eq(messages.isRead, false)
        ));
}
