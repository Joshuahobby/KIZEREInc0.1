/**
 * Report Expiration Job
 * Phase 2.2: Automated report expiration and grace period handling
 * 
 * This job should be run daily (e.g., via cron at 2 AM)
 * It handles:
 * 1. Reports reaching expiration date → Start 7-day grace period
 * 2. Reports past grace period → Mark as Expired
 * 3. Sends email notifications at each stage
 */

import { storage } from "../storage";
import { Report } from "../../shared/schema";
import { createLogger } from "../utils/logger";
import { sendExpirationEmail } from "./email.service";

const logger = createLogger('ReportExpirationJob');

interface ExpirationJobResult {
  processed: number;
  gracePeriodStarted: number;
  expired: number;
  errors: number;
}

/**
 * Process expired reports
 * Called by cron or admin action
 */
export async function processExpiredReports(): Promise<ExpirationJobResult> {
  const result: ExpirationJobResult = {
    processed: 0,
    gracePeriodStarted: 0,
    expired: 0,
    errors: 0
  };

  const now = new Date();
  
  logger.info('Starting report expiration job', { timestamp: now.toISOString() });

  try {
    // Get all open reports (we'll filter in memory for now, can be optimized with DB query)
    const allReports = await storage.getReportsWithFilters({
      page: 1,
      limit: 1000,
      status: 'Open'
    });

    const inProgressReports = await storage.getReportsWithFilters({
      page: 1,
      limit: 1000,
      status: 'In_Progress'
    });

    const reportsToProcess = [...allReports.reports, ...inProgressReports.reports];

    for (const report of reportsToProcess) {
      result.processed++;

      try {
        // Check if report has expiration date
        if (!report.expirationDate) {
          // Set default expiration if missing (30 days from creation)
          const defaultExpiration = new Date(report.reportedAt);
          defaultExpiration.setDate(defaultExpiration.getDate() + 30);
          
          await storage.updateReport(report.id, { expirationDate: defaultExpiration });
          continue;
        }

        const expirationDate = new Date(report.expirationDate);
        const gracePeriodEnd = report.gracePeriodEnd ? new Date(report.gracePeriodEnd) : null;

        // Case 1: Report is past expiration but not in grace period yet
        if (expirationDate <= now && !gracePeriodEnd) {
          await startGracePeriod(report);
          result.gracePeriodStarted++;
          continue;
        }

        // Case 2: Report is past grace period → expire it
        if (gracePeriodEnd && gracePeriodEnd <= now) {
          await expireReport(report);
          result.expired++;
          continue;
        }

        // Case 3: Send reminder if grace period is ending soon (2 days left)
        if (gracePeriodEnd) {
          const daysLeft = Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft === 2) {
            await sendGracePeriodReminder(report, daysLeft);
          }
        }

      } catch (err) {
        logger.error('Error processing report expiration', { reportId: report.id, error: err });
        result.errors++;
      }
    }

    logger.info('Report expiration job complete', result);
    return result;

  } catch (error) {
    logger.error('Report expiration job failed', { error });
    throw error;
  }
}

/**
 * Start grace period for a report
 */
async function startGracePeriod(report: Report): Promise<void> {
  const gracePeriodDays = 7;
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);

  await storage.updateReport(report.id, {
    gracePeriodEnd,
    status: 'In_Progress' // Mark as in-progress during grace period
  });

  // Notify user
  const user = await storage.getUser(report.userId);
  if (user) {
    await storage.createNotification({
      userId: user.id,
      title: "Report Expiring Soon",
      message: `Your ${report.type} report "${report.title}" has entered a 7-day grace period. Renew it to keep it active.`,
      type: "expiration_warning",
      isRead: false,
      relatedReportId: report.id
    });

    // Send email
    if (user.email) {
      const renewalLink = `${process.env.APP_URL || 'https://kizere.com'}/reports/${report.id}/renew`;
      await sendExpirationEmail(
        user.email,
        user.fullName || user.username,
        report.title,
        report.id,
        renewalLink
      ).catch(err => logger.error('Failed to send expiration email', { error: err }));
    }
  }

  logger.info('Grace period started for report', { reportId: report.id, gracePeriodEnd: gracePeriodEnd.toISOString() });
}

/**
 * Expire a report
 */
async function expireReport(report: Report): Promise<void> {
  await storage.updateReport(report.id, {
    status: 'Expired'
  });

  // Notify user
  const user = await storage.getUser(report.userId);
  if (user) {
    await storage.createNotification({
      userId: user.id,
      title: "Report Expired",
      message: `Your ${report.type} report "${report.title}" has expired. You can create a new report if the item is still ${report.type}.`,
      type: "report_expired",
      isRead: false,
      relatedReportId: report.id
    });
  }

  logger.info('Report expired', { reportId: report.id });
}

/**
 * Send grace period reminder
 */
async function sendGracePeriodReminder(report: Report, daysLeft: number): Promise<void> {
  const user = await storage.getUser(report.userId);
  if (user) {
    await storage.createNotification({
      userId: user.id,
      title: `${daysLeft} Days Left to Renew`,
      message: `Your ${report.type} report "${report.title}" will expire in ${daysLeft} days. Renew now to keep it active.`,
      type: "expiration_warning",
      isRead: false,
      relatedReportId: report.id
    });
  }
}

/**
 * Renew a report (called from API)
 */
export async function renewReport(reportId: number, extensionDays: number = 30): Promise<Report | null> {
  const report = await storage.getReport(reportId);
  if (!report) return null;

  // Can only renew reports in grace period or expired (within 30 days)
  if (!['In_Progress', 'Expired'].includes(report.status)) {
    // If it's already open, just extend the expiration
    if (report.status !== 'Open') {
      throw new Error('Cannot renew a report with status: ' + report.status);
    }
  }

  const newExpiration = new Date();
  newExpiration.setDate(newExpiration.getDate() + extensionDays);

  const updatedReport = await storage.updateReport(reportId, {
    expirationDate: newExpiration,
    gracePeriodEnd: null, // Clear grace period
    status: 'Open'
  });

  logger.info('Report renewed', { reportId, newExpiration: newExpiration.toISOString() });

  // Notify user
  const user = await storage.getUser(report.userId);
  if (user) {
    await storage.createNotification({
      userId: user.id,
      title: "Report Renewed Successfully",
      message: `Your ${report.type} report "${report.title}" has been renewed for ${extensionDays} days.`,
      type: "report_renewed",
      isRead: false,
      relatedReportId: report.id
    });
  }

  return updatedReport || null;
}

/**
 * Get reports expiring soon (for dashboard warnings)
 */
export async function getExpiringReports(userId: number, daysThreshold: number = 7): Promise<Report[]> {
  const allReports = await storage.getReportsWithFilters({
    page: 1,
    limit: 100,
    userId,
    status: 'Open'
  });

  const now = new Date();
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysThreshold);

  return allReports.reports.filter(report => {
    if (!report.expirationDate) return false;
    const expDate = new Date(report.expirationDate);
    return expDate <= threshold && expDate > now;
  });
}

export default {
  processExpiredReports,
  renewReport,
  getExpiringReports
};
