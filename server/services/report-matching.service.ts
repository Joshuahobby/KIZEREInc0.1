import { storage } from "../storage";
import { Report, Notification } from "../../shared/schema";
import { createLogger } from "../utils/logger";
import { sendMatchNotificationEmail, sendFoundNotificationEmail } from "./email.service";
import { emitNotification } from "../websocket";
import { PushService } from "./push.service";

import { OCRService } from "./ocr.service";

const logger = createLogger('ReportMatchingService');

/**
 * Enhanced Report Matching Service
 * Phase 2.1: Improved matching algorithm with location proximity, date proximity, and color matching
 */
export class ReportMatchingService {
  // Match score threshold for notification (0-100)
  private static readonly NOTIFICATION_THRESHOLD = 40;

  // High confidence threshold
  private static readonly HIGH_CONFIDENCE_THRESHOLD = 75;

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

      // Use the public method to get matches
      const matchResults = await this.findPotentialMatches(report);

      // Notify for top 5 matches
      for (const match of matchResults.slice(0, 5)) {
        logger.info('Potential match found', {
          reportId: report.id,
          candidateId: match.candidate.id,
          score: match.score,
          highConfidence: match.score >= this.HIGH_CONFIDENCE_THRESHOLD
        });

        await this.notifyUsers(report, match.candidate, match.score);
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

      logger.info('Match scan complete', {
        reportId: report.id,
        matchesFound: matchResults.length
      });
    } catch (error) {
      logger.error('Error during report matching', { error, reportId: report.id });
    }
  }

  /**
   * Find potential matches for a report and return them with scores
   * Used by both the background worker and the API
   */
  static async findPotentialMatches(report: Report): Promise<{ candidate: Report; score: number }[]> {
    // Only scan for Open reports (or allow if check is done by caller)
    // if (report.status !== 'Open') return [];

    const oppositeType = report.type === 'lost' ? 'found' : 'lost';

    // Get all open reports of the opposite type
    const potentialMatches = await storage.getReportsWithFilters({
      page: 1,
      limit: 100,
      type: oppositeType,
      status: 'Open'
    });

    const matchResults: { candidate: Report; score: number }[] = [];

    for (const candidate of potentialMatches.reports) {
      // Skip own reports
      if (candidate.userId === report.userId) continue;

      const score = this.calculateMatchScore(report, candidate);

      // For API results, we might want to return even lower scores, but keep threshold for now
      if (score >= 20) { // Lowered threshold for manual search visibility
        matchResults.push({ candidate, score });
      }
    }

    // Sort by score descending
    matchResults.sort((a, b) => b.score - a.score);

    return matchResults;
  }

  /**
   * Enhanced match score calculation
   * Phase 2.1: Added location proximity, date proximity, category, and color matching
   */
  private static calculateMatchScore(r1: Report, r2: Report): number {
    let score = 0;

    // 1. CRITICAL: Precise Unique Identifier match (IMEI, Serial, etc.)
    if (r1.uniqueIdentifier && r2.uniqueIdentifier &&
      this.normalizeIdentifier(r1.uniqueIdentifier) === this.normalizeIdentifier(r2.uniqueIdentifier)) {
      score += 100; // Exact match (Plan: 100)
    }

    // 2. HIGH: Precise Item ID match
    if (r1.itemId && r2.itemId && r1.itemId === r2.itemId) {
      score += 100; // Exact match
    }

    // 3. MEDIUM: Same Category
    if (r1.category && r2.category && r1.category === r2.category) {
      score += 20;
    }

    // 4. MEDIUM: Location overlap/proximity
    if (r1.location && r2.location) {
      const locationScore = this.calculateLocationScore(r1.location, r2.location);
      score += locationScore; // Max 25
    }

    // 5. MEDIUM: Date proximity
    if (r1.date && r2.date) {
      const dateScore = this.calculateDateProximityScore(r1.date, r2.date);
      score += dateScore; // Max 15
    }

    // 6. LOW-MEDIUM: Title keyword overlap
    const titleScore = this.calculateKeywordOverlap(r1.title, r2.title);
    score += Math.min(30, titleScore);

    // 7. LOW: Description keyword overlap
    if (r1.description && r2.description) {
      const descScore = this.calculateKeywordOverlap(r1.description, r2.description);
      score += Math.min(10, descScore * 0.5);
    }

    // 8. NEW: OCR Text Matching
    if (r1.ocrText && r2.ocrText) {
      // Direct identifier extraction and comparison
      const ids1 = OCRService.extractIdentifiers(r1.ocrText);
      const ids2 = OCRService.extractIdentifiers(r2.ocrText);

      const hasIdMatch = ids1.idNumbers.some(id => ids2.idNumbers.includes(id)) ||
        ids1.imei.some(i => ids2.imei.includes(i)) ||
        ids1.serialNumbers.some(s => ids2.serialNumbers.includes(s));

      if (hasIdMatch) {
        score += 90; // High confidence if IDs extracted from images match
      } else {
        // Fallback to fuzzy keyword overlap for OCR text
        const ocrOverlapScore = this.calculateKeywordOverlap(r1.ocrText, r2.ocrText);
        score += Math.min(30, ocrOverlapScore * 0.6);
      }
    }

    // Cap score at 100
    return Math.min(100, score);
  }

  /**
   * Normalize identifier for comparison
   */
  private static normalizeIdentifier(identifier: string): string {
    return identifier.trim().toLowerCase().replace(/[\s-]/g, '');
  }

  /**
   * Calculate location-based score
   * Uses simple string matching for now, can be upgraded to geocoding
   */
  private static calculateLocationScore(loc1: string, loc2: string): number {
    const l1 = loc1.toLowerCase().trim();
    const l2 = loc2.toLowerCase().trim();

    // Exact match
    if (l1 === l2) return 25;

    // One contains the other
    if (l1.includes(l2) || l2.includes(l1)) return 20;

    // Extract location tokens and check overlap
    const tokens1 = l1.split(/[\s,]+/).filter(t => t.length > 2);
    const tokens2Set = new Set(l2.split(/[\s,]+/).filter(t => t.length > 2));

    let commonTokens = 0;
    for (const token of tokens1) {
      if (tokens2Set.has(token)) commonTokens++;
    }

    if (commonTokens >= 2) return 15;
    if (commonTokens === 1) return 10;

    // Common Rwanda districts
    const districts = [
      'kigali', 'gasabo', 'kicukiro', 'nyarugenge',
      'huye', 'musanze', 'rubavu', 'rusizi', 'nyagatare',
      'gisenyi', 'butare', 'rwamagana', 'muhanga'
    ];

    for (const district of districts) {
      if (l1.includes(district) && l2.includes(district)) {
        return 15;
      }
    }

    return 0;
  }

  /**
   * Calculate date proximity score
   */
  private static calculateDateProximityScore(date1: Date, date2: Date): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffDays = Math.abs(Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24)));

    if (diffDays <= 1) return 15;   // Same day or next day
    if (diffDays <= 3) return 12;   // Within 3 days
    if (diffDays <= 7) return 10;   // Within a week
    if (diffDays <= 14) return 5;   // Within 2 weeks
    if (diffDays <= 30) return 2;   // Within a month

    return 0;
  }

  /**
   * Calculate keyword overlap between two strings
   */
  private static calculateKeywordOverlap(text1: string, text2: string): number {
    // Common stop words to ignore
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her',
      'its', 'our', 'their', 'this', 'that', 'these', 'those', 'lost', 'found'
    ]);

    const getKeywords = (text: string): Set<string> => {
      return new Set(
        text.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 2 && !stopWords.has(word))
      );
    };

    const words1Array = Array.from(getKeywords(text1));
    const words2Set = getKeywords(text2);

    let commonWords = 0;
    for (const word of words1Array) {
      if (words2Set.has(word)) commonWords++;
    }

    // Score based on number of matching keywords
    return commonWords * 10;
  }

  /**
   * Send notifications to both users
   */
  private static async notifyUsers(report: Report, candidate: Report, score: number): Promise<void> {
    const confidenceLevel = score >= this.HIGH_CONFIDENCE_THRESHOLD ? 'High' : 'Moderate';
    const message = `We found a ${confidenceLevel.toLowerCase()} confidence match (${score}%) for your "${report.type === 'lost' ? 'Lost' : 'Found'}" report: ${report.title}`;
    const relatedMessage = `We found a ${confidenceLevel.toLowerCase()} confidence match for your "${candidate.type === 'lost' ? 'Lost' : 'Found'}" report: ${candidate.title}`;

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
    const n1 = await storage.createNotification({
      userId: report.userId,
      title: `${confidenceLevel} Confidence Match Found!`,
      message: message,
      type: "report_match",
      isRead: false,
      relatedItemId: report.itemId || null,
      relatedReportId: candidate.id
    });

    emitNotification(report.userId, n1);
    await PushService.notifyReportMatch(report.userId, candidate.id, score);

    // Notify the existing report owner
    const n2 = await storage.createNotification({
      userId: candidate.userId,
      title: `New ${confidenceLevel} Confidence Match Found!`,
      message: relatedMessage,
      type: "report_match",
      isRead: false,
      relatedItemId: candidate.itemId || null,
      relatedReportId: report.id
    });

    emitNotification(candidate.userId, n2);
    await PushService.notifyReportMatch(candidate.userId, report.id, score);
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

    const n = await storage.createNotification({
      userId: item.userId,
      title: "Your Item Was Found!",
      message: message,
      type: "report_match",
      isRead: false,
      relatedItemId: item.id,
      relatedReportId: report.id
    });

    emitNotification(item.userId, n);
    await PushService.sendToUser(item.userId, {
      title: "Your Item Was Found!",
      body: message,
      data: {
        type: "report_match",
        reportId: report.id,
        url: `/dashboard/reports/${report.id}`
      }
    });
  }

  /**
   * Re-run matching for all open reports (can be called by admin or cron)
   */
  static async rerunMatchingForAllReports(): Promise<{ processed: number; matches: number }> {
    logger.info('Starting batch matching for all open reports');

    const openReports = await storage.getReportsWithFilters({
      page: 1,
      limit: 500,
      status: 'Open'
    });

    let processed = 0;
    let matchesFound = 0;

    for (const report of openReports.reports) {
      try {
        await this.findMatches(report);
        processed++;
      } catch (err) {
        logger.error('Error processing report in batch matching', { reportId: report.id, error: err });
      }
    }

    logger.info('Batch matching complete', { processed, matchesFound });
    return { processed, matches: matchesFound };
  }
}
