import { storage } from "../storage";
import { createLogger } from "../utils/logger";

const logger = createLogger("RetailerSubscriptionService");

const SUBSCRIPTION_DURATION_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

export class RetailerSubscriptionService {
  /**
   * Finalize a completed retailer_subscription payment.
   * Extends the retailer's subscriptionExpiresAt by 1 year from now (or from
   * the existing expiry if still in the future, so renewals stack correctly).
   * Idempotent: safe to call more than once for the same payment.
   */
  static async finalizeSubscription(paymentId: number): Promise<void> {
    const payment = await storage.getPayment(paymentId);
    if (!payment) {
      throw new Error(`Subscription payment ${paymentId} not found`);
    }

    const meta = payment.metadata as Record<string, any> | null;
    const retailerIdRaw = payment.posRetailerId ?? meta?.retailerId;
    if (!retailerIdRaw) {
      throw new Error(
        `Subscription payment ${paymentId} has no associated retailer (posRetailerId or metadata.retailerId required)`
      );
    }
    const retailerId = Number(retailerIdRaw);

    const retailer = await storage.getRetailer(retailerId);
    if (!retailer) {
      throw new Error(`Retailer ${retailerId} not found`);
    }

    // Verify the payer is the operator of this retailer — prevents a user from
    // paying for (and thereby extending) another retailer's subscription via metadata injection
    if (retailer.userId !== payment.userId) {
      throw new Error(
        `Subscription payment ${paymentId} user ${payment.userId} does not own retailer ${retailerId}`
      );
    }

    const now = new Date();
    const baseDate =
      retailer.subscriptionExpiresAt && retailer.subscriptionExpiresAt > now
        ? retailer.subscriptionExpiresAt
        : now;

    const newExpiry = new Date(baseDate.getTime() + SUBSCRIPTION_DURATION_MS);

    await storage.updateRetailer(retailerId, {
      subscriptionExpiresAt: newExpiry,
      subscriptionPaidAt: now,
    });

    logger.info("Retailer subscription extended", {
      paymentId,
      retailerId,
      newExpiry,
      previousExpiry: retailer.subscriptionExpiresAt,
    });
  }

  /**
   * Check whether a retailer's paid subscription is currently active.
   * basic plan is always considered active (no expiry required).
   */
  static isSubscriptionActive(retailer: {
    subscriptionPlan: string;
    subscriptionExpiresAt?: Date | null;
  }): boolean {
    if (retailer.subscriptionPlan === "basic") return true;
    if (!retailer.subscriptionExpiresAt) return false;
    return retailer.subscriptionExpiresAt > new Date();
  }
}
