import { storage } from "../storage";
import { Report, Notification } from "../../shared/schema";
import { createLogger } from "../utils/logger";
import { sendMatchNotificationEmail, sendFoundNotificationEmail } from "./email.service";

const logger = createLogger('ReportMatchingService');

export class ReportMatchingService {
  /**
   * Scan for potential matches for a given report
   * @param report the newly created report
   */
  static async findMatches(report: Report): Promise<void> {
    try {
      logger.info('Starting match scan for report', { reportId: report.id, type: report.type });

      // Only scan for Open reports
      if (report.status !== 'Open') return;

      const oppositeType = report.type === 'lost' ? 'found' : 'lost';
      
      // Get all open reports of the opposite type
      const potentialMatches = await storage.getReportsWithFilters({
        page: 1,
        limit: 100,
        type: oppositeType,
        status: 'Open'
      });

      for (const candidate of potentialMatches.reports) {
        // Skip own reports
        if (candidate.userId === report.userId) continue;

        const score = this.calculateMatchScore(report, candidate);
        
        if (score >= 40) { // Threshold for notification
          logger.info('Potential match found', { 
            reportId: report.id, 
            candidateId: candidate.id, 
            score 
          });

          await this.notifyUsers(report, candidate, score);
        }
      }

      // If it's a FOUND report, also check against registered items (Passive Protection)
      if (report.type === 'found' && report.uniqueIdentifier) {
        const matchingItem = await storage.getItemByUniqueIdentifier(report.uniqueIdentifier);
        if (matchingItem && matchingItem.userId !== report.userId) {
          logger.info('Found report matches a registered item', { 
            reportId: report.id, 
            itemId: matchingItem.id,
            ownerId: matchingItem.userId
          });

          await this.notifyItemOwner(report, matchingItem);
        }
      }
    } catch (error) {
      logger.error('Error during report matching', { error, reportId: report.id });
    }
  }

  private static calculateMatchScore(r1: Report, r2: Report): number {
    let score = 0;

    // 1. Precise Unique Identifier match (Critical)
    // If both have unique identifiers and they match exactly, it's a near-certain match
    if (r1.uniqueIdentifier && r2.uniqueIdentifier && 
        r1.uniqueIdentifier.trim().toLowerCase() === r2.uniqueIdentifier.trim().toLowerCase()) {
      score += 95;
    }

    // 2. Precise Item ID match (High weight)
    if (r1.itemId && r2.itemId && r1.itemId === r2.itemId) {
      score += 90;
    }

    // 3. Title keyword overlap
    const words1 = new Set(r1.title.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(r2.title.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const commonWords = Array.from(words1).filter(w => words2.has(w));
    
    if (commonWords.length > 0) {
      score += Math.min(40, commonWords.length * 15);
    }

    // 4. Location overlap
    if (r1.location && r2.location) {
      const loc1 = r1.location.toLowerCase();
      const loc2 = r2.location.toLowerCase();
      if (loc1.includes(loc2) || loc2.includes(loc1)) {
        score += 30;
      }
    }

    // Cap score at 100
    return Math.min(100, score);
  }

  /**
   * Send notifications to both users
   */
  private static async notifyUsers(report: Report, candidate: Report, score: number): Promise<void> {
    const message = `We found a potential match (${score}%) for your "${report.type === 'lost' ? 'Lost' : 'Found'}" report: ${report.title}`;
    const relatedMessage = `We found a potential match for your "${candidate.type === 'lost' ? 'Lost' : 'Found'}" report: ${candidate.title}`;

    // Get user details for emails
    const reportOwner = await storage.getUser(report.userId);
    const candidateOwner = await storage.getUser(candidate.userId);

    if (reportOwner && reportOwner.email) {
      await sendMatchNotificationEmail(
        reportOwner.email, 
        reportOwner.fullName, 
        report.title, 
        candidate.title, 
        candidate.id
      ).catch(err => logger.error('Failed to send match email', { error: err }));
    }

    if (candidateOwner && candidateOwner.email) {
      await sendMatchNotificationEmail(
        candidateOwner.email, 
        candidateOwner.fullName, 
        candidate.title, 
        report.title, 
        report.id
      ).catch(err => logger.error('Failed to send match email', { error: err }));
    }

    // Notify the user who just created the report
    await storage.createNotification({
      userId: report.userId,
      title: "Potential Match Found!",
      message: message,
      type: "report_match",
      isRead: false,
      relatedItemId: report.itemId || null,
      relatedReportId: candidate.id
    });

    // Notify the existing report owner
    await storage.createNotification({
      userId: candidate.userId,
      title: "New Potential Match Found!",
      message: relatedMessage,
      type: "report_match",
      isRead: false,
      relatedItemId: candidate.itemId || null,
      relatedReportId: report.id
    });
  }

  /**
   * Notify an item owner that their registered item was reported as found
   */
  private static async notifyItemOwner(report: Report, item: any): Promise<void> {
    const message = `Good news! Your registered item "${item.name}" was reported as FOUND by another user.`;
    
    const owner = await storage.getUser(item.userId);
    if (owner && owner.email) {
      await sendFoundNotificationEmail(
        owner.email, 
        owner.fullName, 
        item.name, 
        report.title, 
        report.id
      ).catch(err => logger.error('Failed to send found notification email', { error: err }));
    }

    await storage.createNotification({
      userId: item.userId,
      title: "Your Item Was Found!",
      message: message,
      type: "report_match",
      isRead: false,
      relatedItemId: item.id,
      relatedReportId: report.id
    });
  }
}
