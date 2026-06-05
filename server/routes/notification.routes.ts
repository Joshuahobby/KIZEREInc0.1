import { Router } from "express";
import { storage } from "../storage";
import { createLogger } from "../utils/logger";
import { requireAdmin } from "../middleware/auth.middleware";
import { z } from "zod";

const logger = createLogger('NotificationRoutes');
const router = Router();

// Notifications API
router.get("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const notifications = await storage.getUserNotifications(userId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

router.patch("/:id/read", async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const notification = await storage.getNotification(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.userId !== req.user!.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updated = await storage.markNotificationAsRead(notificationId);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update notification" });
  }
});

router.post("/mark-all-read", async (req, res) => {
  try {
    const userId = req.user!.id;
    await storage.markAllNotificationsAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
});

// Get unread notification count (for live badge)
router.get("/unread-count", async (req, res) => {
  try {
    const userId = req.user!.id;
    const notifications = await storage.getUserNotifications(userId);
    const unreadCount = notifications.filter((n: any) => !n.isRead).length;
    res.json({ count: unreadCount });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
});

// Web Push API
router.get("/vapid-public-key", (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  if (!publicKey) {
    return res.status(500).json({ message: "VAPID public key not configured" });
  }
  res.json({ publicKey });
});

router.post("/subscribe", async (req, res) => {
  try {
    const { subscription, userAgent } = req.body;
    const userId = req.user!.id;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ message: "Invalid subscription" });
    }

    await storage.createPushSubscription({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent || req.headers['user-agent']
    });

    res.json({ success: true });
  } catch (error: any) {
    logger.error("Error subscribing to push notifications", { error });
    res.status(500).json({ message: "Failed to subscribe" });
  }
});

router.post("/unsubscribe", async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ message: "Endpoint required" });
    }
    // Verify the subscription belongs to the authenticated user
    const userSubs = await storage.getUserPushSubscriptions(req.user!.id);
    const owns = userSubs.some((s: any) => s.endpoint === endpoint);
    if (!owns) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await storage.deletePushSubscription(endpoint);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to unsubscribe" });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const notification = await storage.getNotification(id);
        
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        if (notification.userId !== req.user!.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await storage.deleteNotification(id);
        res.status(204).end();
    } catch (error) {
        logger.error("Failed to delete notification:", error);
        res.status(500).json({ message: "Failed to delete notification" });
    }
});

/**
 * DELETE /api/notifications
 * Clear all notifications for the user
 */
router.delete("/", async (req, res) => {
    try {
        await storage.deleteAllNotifications(req.user!.id);
        res.status(204).end();
    } catch (error) {
        logger.error("Failed to clear notifications:", error);
        res.status(500).json({ message: "Failed to clear notifications" });
    }
});

/**
 * POST /api/notifications/broadcast
 * Admin-only: create an in-app notification for all users (or a specific role).
 */
const broadcastSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.string().default("system_alert"),
  targetRole: z.string().optional(), // omit to broadcast to all users
});

router.post("/broadcast", requireAdmin, async (req, res) => {
  try {
    const { title, message, type, targetRole } = broadcastSchema.parse(req.body);

    const recipients = targetRole
      ? await storage.getUsersByRole([targetRole])
      : await storage.getAllUsers();

    if (recipients.length === 0) {
      return res.status(400).json({ message: "No recipients matched the specified role" });
    }

    // Insert notifications in batches to avoid overwhelming the DB
    const BATCH_SIZE = 200;
    let sent = 0;
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(user =>
        storage.createNotification({
          userId: user.id,
          title,
          message,
          type,
          isRead: false,
          relatedItemId: null,
          relatedReportId: null,
        })
      ));
      sent += batch.length;
    }

    logger.info("Broadcast notification sent", {
      adminId: req.user!.id,
      title,
      targetRole: targetRole ?? "all",
      recipientCount: sent,
    });

    res.json({ success: true, sent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid broadcast data", errors: error.errors });
    }
    logger.error("Failed to broadcast notification", { error });
    res.status(500).json({ message: "Failed to send broadcast" });
  }
});

export default router;
