import { Router } from "express";
import { storage } from "../storage";
import { insertClaimSchema } from "@shared/schema";
import { z } from "zod";
import { createLogger } from "../utils/logger";
import { sendClaimNotificationEmail, sendClaimStatusEmail } from "../services/email.service";

const logger = createLogger('ClaimRoutes');
const router = Router();

// Create a claim
router.post("/", async (req, res) => {
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
    
    if (report.type !== 'found') {
      return res.status(400).json({ message: "Can only claim found items" });
    }
    
    const newClaim = await storage.createClaim(validatedData);
    
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

// Get user's submitted claims
router.get("/my-claims", async (req, res) => {
  try {
    const claims = await storage.getUserClaims(req.user!.id);
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your claims" });
  }
});

// Get claims received for user's found items
router.get("/received", async (req, res) => {
  try {
    const claims = await storage.getClaimsReceived(req.user!.id);
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch received claims" });
  }
});

// Verify/Reject a claim
router.patch("/:id/verify", async (req, res) => {
  try {
    const claimId = parseInt(req.params.id);
    const { status, finderNotes } = req.body;
    
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const claim = await storage.getClaim(claimId);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }
    
    const report = await storage.getReport(claim.reportId);
    if (!report) {
      return res.status(404).json({ message: "Associated report not found" });
    }
    
    // Only finder or Admin can verify
    if (report.userId !== req.user!.id && !['Admin'].includes(req.user!.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const updatedClaim = await storage.updateClaim(claimId, {
      status,
      finderNotes,
      verifiedAt: status === 'verified' ? new Date() : null
    });
    
    // Notify the claimant (in-app)
    await storage.createNotification({
      userId: claim.userId,
      title: `Claim ${status === 'verified' ? 'Verified' : 'Rejected'}`,
      message: `Your claim for "${report.title}" has been ${status}.`,
      type: 'claim_update',
      isRead: false,
      relatedItemId: report.itemId || null,
      relatedReportId: report.id
    });
    
    // Send email notification to claimant
    const claimant = await storage.getUser(claim.userId);
    if (claimant?.email) {
      sendClaimStatusEmail(
        claimant.email,
        claimant.fullName || 'User',
        report.title,
        status === 'verified' ? 'approved' : 'rejected'
      ).catch(err => logger.error('Failed to send claim status email', { error: err }));
    }
    
    res.json(updatedClaim);
  } catch (error) {
    logger.error("Failed to verify claim:", error);
    res.status(500).json({ message: "Failed to process claim" });
  }
});

export default router;
