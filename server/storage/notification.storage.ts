import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { notifications, type Notification, type InsertNotification } from "@shared/schema";

export async function getNotification(id: number): Promise<Notification | undefined> {
  const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
  return notification;
}

export async function getUserNotifications(userId: number): Promise<Notification[]> {
  return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function createNotification(notification: InsertNotification): Promise<Notification> {
  const [newNotification] = await db.insert(notifications).values(notification).returning();
  return newNotification;
}

export async function markNotificationAsRead(id: number): Promise<Notification | undefined> {
  const [updatedNotification] = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
  return updatedNotification;
}

export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// Push Subscription methods
import { pushSubscriptions, type PushSubscription, type InsertPushSubscription } from "@shared/schema";

export async function createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
  const [newSub] = await db.insert(pushSubscriptions)
    .values(subscription)
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        userAgent: subscription.userAgent,
        updatedAt: new Date()
      }
    })
    .returning();
  return newSub;
}

export async function getUserPushSubscriptions(userId: number): Promise<PushSubscription[]> {
  return await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}
