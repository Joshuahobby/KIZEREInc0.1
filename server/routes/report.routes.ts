import { Router } from "express";
import { storage } from "../storage";
import { insertReportSchema } from "@shared/schema";
import { z } from "zod";
import { createLogger } from "../utils/logger";
import { ReportMatchingService } from "../services/report-matching.service";
import { sendReportConfirmationEmail } from "../services/email.service";
import { reportSubmissionLimiter } from "../middleware/claim-rate-limit.middleware";
import { renewReport } from "../services/report-expiration.service";

const logger = createLogger('ReportRoutes');
const router = Router();

/**
 * GET /api/reports
 * Fetch reports with filters
 * Phase 1.5: Hide contact info for non-owners until claim verified
 */
router.get("/", async (req, res) => {
  try {
    const { type, search, status, category, dateFilter, page, limit } = req.query;
    const userId = req.user!.id;

    // If it's a general search (type or search provided) or a specific filter
    // Admin/Moderator might see all, but for now we filter by user unless it's a "hub" view
    // The Hub (lost-found) usually passes type or search.

    const result = await storage.getReportsWithFilters({
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 50,
      type: type as string,
      search: search as string,
      status: status as string,
      category: category as string,
      dateFilter: dateFilter as string,
      userId: (type || search) ? undefined : userId // Only filter by user if not searching the hub
    });

    // Phase 1.5: Sanitize contact info for non-owners
    const sanitizedReports = result.reports.map(report => {
      // Show full contact info only to:
      // 1. Report owner
      // 2. Admin/Moderator
      // 3. Users with verified claims on the report
      const isOwner = report.userId === userId;
      const isAdmin = ['Admin', 'Moderator'].includes(req.user!.role);

      if (!isOwner && !isAdmin) {
        return {
          ...report,
          contactInfo: report.contactInfo ? '[Contact info hidden - submit a claim to reveal]' : null
        };
      }
      return report;
    });

    res.json(sanitizedReports);
  } catch (error) {
    console.error("DEBUG: /api/reports error:", error);
    logger.error('Failed to fetch reports', { error: error });
    res.status(500).json({ message: "Failed to fetch reports", detail: (error as Error).message });
  }
});

/**
 * POST /api/reports
 * Create a new lost/found report
 * Phase 1.4: Add rate limiting
 * Phase 2: Trigger enhanced matching
 */
