import { db } from "../db";
import { reports, users } from "@shared/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { createLogger } from "../utils/logger";
import { sendExpirationEmail } from "../services/email.service";
import otpService from "../services/otp.service";



const logger = createLogger('ExpirationCron');

export function startExpirationCron() {
  logger.info("Starting expiration cron job...");

  // Run every hour
  setInterval(async () => {
    try {
      logger.info('Running expiration check...');
      const now = new Date();

      // Cleanup expired verification codes
      try {
        await otpService.cleanupExpiredCodes();
        logger.info('Cleaned up expired verification codes');
      } catch (error) {
        logger.error('Error cleaning up expired verification codes', { error });
      }


      // Find expired reports
      const expiredReports = await db.select({
        report: reports,
        user: users
      })
      .from(reports)
      .leftJoin(users, eq(reports.userId, users.id))
      .where(and(
        eq(reports.status, 'Open'),
        lte(reports.expirationDate, now)
      ));

      logger.info(`Found ${expiredReports.length} expired reports`);

      for (const { report, user } of expiredReports) {
        // Update status to Expired
        await db.update(reports)
          .set({ status: 'Expired' })
          .where(eq(reports.id, report.id));

        // Send notification
        if (user && user.email) {
          const renewalLink = `${process.env.APP_URL || 'https://kizere.rw'}/renew/${report.id}`;
          await sendExpirationEmail(
            user.email,
            user.fullName,
            report.title,
            report.id,
            renewalLink
          );
        }
      }

      // Cleanup expired featured status (after 30 days)
      try {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const expiredFeatured = await db.update(reports)
          .set({ isFeatured: false })
          .where(and(
            eq(reports.isFeatured, true),
            lte(reports.featuredAt, thirtyDaysAgo)
          ))
          .returning();
        
        if (expiredFeatured.length > 0) {
          logger.info(`Unfeatured ${expiredFeatured.length} reports due to expiration`);
        }
      } catch (error) {
        logger.error('Error cleaning up expired featured status', { error });
      }

    } catch (error) {
      logger.error('Error in expiration cron', { error });
    }
  }, 1000 * 60 * 60); // 1 hour
}
