import { storage } from "../storage";
import { Report, Notification } from "../../shared/schema";
import { createLogger } from "../utils/logger";

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
    } catch (error) {
      logger.error('Error during report matching', { error, reportId: report.id });
    }
  }

  /**
   * Basic scoring logic based on title, description and location
   */
  private static calculateMatchScore(r1: Report, r2: Report): number {
    let score = 0;

    // 1. Precise Item ID match (highest weight)
    if (r1.itemId && r2.itemId && r1.itemId === r2.itemId) {
      score += 90;
    }

    // 2. Title keyword overlap
    const words1 = new Set(r1.title.toLowerCase().split(/\s+/));
    const words2 = new Set(r2.title.toLowerCase().split(/\s+/));
    const commonWords = Array.from(words1).filter(w => words2.has(w) && w.length > 3);
    
    if (commonWords.length > 0) {
      score += Math.min(40, commonWords.length * 15);
    }

    // 3. Location overlap
    if (r1.location && r2.location) {
      const loc1 = r1.location.toLowerCase();
      const loc2 = r2.location.toLowerCase();
      if (loc1.includes(loc2) || loc2.includes(loc1)) {
        score += 30;
      }
    }

    return score;
  }

  /**
   * Send notifications to both users
   */
  private static async notifyUsers(report: Report, candidate: Report, score: number): Promise<void> {
    const message = `We found a potential match (${score}%) for your "${report.type === 'lost' ? 'Lost' : 'Found'}" report: ${report.title}`;
    const relatedMessage = `We found a potential match for your "${candidate.type === 'lost' ? 'Lost' : 'Found'}" report: ${candidate.title}`;

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
}