router.post("/", reportSubmissionLimiter, async (req, res) => {
  try {
    const validatedData = insertReportSchema.parse({
      ...req.body,
      userId: req.user!.id
    });

    // Enforce image upload limits based on user tier
    const { getUploadLimit } = await import("../config/payment.config");
    const limit = getUploadLimit(req.user);
    if (validatedData.imageUrls && validatedData.imageUrls.length > limit) {
      return res.status(400).json({
        message: `Image upload limit exceeded. Your current limit is ${limit} images.`
      });
    }

    // Validate date is not in the future
    if (validatedData.date && validatedData.date > new Date()) {
      return res.status(400).json({
        message: "Report date cannot be in the future"
      });
    }

    // Set expiration date based on package (default 30 days)
    const expirationDays = 30; // TODO: Get from payment package
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);

    // Logic for reporting a registered item
    let paymentStatus = 'pending';
    let itemToUpdate = null;

    if (validatedData.itemId) {
      const item = await storage.getItem(validatedData.itemId);
      if (item) {
        // Verify ownership
        if (item.userId !== req.user!.id) {
          return res.status(403).json({ message: "You can only report your own items" });
        }
        // Verify item status
        if (item.status !== 'Registered') {
          return res.status(400).json({ message: "Item must be 'Registered' to be reported as lost" });
        }

        // Since it's a registered item, report is free (covered by registration)
        paymentStatus = 'successful';
        itemToUpdate = item;
      }
    }

    const newReport = await storage.createReport({
      ...validatedData,
      paymentStatus,
      expirationDate
    });

    // If we reported a registered item, update its status to Lost
    if (itemToUpdate) {
      await storage.updateItem(itemToUpdate.id, { status: 'Lost' });
    }


    logger.info('New report created', {
      reportId: newReport.id,
      type: newReport.type,
      userId: req.user!.id,
      receiptNumber: newReport.receiptNumber
    });

    // Log the activity
    await storage.createUserActivityLog({
      userId: req.user!.id,
      action: 'report_filed',
      details: {
        reportId: newReport.id,
        type: newReport.type,
        title: newReport.title,
        receiptNumber: newReport.receiptNumber
      },
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    // Explicitly run matching in the background
    try {
      ReportMatchingService.findMatches(newReport).catch(err => {
        logger.error('Background matching failed for report', { reportId: newReport.id, error: err.message });
      });
    } catch (matchError) {
      logger.error('Failed to initiate matching', { error: matchError });
    }

    // Send confirmation email
    const user = await storage.getUser(validatedData.userId);
    if (user?.email && newReport.receiptNumber) {
      sendReportConfirmationEmail(
        user.email,
        user.fullName || user.username,
        newReport.type as 'lost' | 'found',
        newReport.title,
        newReport.receiptNumber
      ).catch(err => logger.error('Failed to send report confirmation email', { error: err }));
    }

    res.status(201).json(newReport);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    logger.error('Failed to create report', { error });
    res.status(500).json({ message: "Failed to create report" });
  }
});

/**
 * GET /api/reports/matches/:id
 * Get potential matches for a report
 */
router.get("/matches/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    // Check if user owns the report or is admin
    const report = await storage.getReport(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const isOwner = report.userId === req.user!.id;
    const isAdmin = ['Admin', 'Moderator'].includes(req.user!.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const matches = await storage.findPotentialMatches(id);

    // Sanitize contact info in matches
    const sanitizedMatches = matches.map(match => ({
      ...match,
      contactInfo: '[Contact info hidden]'
    }));

    res.json(sanitizedMatches);
  } catch (error) {
    logger.error('Failed to fetch matched reports', { error: error });
    res.status(500).json({ message: "Failed to fetch matches" });
  }
});

/**
 * GET /api/reports/my-reports
 * Get user's own reports
 */
router.get("/my-reports", async (req, res) => {
  try {
    const result = await storage.getReportsWithFilters({
      page: 1,
      limit: 100,
      userId: req.user!.id
    });
    res.json(result.reports);
  } catch (error) {
    logger.error('Failed to fetch user reports', { error });
    res.status(500).json({ message: "Failed to fetch your reports" });
  }
});

/**
 * GET /api/reports/:id
 * Get a single report by ID
 * Phase 1.2: Add authorization check OR make public with sanitization
 * Phase 1.5: Hide contact info until claim verified
 */
router.get("/:id", async (req, res) => {
  try {
    if (req.params.id === 'new') {
      return res.status(400).json({ message: "Invalid report ID: 'new' is a reserved keyword" });
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    const report = await storage.getReport(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const isOwner = report.userId === req.user!.id;
    const isAdmin = ['Admin', 'Moderator'].includes(req.user!.role);

    // Reports are public but contact info is protected
    // Phase 1.5: Check if user has a verified claim to reveal contact info
    let canSeeContactInfo = isOwner || isAdmin;

    if (!canSeeContactInfo && report.type === 'found') {
      const userClaim = await storage.getUserClaimForReport(req.user!.id, report.id);
      if (userClaim && userClaim.status === 'verified') {
        canSeeContactInfo = true;
      }
    }

    // Include finder reputation in the response
    const finder = await storage.getUser(report.userId);

    const sanitizedReport = {
      ...report,
      contactInfo: canSeeContactInfo
        ? report.contactInfo
        : (report.contactInfo ? '[Submit a verified claim to view contact info]' : null),
      finderReputation: finder ? {
        reputationScore: finder.reputationScore,
        itemsReturnedCount: finder.itemsReturnedCount,
        isTrusted: finder.isTrusted
      } : null
    };

    res.json(sanitizedReport);
  } catch (error) {
    logger.error('Failed to fetch report', { error: error });
    res.status(500).json({ message: "Failed to fetch report" });
  }
});

/**
 * PATCH /api/reports/:id
 * Update a report (owner or admin only)
 */
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    const report = await storage.getReport(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Authorization: Only owner or admin can update
    const isOwner = report.userId === req.user!.id;
    const isAdmin = ['Admin', 'Moderator'].includes(req.user!.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Prevent changing certain fields
    const { userId, receiptNumber, reportedAt, ...allowedUpdates } = req.body;

    // Owners can't change status (only admins can)
    if (!isAdmin && 'status' in allowedUpdates) {
      delete allowedUpdates.status;
    }

    const updatedReport = await storage.updateReport(id, allowedUpdates);

    logger.info('Report updated', {
      reportId: id,
      updatedBy: req.user!.id,
      isAdmin
    });

    res.json(updatedReport);
  } catch (error) {
    logger.error('Failed to update report', { error });
    res.status(500).json({ message: "Failed to update report" });
  }
});

/**
 * POST /api/reports/:id/mark-found
 * Mark a lost report as found (resolved)
 */
router.post("/:id/mark-found", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    const report = await storage.getReport(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Authorization: Only owner or admin can mark as found
    const isOwner = report.userId === req.user!.id;
    const isAdmin = ['Admin', 'Moderator'].includes(req.user!.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (report.type !== 'lost') {
      return res.status(400).json({ message: "Only lost reports can be marked as found" });
    }

    // Update report status to Resolved
    const updatedReport = await storage.updateReport(id, { status: 'Resolved' });

    // If report is linked to an item, update item status to Recovered
    if (report.itemId) {
      await storage.updateItem(report.itemId, { status: 'Recovered' });
    }

    // Log the activity
    await storage.createUserActivityLog({
      userId: req.user!.id,
      action: 'report_resolved',
      details: {
        reportId: id,
        title: report.title,
        type: report.type
      },
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    logger.info('Report marked as found', {
      reportId: id,
      userId: req.user!.id,
      itemId: report.itemId
    });

    res.json(updatedReport);
  } catch (error) {
    logger.error('Failed to mark report as found', { error: error });
    res.status(500).json({ message: "Failed to mark report as found" });
  }
});

/**
 * POST /api/reports/:id/renew
 * Renew an expired report
 * Phase 2.2: Reports expire automatically but can be renewed
 */
router.post("/:id/renew", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    const report = await storage.getReport(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Authorization: Only owner or admin can renew
    const isOwner = report.userId === req.user!.id;
    const isAdmin = ['Admin', 'Moderator'].includes(req.user!.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Only expired reports can be renewed
    // And users can only renew for standard duration (30 days)
    const renewedReport = await renewReport(id, 30);

    if (!renewedReport) {
      return res.status(400).json({ message: "Report cannot be renewed (must be Expired)" });
    }

    await storage.createUserActivityLog({
      userId: req.user!.id,
      action: 'report_renewed',
      details: {
        reportId: id,
        title: report.title
      },
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    res.json(renewedReport);
  } catch (error) {
    logger.error('Failed to renew report', { error });
    res.status(500).json({ message: "Failed to renew report" });
  }
});

/**
 * DELETE /api/reports/:id
 * Soft delete (close) a report
 */
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    const report = await storage.getReport(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Authorization: Only owner or admin can delete
    const isOwner = report.userId === req.user!.id;
    const isAdmin = ['Admin', 'Moderator'].includes(req.user!.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Soft delete by setting status to Closed
    await storage.updateReport(id, { status: 'Closed' });

    logger.info('Report closed', {
      reportId: id,
      closedBy: req.user!.id,
      isAdmin
    });

    res.json({ message: "Report closed successfully" });
  } catch (error) {
    logger.error('Failed to close report', { error });
    res.status(500).json({ message: "Failed to close report" });
  }
});

export default router;
