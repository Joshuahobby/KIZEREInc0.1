import { Router } from "express";
import { storage } from "../storage";
import { createLogger } from "../utils/logger";
import { ReportMatchingService } from "../services/report-matching.service";
import { processExpiredReports, renewReport } from "../services/report-expiration.service";

const logger = createLogger('AdminJobRoutes');
const router = Router();

// Trusting routes.ts to mount this with requireAdmin

/**
 * POST /api/admin/jobs/run-matching
 * Re-run matching for all open reports
 */
router.post('/jobs/run-matching', async (req, res) => {
  try {
    logger.info('Admin initiated batch matching', { userId: req.user!.id });

    const result = await ReportMatchingService.rerunMatchingForAllReports();

    // Log admin action
    await storage.createAdminActionLog({
      adminId: req.user!.id,
      action: 'run_batch_matching',
      targetUserId: null,
      details: JSON.stringify(result),
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    res.json({
      success: true,
      message: `Processed ${result.processed} reports`,
      result
    });
  } catch (error) {
    logger.error('Failed to run batch matching', { error });
    res.status(500).json({ message: 'Failed to run batch matching' });
  }
});

/**
 * POST /api/admin/jobs/run-expiration
 * Run report expiration job
 */
router.post('/jobs/run-expiration', async (req, res) => {
  try {
    logger.info('Admin initiated expiration job', { userId: req.user!.id });

    const result = await processExpiredReports();

    // Log admin action
    await storage.createAdminActionLog({
      adminId: req.user!.id,
      action: 'run_expiration_job',
      targetUserId: null,
      details: JSON.stringify(result),
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    res.json({
      success: true,
      message: `Processed ${result.processed} reports. ${result.expired} expired, ${result.gracePeriodStarted} entered grace period`,
      result
    });
  } catch (error) {
    logger.error('Failed to run expiration job', { error });
    res.status(500).json({ message: 'Failed to run expiration job' });
  }
});

/**
 * GET /api/admin/claims
 * Get all claims with details (for admin overview)
 * Supports ?status= filter (pending, verified, rejected, needs_info, withdrawn, resolved, appeals, all)
 */
router.get('/claims', async (req, res) => {
  try {
    const statusFilter = (req.query.status as string) || 'all';
    const allClaims = await storage.getAllClaimsWithDetails(statusFilter);
    res.json(allClaims);
  } catch (error) {
    logger.error('Failed to fetch all claims', { error });
    res.status(500).json({ message: 'Failed to fetch claims' });
  }
});

/**
 * GET /api/admin/claims/appeals
 * Get all pending claim appeals
 */
router.get('/claims/appeals', async (req, res) => {
  try {
    const appeals = await storage.getPendingAppeals();
    res.json(appeals);
  } catch (error) {
    logger.error('Failed to fetch appeals', { error });
    res.status(500).json({ message: 'Failed to fetch appeals' });
  }
});

/**
 * PATCH /api/admin/claims/appeals/:id
 * Resolve a claim appeal
 */
router.patch('/claims/appeals/:id', async (req, res) => {
  try {
    const claimId = parseInt(req.params.id);
    const { decision, adminNotes } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be approved or rejected' });
    }

    const claim = await storage.getClaim(claimId);

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    // Update claim appeal status
    const updatedClaim = await storage.updateClaim(claimId, {
      appealStatus: decision,
      appealAdminNotes: adminNotes,
      appealResolvedAt: new Date(),
      status: decision === 'approved' ? 'pending' : 'rejected'
    });

    if (!updatedClaim) {
      return res.status(500).json({ message: 'Failed to update appeal' });
    }

    // If approved, log the transition
    if (decision === 'approved') {
      await storage.createClaimStatusLog({
        claimId: claim.id,
        previousStatus: claim.status,
        newStatus: 'pending',
        changedBy: req.user!.id,
        notes: `Re-opened via appeal approval: ${adminNotes || 'No notes'}`
      });
    }

    // Log admin action
    await storage.createAdminActionLog({
      adminId: req.user!.id,
      action: 'resolve_claim_appeal',
      targetUserId: claim.userId,
      details: JSON.stringify({ claimId: claim.id, decision }),
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    // Notify the user via in-app notification
    await storage.createNotification({
      userId: claim.userId,
      title: `Appeal ${decision === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your claim appeal has been ${decision}. ${adminNotes ? `Note: ${adminNotes}` : ''}`,
      type: 'claim_update',
      isRead: false
    });

    // Notify the user via email
    try {
      const { sendAppealUpdateEmail } = await import("../services/email.service");
      const user = await storage.getUser(claim.userId);
      const report = await storage.getReport(claim.reportId);

      if (user && user.email && report) {
        sendAppealUpdateEmail(
          user.email,
          user.fullName || user.username,
          report.title,
          decision as 'approved' | 'rejected',
          adminNotes
        ).catch(err => logger.error('Failed to send appeal update email', { error: err }));
      }
    } catch (e) {
      logger.error('Error during appeal notification email trigger', { error: e });
    }

    res.json({
      success: true,
      message: `Appeal ${decision}`,
      appeal: updatedClaim
    });
  } catch (error) {
    logger.error('Failed to resolve appeal', { error });
    res.status(500).json({ message: 'Failed to resolve appeal' });
  }
});

/**
 * GET /api/admin/claims/stats
 * Get claim statistics
 */
router.get('/claims/stats', async (req, res) => {
  try {
    const stats = await storage.getClaimStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to fetch claim stats', { error });
    res.status(500).json({ message: 'Failed to fetch claim statistics' });
  }
});

/**
 * POST /api/admin/reports/:id/renew
 * Admin renew a report
 */
router.post('/reports/:id/renew', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const { extensionDays } = req.body;

    const renewedReport = await renewReport(reportId, extensionDays || 30);

    if (!renewedReport) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Log admin action
    await storage.createAdminActionLog({
      adminId: req.user!.id,
      action: 'admin_renew_report',
      targetUserId: renewedReport.userId,
      details: JSON.stringify({ reportId, extensionDays: extensionDays || 30 }),
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });

    res.json({
      success: true,
      message: 'Report renewed successfully',
      report: renewedReport
    });
  } catch (error) {
    logger.error('Failed to renew report', { error });
    res.status(500).json({ message: (error as Error).message || 'Failed to renew report' });
  }
});

export default router;
