import { Router } from "express";
import { storage } from "../storage";
import {
  insertPaymentPackageSchema,
  initiatePaymentSchema,
  payouts
} from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createLogger } from "../utils/logger";
import { validatePawaPayIP } from "../middleware/security.middleware";
import { verifyPawaPaySignature } from "../utils/pawapay-signature";
import {
  generateDepositId,
  initiateDeposit,
  getPaymentAmount,
  checkDepositStatus,
  mapPawaPayStatus,
  predictProvider,
  getFailureMessage
} from "../utils/pawapay";
import type { PawaPayDepositCallback } from "../utils/pawapay";
import { getPaymentDescription } from "../config/payment.config";
import { sendPaymentConfirmationEmail } from "../services/email.service";
import { CouponService } from "../services/coupon.service";

const logger = createLogger('PaymentRoutes');
import { config as serverConfig } from "../config";
import { requireAdmin } from "../middleware/auth.middleware";
logger.info("Payment routes initialized", { MOCK_PAYMENTS: serverConfig.MOCK_PAYMENTS });
const router = Router();

// Authentication middleware is imported from centralized auth.middleware.ts


// Payments & Packages API
// Supports both /api/payments/packages and /api/payment-packages (when mounted accordingly)
router.get(["/", "/packages"], async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const packages = await storage.getAllPaymentPackages();
    // Filter by active if not explicitly requested
    const filteredPackages = includeInactive ? packages : packages.filter(p => p.status === 'active');
    res.json(filteredPackages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payment packages" });
  }
});

router.get("/type/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const onlyActive = req.query.onlyActive !== 'false';
    const packages = await storage.getPaymentPackageByType(type as any, onlyActive);
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payment packages by type" });
  }
});


router.post("/packages", requireAdmin, async (req, res) => {
  try {
    const validatedData = insertPaymentPackageSchema.parse(req.body);
    const newPackage = await storage.createPaymentPackage(validatedData);
    res.status(201).json(newPackage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create package" });
  }
});

router.get("/history", async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const payments = await storage.getUserPayments(req.user.id);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payment history" });
  }
});

// Predict MoMo provider from phone number (used by client before initiating payment)
router.post("/predict-provider", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    const prediction = await predictProvider(phoneNumber);
    res.json(prediction);
  } catch (error) {
    logger.error("Provider prediction failed", { error });
    res.status(500).json({ message: "Failed to predict provider" });
  }
});

router.post("/initiate", async (req, res) => {
  logger.info("Received payment initiation request", {
    body: req.body,
    user: req.user?.id,
    MOCK_PAYMENTS: serverConfig.MOCK_PAYMENTS
  });
  try {
    const validatedData = initiatePaymentSchema.parse(req.body);
    let amount = 0;

    // Determine base amount from package or default
    if (validatedData.packageId) {
      const pkg = await storage.getPaymentPackage(validatedData.packageId);
      if (!pkg) {
        return res.status(400).json({ message: "Invalid payment package selected" });
      }
      amount = Number(pkg.amount);
    } else {
      amount = await getPaymentAmount(validatedData.type as 'registration' | 'lost_report');
    }
    
    // Add bounty if it's a lost report
    if (validatedData.type === "lost_report" && validatedData.reportId) {
      const report = await storage.getReport(validatedData.reportId);
      if (report && report.bountyAmount) {
        const bounty = Number(report.bountyAmount);
        logger.info("Adding bounty to payment amount", { reportId: report.id, baseAmount: amount, bounty });
        amount += bounty;
      }
    }

    // Apply coupon if provided
    let couponId: number | null = null;
    if (validatedData.couponCode) {
      const validation = await CouponService.validateCoupon(
        validatedData.couponCode,
        req.user!.id,
        amount,
        validatedData.type as any
      );

      if (validation.isValid && validation.coupon) {
        logger.info("Applying coupon discount", { 
          code: validatedData.couponCode, 
          originalAmount: amount, 
          discount: validation.discountAmount,
          finalAmount: validation.finalAmount
        });
        amount = validation.finalAmount;
        couponId = validation.coupon.id;
      } else {
        logger.warn("Invalid coupon provided during initiation", { 
          code: validatedData.couponCode, 
          message: validation.message 
        });
        // We can choose to fail or proceed without coupon. 
        // Usually safer to fail if user explicitly provided a coupon that they expect to work.
        return res.status(400).json({ message: validation.message || "Invalid coupon code" });
      }
    }

    const depositId = generateDepositId();

    // Require phone number for PawaPay Direct Deposit
    const phoneNumber = req.body.phoneNumber || req.user?.phoneNumber;
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required for mobile money payment" });
    }

    const payment = await storage.createPayment({
      userId: req.user!.id,
      amount: amount.toString(),
      currency: "RWF",
      status: "pending",
      transactionRef: depositId,
      type: validatedData.type,
      itemId: validatedData.itemId || null,
      reportId: validatedData.reportId || null,
      packageId: validatedData.packageId || null,
      metadata: couponId ? { couponId } : null
    });

    // Initiate deposit with PawaPay
    const depositResponse = await initiateDeposit({
      amount,
      currency: "RWF",
      depositId,
      phoneNumber,
      provider: req.body.provider, // Optional — auto-detected if not provided
      metadata: {
        payment_id: payment.id.toString(),
        user_id: req.user!.id.toString(),
        payment_type: validatedData.type,
      }
    });

    logger.info("Payment initiated successfully", {
      depositId,
      status: depositResponse.status,
      rawResponse: depositResponse
    });

    res.json({
      paymentId: payment.id,
      transactionRef: depositId,
      amount: amount,
      currency: "RWF",
      depositId: depositId,
      depositStatus: depositResponse.status,
      payment: payment
    });
  } catch (error) {
    logger.error("Payment initiation failed", { error, body: req.body });
    res.status(500).json({ message: "Failed to initiate payment" });
  }
});

