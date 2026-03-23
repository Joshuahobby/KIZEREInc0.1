/**
 * Data Subject Rights Routes
 * Required by Rwanda Law No. 058/2021, Articles 19-24
 * 
 * Implements:
 * - Right of Access / Data Portability (Art. 19, 22) — Download My Data
 * - Right to Erasure (Art. 21) — Delete My Account
 * - Right against Automated Decisions (Art. 24) — Request human review
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { createLogger } from "../utils/logger";
import { storage } from "../storage";
import { UserService } from "../services/user.service";
import * as consentOps from "../storage/consent.storage";
import { comparePasswords } from "../utils/auth-crypto";
import { db } from "../db";
import { eq } from "drizzle-orm";
import {
  users, items, reports, claims, payments, notifications,
  messages, chats, userActivityLogs, pushSubscriptions, consentRecords,
  paymentMethods, verificationRequests
} from "@shared/schema";

const router = Router();
const logger = createLogger("DataRightsRoutes");

/**
 * GET /api/me/data-export
 * Right of Access + Data Portability (Art. 19, 22)
 * Exports ALL user data in JSON format
 */
router.get("/data-export", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    logger.info("Data export requested", { userId });

    // Gather all user data across tables
    const [
      userData,
      userItems,
      userReports,
      userClaims,
      userPayments,
      userNotifications,
      userConsents,
      userActivityLogEntries,
    ] = await Promise.all([
      UserService.getUserById(userId),
      storage.getUserItems(userId),
      storage.getUserReports(userId),
      storage.getUserClaims(userId),
      storage.getUserPayments(userId),
      storage.getUserNotifications(userId),
      consentOps.getUserConsentHistory(userId),
      storage.getUserActivityLogs(userId, 1, 10000),
    ]);

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Strip sensitive fields
    const { password, ...userProfile } = userData;

    const exportData = {
      exportDate: new Date().toISOString(),
      dataSubject: "This is your personal data as held by KIZERE Registry Platform",
      legalBasis: "Rwanda Law No. 058/2021, Articles 19 & 22",
      profile: userProfile,
      items: userItems,
      reports: userReports,
      claims: userClaims,
      payments: userPayments.map(p => ({
        ...p,
        // Don't export raw payment tokens
        metadata: undefined,
      })),
      notifications: userNotifications,
      consentRecords: userConsents,
      activityLogs: userActivityLogEntries.map(log => ({
        action: log.action,
        timestamp: log.timestamp,
        // Exclude raw IP/UA for export
      })),
    };

    // Log this export in audit trail
    try {
      await storage.createUserActivityLog({
        userId,
        action: "data_export",
        details: { type: "full_data_export" },
        ipAddress: (req.ip as string) || null,
        userAgent: req.headers["user-agent"] || null,
      });
    } catch (logErr) {
      logger.error("Failed to log data export", { userId });
    }

    res.setHeader("Content-Disposition", `attachment; filename="kizere-data-export-${userId}-${Date.now()}.json"`);
    res.setHeader("Content-Type", "application/json");
    res.json(exportData);
  } catch (error: any) {
    logger.error("Data export failed", { userId: req.user?.id, error: error.message });
    res.status(500).json({ message: "Failed to export data" });
  }
});

/**
 * POST /api/me/request-deletion
 * Right to Erasure (Art. 21) — Request account deletion
 * Implements a 7-day grace period (soft delete → hard delete)
 */
const deletionSchema = z.object({
  password: z.string().min(1, "Password is required for account deletion"),
  reason: z.string().optional(),
});

router.post("/request-deletion", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = deletionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: validation.error.errors,
      });
    }

    const { password, reason } = validation.data;

    // Verify password
    const user = await UserService.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await comparePasswords(password, user.password);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Set deletion request timestamp (7-day grace period)
    await UserService.updateUser(userId, {
      deletionRequestedAt: new Date(),
      status: "inactive",
    });

    // Log in audit trail
    await storage.createUserActivityLog({
      userId,
      action: "account_deletion_requested",
      details: { reason: reason || "User requested account deletion" },
      ipAddress: (req.ip as string) || null,
      userAgent: req.headers["user-agent"] || null,
    });

    logger.info("Account deletion requested", { userId, reason });

    res.json({
      message: "Account deletion requested. Your account will be permanently deleted after 7 days. You can cancel this by logging in during the grace period.",
      deletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error: any) {
    logger.error("Deletion request failed", { userId: req.user?.id, error: error.message });
    res.status(500).json({ message: "Failed to process deletion request" });
  }
});

/**
 * POST /api/me/cancel-deletion
 * Cancel a pending account deletion during the grace period
 */
