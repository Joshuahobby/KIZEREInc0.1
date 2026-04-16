import { db } from "../db";
import { retailers, users } from "@shared/schema";
import { eq, and, lte, gte, ne } from "drizzle-orm";
import { createLogger } from "../utils/logger";
import { sendSubscriptionReminderEmail } from "../services/email.service";

const logger = createLogger("SubscriptionReminderCron");

const REMINDER_WINDOW_DAYS = 7;
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // once per day

export function startSubscriptionReminderCron() {
  logger.info("Starting subscription reminder cron job...");

  // Run immediately on startup, then every 24 hours
  runReminderCheck();
  setInterval(runReminderCheck, CHECK_INTERVAL_MS);
}

async function runReminderCheck() {
  try {
    logger.info("Running subscription expiry reminder check...");

    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    // Find paid-plan retailers whose subscription expires within the next 7 days
    // (but hasn't already expired)
    const expiringRetailers = await db
      .select({ retailer: retailers, user: users })
      .from(retailers)
      .leftJoin(users, eq(retailers.userId, users.id))
      .where(
        and(
          ne(retailers.subscriptionPlan, "basic"),
          gte(retailers.subscriptionExpiresAt, now),
          lte(retailers.subscriptionExpiresAt, windowEnd)
        )
      );

    logger.info(`Found ${expiringRetailers.length} retailers with subscriptions expiring within 7 days`);

    for (const { retailer, user } of expiringRetailers) {
      if (!user?.email || !retailer.subscriptionExpiresAt) continue;

      const renewalLink = `${process.env.APP_URL || "https://kizere.rw"}/pos/subscription/renew`;

      try {
        await sendSubscriptionReminderEmail(
          user.email,
          retailer.name,
          retailer.subscriptionPlan,
          retailer.subscriptionExpiresAt,
          renewalLink
        );
        logger.info("Subscription reminder sent", {
          retailerId: retailer.id,
          email: user.email,
          expiresAt: retailer.subscriptionExpiresAt,
        });
      } catch (err) {
        logger.error("Failed to send subscription reminder", {
          retailerId: retailer.id,
          error: err,
        });
      }
    }
  } catch (error) {
    logger.error("Error in subscription reminder cron", { error });
  }
}
