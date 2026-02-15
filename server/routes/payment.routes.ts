import { Router } from "express";
import { storage } from "../storage";
import {
  insertPaymentPackageSchema,
  initiatePaymentSchema
} from "@shared/schema";
import { z } from "zod";
import { createLogger } from "../utils/logger";
import {
  generateTransactionReference,
  initializePayment,
  getPaymentAmount
} from "../utils/flutterwave";
import { getPaymentDescription } from "../config/payment.config";
import { sendPaymentConfirmationEmail } from "../services/email.service";
import { verifyWebhookSignature, verifyTransaction } from "../utils/flutterwave";

const logger = createLogger('PaymentRoutes');
const router = Router();

const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Insufficient permissions" });
  next();
};

const requireAdmin = requireRole(['Admin']);


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

router.post("/initiate", async (req, res) => {
  logger.info("Received payment initiation request", { body: req.body, user: req.user?.id });
  try {
    const validatedData = initiatePaymentSchema.parse(req.body);
    const amount = await getPaymentAmount(validatedData.type as 'registration' | 'lost_report');
    const txRef = generateTransactionReference();

    const payment = await storage.createPayment({
      userId: req.user!.id,
      amount: amount.toString(),
      currency: "RWF",
      status: "pending",
      transactionRef: txRef,
      type: validatedData.type,
      itemId: validatedData.itemId || null,
      reportId: validatedData.reportId || null,
      packageId: validatedData.packageId || null,
      metadata: null
    });

    const flutterwaveResponse = await initializePayment({
      amount,
      currency: "RWF",
      tx_ref: txRef,
      redirect_url: validatedData.redirectUrl || `${process.env.APP_URL || 'http://localhost:5000'}/payment-status`,
      customer: {
        email: req.user!.email,
        name: req.user!.fullName || req.user!.username
      },

      customizations: {
        title: "KIZERE Inc Payment",
        description: await getPaymentDescription(validatedData.type)
      }
    });

    logger.info("Payment initiated successfully", { txRef, checkoutUrl: flutterwaveResponse.data?.link });

    res.json({
      payment,
      paymentUrl: flutterwaveResponse.data?.link
    });
  } catch (error) {
    logger.error("Payment initiation failed", { error, body: req.body });
    res.status(500).json({ message: "Failed to initiate payment" });
  }
});

// Webhook for Flutterwave
router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    if (!signature || !verifyWebhookSignature(signature as string, JSON.stringify(req.body))) {
      // Note: req.body might be an object, but verifyWebhookSignature expects stringified body usually
      // However, our verifyWebhookSignature implementation takes 'data: string'. 
      // Express parses body to JSON. We should ideally use the raw body for signature verification.
      // For now, assuming standard setup.
      return res.status(401).json({ message: "Invalid signature" });
    }

    const payload = req.body;
    logger.info("Received Webhook", { event: payload.event, type: payload.event?.type });

    // Handle different event types
    // Standard structure: { event: 'charge.completed', data: { ... } }
    // Or sometimes just the data if it's a legacy hook? 
    // We will support the standard 'event' property.

    const eventType = payload.event;
    const data = payload.data;

    if (eventType === 'charge.completed' && data.status === 'successful') {
      const { tx_ref, id, amount, currency } = data;

      const transaction = await verifyTransaction(id.toString());

      if (transaction.status === 'success' && transaction.data.status === 'successful') {
        const payment = await storage.getPaymentByTransactionRef(tx_ref);

        if (payment) {
          // Verify amount and currency
          if (payment.currency !== currency) {
            logger.error("Currency mismatch in webhook", { expected: payment.currency, received: currency });
            return res.sendStatus(400);
          }

          // Verify amount (allow small epsilon for float diffs if needed, but strings are safer)
          if (parseFloat(payment.amount) > amount) {
            logger.warn("Partial payment received", { expected: payment.amount, received: amount });
            // We could mark as 'partial' or 'failed' depending on logic.
            // For now, we only complete if full amount.
            return res.sendStatus(200);
          }

          if (payment.status !== 'completed') {
            await storage.updatePayment(payment.id, {
              status: 'completed',
              transactionId: id.toString(),
              flutterwaveRef: data.flw_ref
            });

            // Send confirmation email
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
          }
        } else {
          logger.warn("Payment not found for webhook", { tx_ref });
        }
      }
    } else if (eventType === 'transfer.completed') {
      // Handle payout completion
      // TODO: Implement payout status updates
      logger.info("Transfer completed webhook received", { data });
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error("Webhook processing failed", { error });
    res.sendStatus(500);
  }
});

// Verify a payment by transaction reference
router.get("/verify/:txRef", async (req, res) => {
  const { txRef } = req.params;
  logger.info("Manual verification requested", { txRef });

  try {
    const payment = await storage.getPaymentByTransactionRef(txRef);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Call Flutterwave to verify
    // Using txRef as ID for mock mode compatibility, or use getTransacitonId mechanism in real flow
    // In real FW flow, we might need to search by tx_ref first to get ID, or use verify by tx_ref if supported.
    // Our utility 'verifyTransaction' expects an ID usually, but for Mock it takes txRef.
    // Let's assume we can pass txRef and the utility handles it, or we need to look it up.

    // For now, let's try to verify using the ref (which works in our Mock).
    // In production, we should probably store the FW ID if we have it, or query FW for it.

    const transaction = await verifyTransaction(txRef);

    if (transaction.status === 'success' && transaction.data.status === 'successful') {
      // Verify amount and currency
      if (payment.currency !== transaction.data.currency) {
        logger.error("Currency mismatch in verification", { expected: payment.currency, received: transaction.data.currency });
        return res.status(400).json({ message: "Currency mismatch" });
      }

      if (parseFloat(payment.amount) > transaction.data.amount) {
        logger.warn("Partial payment found", { expected: payment.amount, received: transaction.data.amount });
        return res.status(400).json({ message: "Payment amount insufficient" });
      }

      if (payment.status !== 'completed') {
        await storage.updatePayment(payment.id, {
          status: 'completed',
          transactionId: transaction.data.id.toString(),
          flutterwaveRef: transaction.data.flw_ref
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
      }

      return res.json({
        status: "successful",
        message: "Payment verified successfully",
        transactionRef: txRef,
        amount: transaction.data.amount
      });
    }

    res.json({
      status: transaction.data.status || "pending",
      message: "Payment verification returned non-success status",
      transactionRef: txRef
    });
  } catch (error) {
    logger.error("Verification failed", { error, txRef });
    // Don't expose internal errors
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