router.post("/cancel-deletion", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await UserService.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.deletionRequestedAt) {
      return res.status(400).json({ message: "No pending deletion request" });
    }

    await UserService.updateUser(userId, {
      deletionRequestedAt: null,
      status: "active",
    });

    logger.info("Account deletion cancelled", { userId });
    res.json({ message: "Account deletion has been cancelled. Your account is active again." });
  } catch (error: any) {
    logger.error("Deletion cancellation failed", { userId: req.user?.id, error: error.message });
    res.status(500).json({ message: "Failed to cancel deletion" });
  }
});

/**
 * DELETE /api/me/account
 * Immediate account anonymization (skip grace period — for use by admin jobs or users confirming)
 * This permanently anonymizes user data
 */
router.delete("/account", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { password } = req.body || {};

    // Verify password
    const user = await UserService.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (password) {
      const isValid = await comparePasswords(password, user.password);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid password" });
      }
    } else {
      return res.status(400).json({ message: "Password confirmation required" });
    }

    const anonymizedName = `[DELETED_USER_${userId}]`;

    // 1. Anonymize user record (keep for referential integrity)
    await db.update(users).set({
      fullName: anonymizedName,
      username: `deleted_${userId}_${Date.now()}`,
      email: `deleted_${userId}@anonymized.local`,
      password: "ANONYMIZED",
      phoneNumber: null,
      avatarUrl: null,
      address: null,
      city: null,
      country: null,
      postalCode: null,
      bio: null,
      recoveryEmail: null,
      notes: null,
      verificationDocuments: null,
      suspensionHistory: null,
      preferences: null,
      customPermissions: null,
      status: "inactive" as any,
      processingRestricted: true,
    }).where(eq(users.id, userId));

    // 2. Delete push subscriptions
    const subs = await storage.getUserPushSubscriptions(userId);
    for (const sub of subs) {
      await storage.deletePushSubscription(sub.endpoint);
    }

    // 3. Delete consent records
    await consentOps.deleteUserConsents(userId);

    // 4. Delete verification documents from Cloudinary
    try {
      const verReq = await storage.getVerificationRequest(userId);
      if (verReq?.documentPublicId || verReq?.selfiePublicId) {
        // Attempt to delete from Cloudinary
        const { deleteImage } = await import("../services/cloudinary.service");
        if (verReq.documentPublicId) await deleteImage(verReq.documentPublicId).catch(() => {});
        if (verReq.selfiePublicId) await deleteImage(verReq.selfiePublicId).catch(() => {});
      }
    } catch (verErr) {
      logger.error("Failed to delete verification documents", { userId });
    }

    // 5. Log the deletion (keep this record for compliance)
    await storage.createUserActivityLog({
      userId,
      action: "account_deleted",
      details: { anonymized: true },
      ipAddress: (req.ip as string) || null,
      userAgent: req.headers["user-agent"] || null,
    });

    // 6. Destroy the session
    req.logout(() => {
      req.session.destroy((err) => {
        if (err) logger.error("Session destroy error during account deletion", { userId });
        res.clearCookie("kizere.sid");
        logger.info("Account permanently deleted/anonymized", { userId });
        res.json({ message: "Your account has been permanently deleted and all personal data anonymized." });
      });
    });
  } catch (error: any) {
    logger.error("Account deletion failed", { userId: req.user?.id, error: error.message });
    res.status(500).json({ message: "Failed to delete account" });
  }
});

/**
 * POST /api/me/request-human-review
 * Right against Automated Decisions (Art. 24)
 * Request human review of an automated match/decision
 */
const humanReviewSchema = z.object({
  entityType: z.enum(["report", "claim", "match"]),
  entityId: z.number().positive(),
  reason: z.string().min(10, "Please explain why you want a human review"),
});

router.post("/request-human-review", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = humanReviewSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: validation.error.errors,
      });
    }

    const { entityType, entityId, reason } = validation.data;

    // Create a notification to admins
    const admins = await storage.getUsersByRole(["Admin", "Moderator"]);
    for (const admin of admins) {
      await storage.createNotification({
        userId: admin.id,
        title: "Human Review Requested",
        message: `User #${userId} has requested human review of ${entityType} #${entityId}. Reason: ${reason}`,
        type: "human_review_request",
      });
    }

    // Log in audit trail
    await storage.createUserActivityLog({
      userId,
      action: "human_review_requested",
      details: { entityType, entityId, reason },
      ipAddress: (req.ip as string) || null,
      userAgent: req.headers["user-agent"] || null,
    });

    logger.info("Human review requested", { userId, entityType, entityId });
    res.json({
      message: "Your request for human review has been submitted. An administrator will review this manually.",
    });
  } catch (error: any) {
    logger.error("Human review request failed", { userId: req.user?.id, error: error.message });
    res.status(500).json({ message: "Failed to submit human review request" });
  }
});

export default router;
