/**
 * Consent Management Routes
 * Required by Rwanda Law No. 058/2021, Articles 6, 20-23
 * 
 * These routes allow users to:
 * - View their active and historical consent records
 * - Withdraw consent for specific processing types
 * - Object to specific data processing activities
 * - Restrict processing of their data
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { createLogger } from "../utils/logger";
import * as consentOps from "../storage/consent.storage";
import { UserService } from "../services/user.service";
import { consentTypes } from "@shared/schema";

const router = Router();
const logger = createLogger("ConsentRoutes");

/**
 * GET /api/consent
 * Get all active consent records for the authenticated user
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const consents = await consentOps.getUserConsents(userId);
    res.json(consents);
  } catch (error: any) {
    logger.error("Failed to fetch consents", { userId: req.user?.id, error: error.message });
    res.status(500).json({ message: "Failed to fetch consent records" });
  }
});

/**
 * GET /api/consent/history
 * Get full consent history (including withdrawn) for the authenticated user
 */
router.get("/history", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const history = await consentOps.getUserConsentHistory(userId);
    res.json(history);
  } catch (error: any) {
    logger.error("Failed to fetch consent history", { userId: req.user?.id, error: error.message });
    res.status(500).json({ message: "Failed to fetch consent history" });
  }
});

/**
 * POST /api/consent/grant
 * Record a new consent grant
 */
const grantConsentSchema = z.object({
  consentType: z.enum(consentTypes, {
    errorMap: () => ({ message: "Invalid consent type" }),
  }),
  consentText: z.string().min(10, "Consent text is required"),
});

router.post("/grant", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = grantConsentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: validation.error.errors,
      });
    }

    const { consentType, consentText } = validation.data;

    // Check if consent already active
    const hasConsent = await consentOps.hasActiveConsent(userId, consentType);
    if (hasConsent) {
      return res.status(409).json({ message: "Consent already granted for this type" });
    }

    const record = await consentOps.createConsentRecord({
      userId,
      consentType,
      consentGiven: true,
      consentText,
      ipAddress: (req.ip as string) || null,
      userAgent: req.headers["user-agent"] || null,
    });

    logger.info("Consent granted", { userId, consentType });
    res.status(201).json(record);
  } catch (error: any) {
    logger.error("Failed to grant consent", { userId: req.user?.id, error: error.message });
    res.status(500).json({ message: "Failed to record consent" });
  }
});

/**
 * POST /api/consent/withdraw
 * Withdraw consent for a specific type (Art. 6 — Right to withdraw consent)
 */
const withdrawConsentSchema = z.object({
  consentType: z.enum(consentTypes, {
    errorMap: () => ({ message: "Invalid consent type" }),
  }),
});

router.post("/withdraw", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = withdrawConsentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: validation.error.errors,
      });
    }

    const { consentType } = validation.data;

    // Cannot withdraw registration consent without deleting account
    if (consentType === "registration") {
      return res.status(400).json({
        message: "To withdraw registration consent, please use the account deletion feature instead.",
      });
    }

    const record = await consentOps.withdrawConsent(userId, consentType);
    if (!record) {
      return res.status(404).json({ message: "No active consent found for this type" });
    }

    // If withdrawing verification consent, handle consequences
    if (consentType === "verification") {
      logger.info("Verification consent withdrawn — user verification documents should be reviewed", { userId });
    }

    // If withdrawing marketing consent, update user prefs
    if (consentType === "marketing") {
      try {
        await UserService.updateUser(userId, {
          preferences: {
            ...((req.user?.preferences as any) || {}),
            notifications: {
              ...((req.user?.preferences as any)?.notifications || {}),
              email: false,
            },
          },
        });
      } catch (prefError) {
        logger.error("Failed to update preferences after marketing consent withdrawal", { userId });
      }
    }

    logger.info("Consent withdrawn", { userId, consentType });
    res.json({ message: "Consent withdrawn successfully", record });
  } catch (error: any) {
    logger.error("Failed to withdraw consent", { userId: req.user?.id, error: error.message });
    res.status(500).json({ message: "Failed to withdraw consent" });
  }
});

/**
 * POST /api/consent/restrict-processing
 * Right to Restrict Processing (Art. 23)
 * Freezes the account — data is kept but not actively processed
 */
router.post("/restrict-processing", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const updatedUser = await UserService.updateUser(userId, {
      processingRestricted: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    logger.info("Processing restricted for user", { userId });
    res.json({
      message: "Your data processing has been restricted. Your data will be kept but not actively processed.",
    });
  } catch (error: any) {
    logger.error("Failed to restrict processing", { userId: req.user?.id, error: error.message });
    res.status(500).json({ message: "Failed to restrict processing" });
  }
});

/**
 * POST /api/consent/unrestrict-processing
 * Remove processing restriction
 */
router.post("/unrestrict-processing", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const updatedUser = await UserService.updateUser(userId, {
      processingRestricted: false,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    logger.info("Processing restriction removed for user", { userId });
    res.json({ message: "Processing restriction has been removed." });
  } catch (error: any) {
    logger.error("Failed to unrestrict processing", { userId: req.user?.id, error: error.message });
    res.status(500).json({ message: "Failed to remove processing restriction" });
  }
});

export default router;
