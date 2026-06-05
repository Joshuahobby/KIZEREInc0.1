import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth.middleware";
import { getPaymentAmount } from "../config/payment.config";

// Tight limiter for the PII-rich report endpoint
const reportLookupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many report lookups. Please try again later." },
});
import {
  generateDepositId,
  initiateDeposit,
} from "../utils/pawapay";
import { createLogger } from "../utils/logger";
import { VerificationReportService } from "../services/verification-report.service";
import { ConsumerSubscriptionService, FREE_TIER_REGISTRATION_LIMIT } from "../services/consumer-subscription.service";

const logger = createLogger("ConsumerRoutes");
const router = Router();

// ─── Verification ─────────────────────────────────────────────────────────────

/**
 * GET /api/consumer/verify/:identifier
 * Public free summary: isRegistered, isFlagged, status, category.
 * No owner information returned.
 */
router.get("/verify/:identifier", async (req, res) => {
  const { identifier } = req.params;
  if (!identifier || identifier.trim() === "") {
    return res.status(400).json({ message: "Identifier is required" });
  }
  try {
    const summary = await VerificationReportService.buildFreeSummary(identifier.trim());
    res.json(summary);
  } catch (error) {
    logger.error("Free verify failed", { error, identifier });
    res.status(500).json({ message: "Verification failed" });
  }
});

/**
 * GET /api/consumer/verify/:identifier/report
 * Authenticated. Returns full report if the user has an active purchase or is premium.
 * 402 if no access — client should direct user to purchase flow.
 */
router.get("/verify/:identifier/report", requireAuth, reportLookupLimiter, async (req, res) => {
  const { identifier } = req.params;
  try {
    const report = await VerificationReportService.getReport(req.user!.id, identifier.trim());
    if (!report) {
      return res.status(402).json({
        message: "Full report access required",
        description: "Purchase a one-time report or upgrade to KIZERE Premium for unlimited access.",
        code: "REPORT_ACCESS_REQUIRED",
      });
    }
    res.json(report);
  } catch (error) {
    logger.error("Report fetch failed", { error, identifier, userId: req.user!.id });
    res.status(500).json({ message: "Failed to fetch report" });
  }
});

const purchaseReportSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
  packageId: z.number().optional(),
});

/**
 * POST /api/consumer/verify/:identifier/purchase
 * Authenticated. Initiates a verification_report payment via PawaPay.
 * Stores the identifier in payment metadata so finalizeReport can resolve it.
 */
router.post("/verify/:identifier/purchase", requireAuth, async (req, res) => {
  const { identifier } = req.params;
  try {
    const { phoneNumber, packageId } = purchaseReportSchema.parse(req.body);

    // Check for an already-active purchase (idempotency)
    const existing = await storage.getActiveVerificationPurchase(req.user!.id, identifier.trim());
    if (existing) {
      return res.json({
        message: "You already have an active report for this item",
        alreadyPurchased: true,
      });
    }

    const amount = packageId
      ? Number((await storage.getPaymentPackage(packageId))?.amount ?? 0)
      : await getPaymentAmount("verification_report");

    const depositId = generateDepositId();

    const payment = await storage.createPayment({
      userId: req.user!.id,
      amount: amount.toString(),
      currency: "RWF",
      status: "pending",
      transactionRef: depositId,
      type: "verification_report",
      itemId: null,
      reportId: null,
      packageId: packageId ?? null,
      metadata: { identifier: identifier.trim() },
    });

    const depositResponse = await initiateDeposit({
      amount,
      currency: "RWF",
      depositId,
      phoneNumber,
      metadata: {
        payment_id: payment.id.toString(),
        user_id: req.user!.id.toString(),
        payment_type: "verification_report",
      },
    });

    logger.info("Verification report payment initiated", {
      paymentId: payment.id,
      depositId,
      identifier,
      userId: req.user!.id,
    });

    res.json({
      paymentId: payment.id,
      transactionRef: depositId,
      amount,
      currency: "RWF",
      depositStatus: depositResponse.status,
      payment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    logger.error("Verification report purchase failed", { error, identifier, userId: req.user!.id });
    res.status(500).json({ message: "Failed to initiate report purchase" });
  }
});

// ─── Consumer Subscription ────────────────────────────────────────────────────

/**
 * GET /api/consumer/subscription
 * Authenticated. Returns the user's current premium status.
 */
router.get("/subscription", requireAuth, async (req, res) => {
  try {
    const user = await storage.getUser(req.user!.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isPremium = ConsumerSubscriptionService.isPremium(user);
    res.json({
      isPremium,
      premiumExpiresAt: user.premiumExpiresAt ?? null,
      registrationCount: user.premiumRegistrationCount ?? 0,
      registrationLimit: isPremium ? null : FREE_TIER_REGISTRATION_LIMIT,
    });
  } catch (error) {
    logger.error("Subscription status fetch failed", { error, userId: req.user!.id });
    res.status(500).json({ message: "Failed to fetch subscription status" });
  }
});

const purchaseSubscriptionSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
  packageId: z.number().optional(),
});

/**
 * POST /api/consumer/subscription/purchase
 * Authenticated. Initiates a consumer_subscription payment via PawaPay.
 */
router.post("/subscription/purchase", requireAuth, async (req, res) => {
  try {
    const { phoneNumber, packageId } = purchaseSubscriptionSchema.parse(req.body);

    const amount = packageId
      ? Number((await storage.getPaymentPackage(packageId))?.amount ?? 0)
      : await getPaymentAmount("consumer_subscription");

    const depositId = generateDepositId();

    const payment = await storage.createPayment({
      userId: req.user!.id,
      amount: amount.toString(),
      currency: "RWF",
      status: "pending",
      transactionRef: depositId,
      type: "consumer_subscription",
      itemId: null,
      reportId: null,
      packageId: packageId ?? null,
      metadata: null,
    });

    const depositResponse = await initiateDeposit({
      amount,
      currency: "RWF",
      depositId,
      phoneNumber,
      metadata: {
        payment_id: payment.id.toString(),
        user_id: req.user!.id.toString(),
        payment_type: "consumer_subscription",
      },
    });

    logger.info("Consumer subscription payment initiated", {
      paymentId: payment.id,
      depositId,
      userId: req.user!.id,
    });

    res.json({
      paymentId: payment.id,
      transactionRef: depositId,
      amount,
      currency: "RWF",
      depositStatus: depositResponse.status,
      payment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    logger.error("Consumer subscription purchase failed", { error, userId: req.user!.id });
    res.status(500).json({ message: "Failed to initiate subscription purchase" });
  }
});

export default router;
