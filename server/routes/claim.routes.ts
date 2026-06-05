import { Router } from "express";
import crypto from "crypto";
import { storage } from "../storage";
import { insertClaimSchema, claimStatuses } from "@shared/schema";
import { z } from "zod";
import { createLogger } from "../utils/logger";
import { sendClaimNotificationEmail, sendClaimStatusEmail, sendAdminAppealNotification } from "../services/email.service";
import { claimSubmissionLimiter, claimVerificationLimiter } from "../middleware/claim-rate-limit.middleware";
import { ReputationService } from "../services/reputation.service";
import { PlatformSettingsService, PLATFORM_SETTING_KEYS } from "../services/platform-settings.service";

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
    const validatedData = insertClaimSchema.parse(req.body);

    // Check user verification status if they are a Subscriber
    const user = await storage.getUser(req.user!.id);
    if (user?.role === 'Subscriber' && user.verificationStatus !== 'approved') {
      return res.status(403).json({ 
        message: "Identity verification is required to file a claim. Please complete your identity verification in your profile settings." 
      });
    }

    const claimData = {
      ...validatedData,
      userId: req.user!.id,
      status: 'pending'
    };

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

    const newClaim = await storage.createClaim(claimData);

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
    const validStatuses = ['verified', 'rejected', 'resolved', 'needs_info'];
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
      'pending': ['verified', 'rejected', 'needs_info', 'withdrawn'],
      'needs_info': ['pending', 'verified', 'rejected', 'withdrawn'],
      'verified': ['resolved', 'rejected'], // Can be resolved after verification
      'rejected': ['pending'], // Appeal: Can be re-opened
      'resolved': [], // Final state
      'withdrawn': []
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
      updateData.handoverOtp = crypto.randomInt(100000, 1000000).toString();

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
    if (claim.appealStatus) {
      return res.status(409).json({
        message: "You have already submitted an appeal for this claim"
      });
    }

    const updatedClaim = await storage.updateClaim(claimId, {
      appealStatus: 'pending',
      appealReason: reason,
      status: 'pending' // Re-open the claim temporarily while appealing
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
      claim: updatedClaim
    });
  } catch (error) {
    logger.error("Failed to submit appeal:", error);
    res.status(500).json({ message: "Failed to submit appeal" });
  }
});

/**
 * POST /api/claims/:id/withdraw
 * Allows a claimant to withdraw their pending claim
 */
router.post("/:id/withdraw", claimSubmissionLimiter, async (req, res) => {
  try {
    const claimId = parseInt(req.params.id);
    const claim = await storage.getClaim(claimId);

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (claim.userId !== req.user!.id) {
      return res.status(403).json({ message: "Only the original claimant can withdraw this claim" });
    }

    const withdrawableStatuses = ['pending', 'needs_info'];
    if (!withdrawableStatuses.includes(claim.status)) {
      return res.status(400).json({ message: `Cannot withdraw a claim that is currently "${claim.status}"` });
    }

    const updatedClaim = await storage.updateClaim(claimId, {
      status: 'withdrawn',
      updatedAt: new Date()
    });

    await storage.createClaimStatusLog({
      claimId,
      previousStatus: claim.status,
      newStatus: 'withdrawn',
      changedBy: req.user!.id,
      notes: "Claimant withdrew the claim"
    });

    // Notify the finder that claim was withdrawn
    const report = await storage.getReport(claim.reportId);
    if (report) {
       await storage.createNotification({
         userId: report.userId,
         title: "Claim Withdrawn",
         message: `The claim filed for "${report.title}" has been withdrawn by the claimant.`,
         type: 'claim_update',
         isRead: false,
         relatedReportId: report.id
       });
    }

    res.json({ message: "Claim withdrawn successfully", claim: updatedClaim });
  } catch (error) {
    logger.error("Failed to withdraw claim:", error);
    res.status(500).json({ message: "Failed to withdraw claim" });
  }
});

/**
 * PATCH /api/claims/:id/request-info
 * Allows a claimant to append more info/images if the finder requested more info
 */
router.patch("/:id/request-info", claimSubmissionLimiter, async (req, res) => {
  try {
    const claimId = parseInt(req.params.id);
    const { additionalDescription, additionalImageUrls } = req.body;

    const claim = await storage.getClaim(claimId);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (claim.userId !== req.user!.id) {
      return res.status(403).json({ message: "Only the claimant can update this info" });
    }

    if (claim.status !== 'needs_info') {
      return res.status(400).json({ message: "Can only update if status is 'needs_info'" });
    }

    let newDesc = claim.description;
    if (additionalDescription) {
      newDesc += `\n\n--- Additional Info ---\n${additionalDescription}`;
    }

    let newImages = claim.imageUrls || [];
    if (additionalImageUrls && Array.isArray(additionalImageUrls)) {
      newImages = [...newImages, ...additionalImageUrls];
    }

    const updatedClaim = await storage.updateClaim(claimId, {
      status: 'pending', // Revert to pending so finder can review again
      description: newDesc,
      imageUrls: newImages,
      updatedAt: new Date()
    });

    await storage.createClaimStatusLog({
      claimId,
      previousStatus: 'needs_info',
      newStatus: 'pending',
      changedBy: req.user!.id,
      notes: "Claimant provided additional information"
    });

    const report = await storage.getReport(claim.reportId);
    if (report) {
      await storage.createNotification({
        userId: report.userId,
        title: "Claim Updated",
        message: `The claimant for "${report.title}" provided additional info.`,
        type: 'claim_update',
        isRead: false,
        relatedReportId: report.id
      });
    }

    res.json({ message: "Information updated successfully", claim: updatedClaim });
  } catch (error) {
    logger.error("Failed to append info:", error);
    res.status(500).json({ message: "Failed to update info" });
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
 * Finalize the handover using an OTP.
 * Only the finder (report.userId) may submit the OTP.
 */
router.post("/:id/handover", claimVerificationLimiter, async (req, res) => {
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

    // Only the finder (report owner) can confirm physical handover
    if (report.userId !== req.user!.id) {
      return res.status(403).json({ message: "Only the finder can confirm the handover" });
    }

    // Verify OTP
    if (claim.handoverOtp !== otp) {
      return res.status(400).json({ message: "Invalid handover OTP" });
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

          // Deduct KIZERE platform cut before paying the finder
          const platformCut = await PlatformSettingsService.getSettingAsNumber(
            PLATFORM_SETTING_KEYS.BOUNTY_PLATFORM_CUT,
            0.10 // default 10%
          );
          const grossAmount = Number(report.bountyAmount);
          const netAmount = Math.floor(grossAmount * (1 - platformCut));

          logger.info('Bounty payout: applying platform cut', {
            reportId: report.id,
            grossAmount,
            platformCut,
            netAmount,
          });

          // Create payout record for the net (after platform cut)
          const payout = await payoutService.createPayout(
            req.user!.id, // Finder receives the money
            report.id,
            netAmount,
            req.user!.phoneNumber || "0000000000" // Use user's phone or placeholder if missing (should be validated)
          );

          // Process it automatically
          payoutService.processPayout(payout.id).catch(err =>
            logger.error('Failed to process automatic payout', { payoutId: payout.id, error: err })
          );

          logger.info('Bounty payout initiated', {
            reportId: report.id,
            grossAmount,
            netAmount,
            platformCut,
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
