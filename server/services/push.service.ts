import webpush from "web-push";
import { storage } from "../storage";
import { createLogger } from "../utils/logger";

const logger = createLogger('PushService');

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const contactEmail = process.env.CONTACT_EMAIL || "admin@kizere.rw";

if (!vapidPublicKey || !vapidPrivateKey) {
    logger.warn("VAPID keys not found in environment variables. Web Push will not work.");
} else {
    webpush.setVapidDetails(
        `mailto:${contactEmail}`,
        vapidPublicKey,
        vapidPrivateKey
    );
}

export class PushService {
    /**
     * Send a push notification to all subscriptions of a specific user
     */
    static async sendToUser(userId: number, payload: { title: string; body: string; data?: any }) {
        try {
            const subscriptions = await storage.getUserPushSubscriptions(userId);

            const results = await Promise.allSettled(
                subscriptions.map(async (sub) => {
                    const pushSubscription = {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth
                        }
                    };

                    try {
                        await webpush.sendNotification(
                            pushSubscription,
                            JSON.stringify(payload)
                        );
                    } catch (error: any) {
                        // If subscription is expired or invalid, remove it
                        if (error.statusCode === 404 || error.statusCode === 410) {
                            logger.info("Push subscription expired or invalid, removing", { endpoint: sub.endpoint });
                            await storage.deletePushSubscription(sub.endpoint);
                        } else {
                            throw error;
                        }
                    }
                })
            );

            const failed = results.filter(r => r.status === "rejected");
            if (failed.length > 0) {
                logger.error("Some push notifications failed to send", { count: failed.length });
            }

            return results;
        } catch (error) {
            logger.error("Error sending push notifications to user", { userId, error });
            return [];
        }
    }

    /**
     * Helper to send notification for a new chat message
     */
    static async notifyNewMessage(userId: number, senderName: string, chatId: number, content: string) {
        return this.sendToUser(userId, {
            title: `New message from ${senderName}`,
            body: content.length > 50 ? `${content.substring(0, 47)}...` : content,
            data: {
                type: "chat_message",
                chatId,
                url: `/dashboard/chat/${chatId}`
            }
        });
    }

    /**
     * Helper to send notification for a report match
     */
    static async notifyReportMatch(userId: number, reportId: number, matchScore: number) {
        return this.sendToUser(userId, {
            title: "Potential Match Found!",
            body: `A new report matches your post with ${matchScore}% confidence.`,
            data: {
                type: "report_match",
                reportId,
                url: `/dashboard/reports/${reportId}`
            }
        });
    }
}
