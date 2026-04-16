import { storage } from "../storage";
import { createLogger } from "../utils/logger";

const logger = createLogger("ConsumerSubscriptionService");

const SUBSCRIPTION_DURATION_MS = 365 * 24 * 60 * 60 * 1000; // 1 year
export const FREE_TIER_REGISTRATION_LIMIT = 3;

export class ConsumerSubscriptionService {
  /**
   * Finalize a completed consumer_subscription payment.
   * Sets premiumExpiresAt to 1 year from now (stacks if still active)
   * and resets premiumRegistrationCount to 0.
   * Idempotent: safe to call more than once for the same payment.
   */
  static async finalizeSubscription(paymentId: number): Promise<void> {
    const payment = await storage.getPayment(paymentId);
    if (!payment) {
      throw new Error(`Consumer subscription payment ${paymentId} not found`);
    }

    const user = await storage.getUser(payment.userId);
    if (!user) {
      throw new Error(`User ${payment.userId} not found for payment ${paymentId}`);
    }

    const now = new Date();
    const baseDate =
      user.premiumExpiresAt && user.premiumExpiresAt > now
        ? user.premiumExpiresAt
        : now;

    const newExpiry = new Date(baseDate.getTime() + SUBSCRIPTION_DURATION_MS);

    await storage.updateUser(payment.userId, {
      premiumExpiresAt: newExpiry,
      premiumRegistrationCount: 0,
    });

    logger.info("Consumer premium subscription activated", {
      paymentId,
      userId: payment.userId,
      newExpiry,
      previousExpiry: user.premiumExpiresAt,
    });
  }

  /**
   * Returns true if the user currently has an active premium subscription.
   */
  static isPremium(user: { premiumExpiresAt?: Date | null }): boolean {
    if (!user.premiumExpiresAt) return false;
    return user.premiumExpiresAt > new Date();
  }

  /**
   * Check whether a user is allowed to register another item.
   * - Admin / Agent / Business: always allowed.
   * - Premium subscribers: always allowed.
   * - Free-tier subscribers: allowed up to FREE_TIER_REGISTRATION_LIMIT registrations.
   */
  static async canRegisterItem(
    userId: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    const user = await storage.getUser(userId);
    if (!user) return { allowed: false, reason: "User not found" };

    if (["Admin", "Agent", "Business", "Retailer"].includes(user.role)) {
      return { allowed: true };
    }

    if (ConsumerSubscriptionService.isPremium(user)) {
      return { allowed: true };
    }

    const count = user.premiumRegistrationCount ?? 0;
    if (count < FREE_TIER_REGISTRATION_LIMIT) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Free accounts can register up to ${FREE_TIER_REGISTRATION_LIMIT} items. Upgrade to KIZERE Premium for unlimited registrations.`,
    };
  }

  /**
   * Increment the registration count for free-tier users.
   * Skipped for premium or privileged roles.
   */
  static async incrementRegistrationCount(userId: number): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) return;

    if (["Admin", "Agent", "Business", "Retailer"].includes(user.role)) return;
    if (ConsumerSubscriptionService.isPremium(user)) return;

    const current = user.premiumRegistrationCount ?? 0;
    await storage.updateUser(userId, { premiumRegistrationCount: current + 1 });
  }
}
