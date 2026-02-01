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
router.get("/packages", async (req, res) => {
  try {
    const packages = await storage.getAllPaymentPackages();
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payment packages" });
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
    const payments = await storage.getUserPayments(req.user!.id);
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
    if (!signature || !verifyWebhookSignature(signature as string, req.body)) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const { status, txRef, id } = req.body;
    
    if (status === 'successful') {
      const transaction = await verifyTransaction(id.toString());
      
      if (transaction.status === 'success') {
        // Update payment status
        const payment = await storage.getPaymentByTransactionRef(txRef);
        if (payment && payment.status !== 'completed') {
          await storage.updatePayment(payment.id, { status: 'completed' });
          
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
      }
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error("Webhook processing failed", { error });
    res.sendStatus(500);
  }
});

export default router;