// Webhook / callback for PawaPay deposit and payout status updates
// PawaPay uses IP whitelisting + RFC-9421 signed callback verification
router.post("/webhook", validatePawaPayIP, verifyPawaPaySignature, async (req, res) => {
  try {
    const payload = req.body;

    // Handle Deposit Callback
    if (payload.depositId) {
      logger.info("Received PawaPay deposit callback", { depositId: payload.depositId, status: payload.status });

      const payment = await storage.getPaymentByTransactionRef(payload.depositId);
      if (!payment) {
        logger.warn("Payment not found for callback", { depositId: payload.depositId });
        return res.sendStatus(200);
      }

      if (payload.status === 'COMPLETED') {
        if (payment.currency === payload.currency && parseFloat(payment.amount) <= parseFloat(payload.amount)) {
          if (payment.status !== 'completed') {
            await storage.updatePayment(payment.id, {
              status: 'completed',
              transactionId: payload.depositId,
              providerRef: payload.providerTransactionId || null
            });

            const user = await storage.getUser(payment.userId);
            if (user?.email) {
              sendPaymentConfirmationEmail(
                user.email,
                user.fullName || user.username,
                parseFloat(payment.amount),
                payment.currency,
                payment.transactionRef,
                payment.type
              ).catch(err => logger.error('Failed to send payment email', { error: err }));
            }

            // Phase: Finalize item registration or report payment if this was a registration/report payment
            if (payment.type === 'registration' && payment.itemId) {
              logger.info("Finalizing item registration after successful payment", { itemId: payment.itemId });
              await storage.updateItem(payment.itemId, { status: 'Registered' });
            } else if (payment.type === 'lost_report' && payment.reportId) {
              logger.info("Finalizing lost report after successful payment", { reportId: payment.reportId });
              await storage.updateReport(payment.reportId, { paymentStatus: 'successful' });
            } else if (payment.type === 'featured_upgrade' && payment.reportId) {
              logger.info("Featuring report after successful upgrade payment", { reportId: payment.reportId });
              await storage.updateReport(payment.reportId, { isFeatured: true, featuredAt: new Date() });
            }

            // Record coupon usage if applicable
            const metadata = payment.metadata as any;
            if (metadata && metadata.couponId) {
              logger.info("Recording coupon usage after successful webhook", { couponId: metadata.couponId });
              await CouponService.recordUsage(metadata.couponId).catch(err => 
                logger.error("Failed to record coupon usage", { error: err, couponId: metadata.couponId })
              );
            }
          }
        }
      } else if (payload.status === 'FAILED') {
        if (payment.status !== 'completed') {
          await storage.updatePayment(payment.id, {
            status: 'failed' as any,
            providerRef: payload.providerTransactionId || null,
            metadata: payload.failureReason ? {
              failureCode: payload.failureReason.failureCode,
              failureMessage: payload.failureReason.failureMessage,
            } : null
          });
        }
      }
    }
    // Handle Payout (Refund) Callback
    else if (payload.payoutId) {
      logger.info("Received PawaPay payout callback", { payoutId: payload.payoutId, status: payload.status });

      const [payout] = await db.select().from(payouts).where(eq(payouts.providerRef, payload.payoutId));

      if (payout) {
        const newStatus = payload.status === 'COMPLETED' ? 'completed' :
          payload.status === 'FAILED' ? 'failed' : 'processing';

        await db.update(payouts)
          .set({
            status: newStatus,
            processedAt: new Date(),
            failureReason: payload.failureReason?.failureMessage || null
          })
          .where(eq(payouts.id, payout.id));

        logger.info(`Payout ${payout.id} updated to ${newStatus}`);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error("Webhook processing failed", { error });
    res.sendStatus(500);
  }
});

// Verify a payment by transaction reference (depositId)
router.get("/verify/:txRef", async (req, res) => {
  const { txRef } = req.params;
  logger.info("Manual verification requested", { txRef });

  try {
    const payment = await storage.getPaymentByTransactionRef(txRef);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Call PawaPay to check deposit status
    const depositStatus = await checkDepositStatus(txRef);
    const internalStatus = mapPawaPayStatus(depositStatus.status);

    logger.info("[PaymentVerify] Manual verification result", {
      txRef,
      pawaPayStatus: depositStatus.status,
      internalStatus,
      amount: depositStatus.amount,
      MOCK_PAYMENTS: serverConfig.MOCK_PAYMENTS
    });

    if (internalStatus === 'successful') {
      // Verify currency
      if (depositStatus.currency && payment.currency !== depositStatus.currency) {
        logger.error("Currency mismatch in verification", { expected: payment.currency, received: depositStatus.currency });
        return res.status(400).json({ message: "Currency mismatch" });
      }

      // Verify amount
      if (depositStatus.amount && parseFloat(payment.amount) > parseFloat(depositStatus.amount)) {
        logger.warn("Partial payment found", { expected: payment.amount, received: depositStatus.amount });
        return res.status(400).json({ message: "Payment amount insufficient" });
      }

      if (payment.status !== 'completed') {
        await storage.updatePayment(payment.id, {
          status: 'completed',
          transactionId: depositStatus.depositId,
          providerRef: depositStatus.providerTransactionId || null
        });

        // Send confirmation email if not already sent
        const user = await storage.getUser(payment.userId);
        if (user?.email) {
          sendPaymentConfirmationEmail(
            user.email,
            user.fullName || user.username,
            parseFloat(payment.amount),
            payment.currency,
            payment.transactionRef,
            payment.type
          ).catch(err => logger.error('Failed to send payment email', { error: err }));
        }

        // Phase: Finalize item registration or report payment if this was a registration/report payment
        if (payment.type === 'registration' && payment.itemId) {
          logger.info("Finalizing item registration after manual verification", { itemId: payment.itemId });
          await storage.updateItem(payment.itemId, { status: 'Registered' });
        } else if (payment.type === 'lost_report' && payment.reportId) {
          logger.info("Finalizing lost report after manual verification", { reportId: payment.reportId });
          await storage.updateReport(payment.reportId, { paymentStatus: 'successful' });
        } else if (payment.type === 'featured_upgrade' && payment.reportId) {
          logger.info("Featuring report after manual verification", { reportId: payment.reportId });
          await storage.updateReport(payment.reportId, { isFeatured: true, featuredAt: new Date() });
        }

        // Record coupon usage if applicable
        const metadata = payment.metadata as any;
        if (metadata && metadata.couponId) {
          logger.info("Recording coupon usage after successful manual verification", { couponId: metadata.couponId });
          await CouponService.recordUsage(metadata.couponId).catch(err => 
            logger.error("Failed to record coupon usage", { error: err, couponId: metadata.couponId })
          );
        }
      }

      return res.json({
        status: "successful",
        message: "Payment verified successfully",
        transactionRef: txRef,
        amount: depositStatus.amount ? parseFloat(depositStatus.amount) : parseFloat(payment.amount)
      });
    }

    if (internalStatus === 'failed') {
      if (payment.status !== 'completed' && payment.status !== 'failed') {
        await storage.updatePayment(payment.id, {
          status: 'failed' as any,
          providerRef: depositStatus.providerTransactionId || null
        });
      }
    }

    res.json({
      status: internalStatus,
      message: internalStatus === 'failed'
        ? getFailureMessage(depositStatus.failureReason?.failureCode, depositStatus.failureReason?.failureMessage)
        : "Payment is still being processed",
      failureCode: internalStatus === 'failed' ? depositStatus.failureReason?.failureCode : undefined,
      transactionRef: txRef
    });
  } catch (error) {
    logger.error("Verification failed", { error, txRef });
    res.status(500).json({ message: "Verification failed. Please try again or contact support." });
  }
});

// Get payment status
router.get("/status/:txRef", async (req, res) => {
  try {
    const payment = await storage.getPaymentByTransactionRef(req.params.txRef);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch status" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid package ID" });
    }
    const pkg = await storage.getPaymentPackage(id);
    if (!pkg) return res.status(404).json({ message: "Package not found" });
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payment package" });
  }
});

export default router;
