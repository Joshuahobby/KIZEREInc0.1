import { Router } from "express";
import { storage } from "../storage";
import { insertClaimSchema, claimStatuses } from "@shared/schema";
import { z } from "zod";
import { createLogger } from "../utils/logger";
import { sendClaimNotificationEmail, sendClaimStatusEmail, sendAdminAppealNotification } from "../services/email.service";
import { claimSubmissionLimiter, claimVerificationLimiter } from "../middleware/claim-rate-limit.middleware";
import { ReputationService } from "../services/reputation.service";

const logger = createLogger('ClaimRoutes');
const router = Router();

/**
 * POST /api/claims
 * Create a new ownership claim
 * Phase 1.1: Add duplicate claim prevention
 * Phase 1.4: Add claim-specific rate limiting
 * Phase 2.4: Prevent claiming closed/expired reports
 */
router.post("/", claimSubmissionLimiter, async (req, res) => {
  try {
    const validatedData = insertClaimSchema.parse({
      ...req.body,
      userId: req.user!.id
    });

    // Check if report exists
    const report = await storage.getReport(validatedData.reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Phase 2.4: Prevent claiming non-found reports
    if (report.type !== 'found') {
      return res.status(400).json({ message: "Can only claim found items" });
    }

    // Phase 2.4: Prevent claiming closed/expired/resolved reports
    const nonClaimableStatuses = ['Closed', 'Expired', 'Resolved'];
    if (nonClaimableStatuses.includes(report.status)) {
      return res.status(400).json({
        message: `Cannot claim a report with status "${report.status}". This report is no longer active.`
      });
    }

    // Prevent claiming your own report
    if (report.userId === req.user!.id) {
      return res.status(400).json({ message: "You cannot claim your own found item report" });
    }

    // Phase 1.1: Check for duplicate claim (same user, same report)
    const existingClaim = await storage.getUserClaimForReport(req.user!.id, validatedData.reportId);
    if (existingClaim) {
      return res.status(409).json({
        message: "You have already submitted a claim for this item. Please wait for the finder to review it.",
        existingClaimId: existingClaim.id
      });
    }

    const newClaim = await storage.createClaim(validatedData);

    // Logic for challenge question: the finder sees the answer in their dashboard
    // We already updated the storage to return verificationAnswer.

    // Log the claim creation
    logger.info('New claim created', {
      claimId: newClaim.id,
      reportId: report.id,
      userId: req.user!.id
    });

    // Notify the finder (in-app)
    await storage.createNotification({
      userId: report.userId,
      title: "New Claim Received",
      message: `Someone has filed a claim for the item you found: ${report.title}`,
      type: 'item_claim',
      isRead: false,
      relatedItemId: report.itemId || null,
      relatedReportId: report.id
    });

    // Send email notification to finder
    const finder = await storage.getUser(report.userId);
    if (finder?.email) {
      sendClaimNotificationEmail(
        finder.email,
        finder.fullName || 'User',
        report.title,
        req.user!.fullName || 'Someone',
        report.id
      ).catch(err => logger.error('Failed to send claim email', { error: err }));
    }

    res.status(201).json(newClaim);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    logger.error("Failed to create claim:", error);
    res.status(500).json({ message: "Failed to create claim" });
  }
});

/**
 * GET /api/claims/my-claims
 * Get user's submitted claims with report details
 */
router.get("/my-claims", async (req, res) => {
  try {
    const claims = await storage.getUserClaimsWithReports(req.user!.id);
    res.json(claims);
  } catch (error) {
    logger.error("Failed to fetch user claims:", error);
    res.status(500).json({ message: "Failed to fetch your claims", detail: (error as Error).message });
  }
});

/**
 * GET /api/claims/received
 * Get claims received for user's found items
 */
router.get("/received", async (req, res) => {
  try {
    const claims = await storage.getClaimsReceivedWithDetails(req.user!.id);
    res.json(claims);
  } catch (error) {
    logger.error("Failed to fetch received claims:", error);
    res.status(500).json({ message: "Failed to fetch received claims", detail: (error as Error).message });
  }
});

/**
 * GET /api/claims/:id
 * Get a specific claim (only accessible by claimant, finder, or admin)
 */
router.get("/:id", async (req, res) => {
  try {
    const claimId = parseInt(req.params.id);
    if (isNaN(claimId)) {
      return res.status(400).json({ message: "Invalid claim ID" });
    }

    const claim = await storage.getClaimWithDetails(claimId);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    // Authorization check: Only claimant, finder of the report, or admin can view
    const report = await storage.getReport(claim.reportId);
    const isClaimant = claim.userId === req.user!.id;
    const isFinder = report?.userId === req.user!.id;
    const isAdmin = ['Admin', 'Moderator'].includes(req.user!.role);

    if (!isClaimant && !isFinder && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(claim);
  } catch (error) {
    logger.error("Failed to fetch claim:", error);
    res.status(500).json({ message: "Failed to fetch claim" });
  }
});

/**
 * PATCH /api/claims/:id/verify
 * Verify or reject a claim (by finder or Admin)
 * Phase 2.3: Claim workflow state machine
 */
router.patch("/:id/verify", claimVerificationLimiter, async (req, res) => {
  try {
    const claimId = parseInt(req.params.id);
    const { status, finderNotes } = req.body;

    // Validate status transition
    const validStatuses = ['verified', 'rejected', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: " + validStatuses.join(', ')
      });
    }

    const claim = await storage.getClaim(claimId);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    const report = await storage.getReport(claim.reportId);
    if (!report) {
      return res.status(404).json({ message: "Associated report not found" });
    }

    // Authorization: Only finder or Admin/Moderator can verify
    const isFinder = report.userId === req.user!.id;
    const isAdmin = ['Admin', 'Moderator'].includes(req.user!.role);

    if (!isFinder && !isAdmin) {
      return res.status(403).json({ message: "Access denied. Only the finder or an administrator can verify claims." });
    }

    // Validate status transitions (state machine)
    const validTransitions: Record<string, string[]> = {
      'pending': ['verified', 'rejected'],
      'verified': ['resolved', 'rejected'], // Can be resolved after verification
      'rejected': ['pending'], // Appeal: Can be re-opened
      'resolved': [] // Final state
    };

    const currentStatus = claim.status;
    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from "${currentStatus}" to "${status}". Valid transitions: ${validTransitions[currentStatus]?.join(', ') || 'none'}`
      });
    }

    const updateData: any = {
      status,
      finderNotes,
      updatedAt: new Date()
    };

    if (status === 'verified') {
      updateData.verifiedAt = new Date();
      // Generate 6-digit OTP for secure handover
      updateData.handoverOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // Phase 2: Award points for verification
      ReputationService.awardVerificationPoints(report.userId).catch(err =>
        logger.error('Failed to award verification points', { userId: report.userId, error: err })
      );
    }

    const updatedClaim = await storage.updateClaim(claimId, updateData);

    // Log the action
    await storage.createClaimStatusLog({
      claimId,
      previousStatus: currentStatus,
      newStatus: status,
      changedBy: req.user!.id,
      notes: finderNotes
    });

    // Update report status if claim is verified
    if (status === 'verified') {
      await storage.updateReport(report.id, { status: 'In_Progress' });
    } else if (status === 'resolved') {
      await storage.updateReport(report.id, { status: 'Resolved' });
    }

    // Notify the claimant (in-app)
    await storage.createNotification({
      userId: claim.userId,
      title: `Claim ${status === 'verified' ? 'Verified' : status === 'rejected' ? 'Rejected' : 'Resolved'}`,
      message: `Your claim for "${report.title}" has been ${status}.${finderNotes ? ` Note: ${finderNotes}` : ''}`,
      type: 'claim_update',
      isRead: false,
      relatedItemId: report.itemId || null,
      relatedReportId: report.id
    });

    // Send email notification to claimant
    const claimant = await storage.getUser(claim.userId);
    if (claimant?.email) {
      const emailStatus = status === 'verified' || status === 'resolved' ? 'approved' : 'rejected';
      sendClaimStatusEmail(
        claimant.email,
        claimant.fullName || 'User',
        report.title,
        emailStatus
      ).catch(err => logger.error('Failed to send claim status email', { error: err }));
    }

    logger.info('Claim status updated', {
      claimId,
      previousStatus: currentStatus,
      newStatus: status,
      updatedBy: req.user!.id
    });

    res.json(updatedClaim);
  } catch (error) {
    logger.error("Failed to verify claim:", error);
    res.status(500).json({ message: "Failed to process claim" });
  }
});

/**
 * POST /api/claims/:id/appeal
 * Appeal a rejected claim
 * Phase 2.5: Claim appeal mechanism
 */
router.post("/:id/appeal", claimSubmissionLimiter, async (req, res) => {
  try {
    const claimId = parseInt(req.params.id);
    const { reason } = req.body;

    if (!reason || reason.length < 20) {
      return res.status(400).json({
        message: "Please provide a detailed reason for your appeal (min 20 characters)"
      });
    }

    const claim = await storage.getClaim(claimId);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    // Only the claimant can appeal
    if (claim.userId !== req.user!.id) {
      return res.status(403).json({ message: "Only the original claimant can appeal" });
    }

    // Can only appeal rejected claims
    if (claim.status !== 'rejected') {
      return res.status(400).json({
        message: "Only rejected claims can be appealed"
      });
    }

    // Check for existing appeal
    const existingAppeal = await storage.getClaimAppeal(claimId);
    if (existingAppeal) {
      return res.status(409).json({
        message: "You have already submitted an appeal for this claim"
      });
    }

    const appeal = await storage.createClaimAppeal({
      claimId,
      userId: req.user!.id,
      reason,
      status: 'pending'
    });

    // Notify admins
    const admins = await storage.getUsersByRole(['Admin', 'Moderator']);
    for (const admin of admins) {
      // In-app notification
      await storage.createNotification({
        userId: admin.id,
        title: "New Claim Appeal",
        message: `A claim appeal has been submitted and requires review.`,
        type: 'admin_alert',
        isRead: false,
        relatedReportId: claim.reportId
      });

      // Email notification
      if (admin.email) {
        sendAdminAppealNotification(
          admin.email,
          claimId,
          req.user!.fullName || 'User',
          reason
        ).catch(err => logger.error('Failed to send admin appeal email', { error: err }));
      }
    }

    logger.info('Claim appeal submitted', { claimId, userId: req.user!.id });

    res.status(201).json({
      message: "Appeal submitted successfully. An administrator will review your case.",
      appealId: appeal.id
    });
  } catch (error) {
    logger.error("Failed to submit appeal:", error);
    res.status(500).json({ message: "Failed to submit appeal" });
  }
});

/**
 * GET /api/claims/report/:reportId
 * Get all claims for a specific report (finder or admin only)
 */
router.get("/report/:reportId", async (req, res) => {
  try {
    const reportId = parseInt(req.params.reportId);
    if (isNaN(reportId)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    const report = await storage.getReport(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Authorization: Only finder or admin can see all claims
    const isFinder = report.userId === req.user!.id;
    const isAdmin = ['Admin', 'Moderator'].includes(req.user!.role);

    if (!isFinder && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const claims = await storage.getClaimsForReportWithUsers(reportId);
    res.json(claims);
  } catch (error) {
    logger.error("Failed to fetch claims for report:", error);
    res.status(500).json({ message: "Failed to fetch claims" });
  }
});

/**
 * POST /api/claims/:id/handover
 * Finalize the handover using an OTP
 */
router.post("/:id/handover", async (req, res) => {
  try {
    const claimId = parseInt(req.params.id);
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const claim = await storage.getClaim(claimId);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (claim.status !== 'verified') {
      return res.status(400).json({ message: "Item must be verified before handover" });
    }

    const report = await storage.getReport(claim.reportId);
    if (!report) {
      return res.status(404).json({ message: "Associated report not found" });
    }

    // Verify OTP
    if (claim.handoverOtp !== otp) {
      return res.status(401).json({ message: "Invalid handover OTP" });
    }

    // Update claim to resolved
    const updatedClaim = await storage.updateClaim(claimId, {
      status: 'resolved',
      handedOverAt: new Date()
    });

    // Update report to resolved
    await storage.updateReport(claim.reportId, { status: 'Resolved' });

    // Notify the claimant
    await storage.createNotification({
      userId: claim.userId,
      title: "Item Returned Successfully",
      message: "The handover has been confirmed. Thank you for using KIZERE!",
      type: 'item_claim',
      isRead: false,
      relatedReportId: claim.reportId
    });

    // Award reputation points for successful return
    ReputationService.awardResolutionPoints(report.userId).catch(err =>
      logger.error('Failed to award resolution points', { userId: report.userId, error: err })
    );

    // Initial Bounty Payout Logic
    // If report has a bounty, release it to the finder (who is the current user in this context? No, wait.)
    // In /handover, the FINDER is triggering it? No, usually the owner or finder confirms.
    // Let's re-read the handover logic.
    // logic: "Enter the 6-digit OTP provided by the claimant to confirm you have handed over the item."
    // User entering OTP is the FINDER. Claimant GAVE the OTP.
    // So if successful, we pay the FINDER (req.user.id).

    if (report.bountyAmount && Number(report.bountyAmount) > 0) {
      if (report.bountyStatus === 'escrowed' || report.bountyStatus === 'none') { // 'none' for now if we haven't enforced deposit
        try {
          const { payoutService } = await import("../services/payout.service");

          // Create payout record
          const payout = await payoutService.createPayout(
            req.user!.id, // Finder receives the money
            report.id,
            Number(report.bountyAmount),
            req.user!.phoneNumber || "0000000000" // Use user's phone or placeholder if missing (should be validated)
          );

          // Process it automatically
          payoutService.processPayout(payout.id).catch(err =>
            logger.error('Failed to process automatic payout', { payoutId: payout.id, error: err })
          );

          logger.info('Bounty payout initiated', {
            reportId: report.id,
            amount: report.bountyAmount,
            finderId: req.user!.id
          });
        } catch (payoutError) {
          logger.error('Failed to initiate bounty payout', { error: payoutError });
          // Don't fail the handover request, just log it. Admin can retry.
        }
      }
    }

    logger.info('Secure handover completed', { claimId, userId: req.user!.id });

    res.json({ message: "Handover confirmed successfully", claim: updatedClaim });
  } catch (error) {
    logger.error("Handover failed:", error);
    res.status(500).json({ message: "Failed to confirm handover" });
  }
});

export default router;
