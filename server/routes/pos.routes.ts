import { Router, Request, Response, NextFunction } from "express";
import { requireRetailerApiKey } from "../middleware/retailer-auth.middleware";
import { posRateLimiter, requireFeature, nidLookupLimiter } from "../middleware/retailer-subscription.middleware";
import { requireAuth, requireRole, requireAdmin } from "../middleware/auth.middleware";
import {
  checkOrCreateCustomer,
  registerProduct,
  transferOwnership,
  finalizeTransferAfterPayment,
  processReturn,
  createRetailer,
  getRetailers,
  getRetailerById,
  updateRetailer,
  regenerateApiKey,
  getProductHistory,
  getRetailerProducts,
  getOwnerProducts,
  getRetailerByUserId,
  getRetailerStats,
  getPosAnalytics,
  searchRetailerProducts,
  getProductHistoryPaginated,
  getProductById,
  archiveProduct,
  recoverProduct,
  checkDuplicateSerial,
  getPosProductBySerial,
  bulkRegisterProducts,
  getRetailerSecurityAlerts,
  getRetailerTransactionsPaginated,
  getRetailerCustomersPaginated,
  reportProductStolen,
  getRetailerCustomerDetail,
  updateCustomerSettings,
  getOrCreateRetailerCustomerSettings,
  getShiftSummary,
  getLedgerContractData,
  getBuyerPurchaseHistory,
} from "../services/pos.service";
import { generateDepositId, initiateDeposit } from "../utils/pawapay";
import { getPaymentAmount } from "../config/payment.config";
import { createLogger } from "../utils/logger";
import { z } from "zod";
import { db } from "../db";
import { users, DEFAULT_USER_PREFERENCES } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { sendOTP, verifyOTP } from "../services/otp.service";
import bcrypt from "bcrypt";
import { isPosStubAccount } from "../services/pos.service";
import { storage } from "../storage";
import { sendEmail } from "../services/email.service";
import { CommissionService } from "../services/commission.service";
import { RetailerSubscriptionService } from "../services/retailer-subscription.service";
import { PlatformSettingsService } from "../services/platform-settings.service";
import { CertificateService } from "../services/certificate.service";
import rateLimit from "express-rate-limit";

const logger = createLogger("PosRoutes");
const router = Router();

/** Strip the plaintext API key from retailer objects before sending to clients. */
function safeRetailer(r: any) {
  if (!r) return r;
  const { apiKey: _k, ...rest } = r;
  return rest;
}

// Strict rate limiter for public POS claim endpoints (prevents NID brute-force / OTP abuse)
const posClaimLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});

// ═══════════════════════════════════════════════════════════
// DUAL AUTH MIDDLEWARE
// Accepts either session auth (logged-in Retailer/Admin) OR API key (external POS)
// Attaches retailer to req.retailer for downstream handlers
// ═══════════════════════════════════════════════════════════

async function posAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"] as string | undefined;

  if (apiKey) {
    // API key auth path (external POS systems)
    return requireRetailerApiKey(req, res, next);
  }

  // Session auth path (web UI)
  if (!req.isAuthenticated?.()) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = (req as any).user;
  const allowedRoles = ["Retailer", "Admin"];
  if (!allowedRoles.includes(user.role)) {
    return res.status(403).json({ message: "POS access requires Retailer or Admin role" });
  }

  // Look up the retailer record for this user
  try {
    const retailer = await getRetailerByUserId(user.id);
    if (!retailer) {
      return res.status(403).json({
        message: "No retailer profile found. Contact an admin to set up your POS access.",
      });
    }
    if (retailer.status !== "active") {
      return res.status(403).json({ message: "Retailer account is not active" });
    }
    (req as any).retailer = retailer;
    next();
  } catch (error: any) {
    logger.error("POS session auth error", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ═══════════════════════════════════════════════════════════
// POS TERMINAL ENDPOINTS (Dual auth: session or API key)
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/pos/check-or-create
 * Looks up customer by NID or creates stub account instantly.
 */
router.post(
  "/check-or-create",
  posAuthMiddleware, posRateLimiter, nidLookupLimiter,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        nationalId: z.string().min(6, "National ID is required"),
        fullName: z.string().min(2, "Full name is required").optional().or(z.literal("")).transform(v => v === "" ? undefined : v),
        phone: z.string().optional().or(z.literal("")).transform(v => v === "" ? undefined : v),
        email: z.string().email().optional().or(z.literal("")).transform(e => e === "" ? undefined : e),
      });

      const data = schema.parse(req.body);
      
      // If no name is provided, we only perform a lookup
      if (!data.fullName) {
        const existing = await storage.getUserByNationalId(data.nationalId);
        if (existing) {
          return res.json({
            success: true,
            isNew: false,
            customer: {
              id: existing.id,
              fullName: existing.fullName,
              username: existing.username,
              phone: existing.phoneNumber,
              email: existing.email,
              nationalId: existing.nationalId,
            },
          });
        }
        return res.json({ success: false, message: "Customer not found. Please provide name to create account." });
      }

      const result = await checkOrCreateCustomer(
        data.nationalId,
        data.fullName,
        data.phone,
        data.email
      );

      res.json({
        success: true,
        isNew: result.isNew,
        customer: {
          id: result.user.id,
          fullName: result.user.fullName,
          username: result.user.username,
          phone: result.user.phoneNumber,
          email: result.user.email,
          nationalId: result.user.nationalId,
        },
      });
    } catch (error: any) {
      logger.error("check-or-create failed", { error: error.message });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/inventory/search?serialNumber=XYZ
 * Search for an item in the retailer's own inventory (unassigned items).
 */
router.get(
  "/inventory/search",
  posAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const serialNumber = req.query.serialNumber as string;
      if (!serialNumber) {
        return res.status(400).json({ message: "Serial number is required" });
      }

      const retailer = (req as any).retailer;
      const product = await storage.getPosProductBySerial(serialNumber);

      if (product && product.retailerId === retailer.id && product.currentOwnerId === retailer.userId) {
        return res.json({ 
          success: true, 
          inStock: true,
          product: {
            id: product.id,
            name: product.name,
            category: product.category,
            sku: product.sku,
            metadata: product.metadata,
          }
        });
      }

      res.json({ success: true, inStock: false, message: "Product not found in store stock" });
    } catch (error: any) {
      logger.error("Inventory search failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /api/pos/stock-in
 * Register a product directly to the retailer's inventory (owned by retailer).
 */
router.post(
  "/stock-in",
  posAuthMiddleware,
  posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        serialNumber: z.string().min(3, "Serial number is required"),
        name: z.string().min(2, "Product name is required"),
        brand: z.string().optional(),
        model: z.string().optional(),
        category: z.string().optional().default("Other"),
        sku: z.string().optional(),
        metadata: z.record(z.any()).optional(),
        notes: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const retailer = (req as any).retailer;

      const productData = {
        ...data,
        retailerId: retailer.id,
        ownerId: retailer.userId, // Owned by retailer originally
        status: "registered",
      };

      const result = await registerProduct(productData);
      res.json({ success: true, product: result.product });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      logger.error("Stocking in failed", { error: error.message });
      res.status(error.status || 500).json({ message: error.message });
    }
  }
);
router.post(
  "/register",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        serialNumber: z.string().min(3, "Serial number is required"),
        name: z.string().min(2, "Product name is required"),
        brand: z.string().optional(),
        model: z.string().optional(),
        category: z.string().optional().default("Other"),
        sku: z.string().optional(),
        ownerId: z.coerce.number().int().positive("Valid owner ID is required"),
        metadata: z.record(z.any()).optional(),
        purchaseAgreement: z.string().optional(),
        legalDocUrl: z.string().url().optional(),
        transactionValue: z.number().positive().optional(),
      });

      const data = schema.parse(req.body);
      const retailer = (req as any).retailer;

      const result = await registerProduct({
        serialNumber: data.serialNumber,
        name: data.name,
        brand: data.brand,
        model: data.model,
        category: data.category,
        sku: data.sku,
        retailerId: retailer.id,
        ownerId: data.ownerId,
        metadata: data.metadata,
        purchaseAgreement: data.purchaseAgreement,
        legalDocUrl: data.legalDocUrl,
        transactionValue: data.transactionValue,
      });

      res.status(201).json({
        success: true,
        product: result.product,
        ledger: result.ledgerEntry,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        logger.warn("POS registration validation failed", { 
          errors: error.errors,
          body: req.body 
        });
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }

      logger.error("POS registration error", { 
        error: error.message,
        statusCode: error.statusCode,
        status: error.status 
      });
      
      const status = error.statusCode || error.status || 500;
      res.status(status).json({ 
        message: error.message || "Internal server error",
        ...(process.env.NODE_ENV !== "production" && { details: error.details })
      });
    }
  }
);

/**
 * GET /api/pos/check-duplicate
 * Checks if a serial number is already registered.
 */
router.get(
  "/check-duplicate",
  posAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const serial = req.query.serial as string;
      if (!serial) return res.status(400).json({ message: "Serial number required" });
      const isDuplicate = await checkDuplicateSerial(serial);
      res.json({ success: true, isDuplicate });
    } catch (error: any) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /api/pos/bulk-register
 * Bulk registers products to inventory.
 */
router.post(
  "/bulk-register",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const schema = z.array(z.object({
        serialNumber: z.string().min(3),
        name: z.string().min(2),
        brand: z.string().optional(),
        model: z.string().optional(),
        category: z.string().optional().default("Other"),
        sku: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      })).min(1, "At least one product is required");

      const items = schema.parse(req.body);
      const retailer = (req as any).retailer;

      const results = await bulkRegisterProducts(retailer.id, items);
      res.json({ success: true, ...results });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      const status = error.status || 500;
      res.status(status).json({ message: error.message || "Internal server error" });
    }
  }
);

/**
 * POST /api/pos/transfer
 * Initiate a transfer_fee payment; actual ownership transfer runs in the webhook
 * after PawaPay confirms the deposit. Returns paymentId for client polling.
 */
router.post(
  "/transfer",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        productId: z.number().int().positive("Valid product ID is required"),
        newOwnerId: z.number().int().positive("Valid new owner ID is required"),
        phoneNumber: z.string().min(10, "Phone number required for transfer fee payment"),
        notes: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      });

      const data = schema.parse(req.body);
      const retailer = (req as any).retailer;
      const actingUserId: number = (req as any).user?.id ?? retailer.userId;

      // Pre-validate the product before creating a payment
      const product = await storage.getPosProduct(data.productId);
      if (!product) return res.status(404).json({ message: "Product not found" });
      if (product.status === "stolen") {
        return res.status(403).json({ message: "Cannot transfer a stolen item" });
      }

      const transferFeeAmount = await getPaymentAmount("transfer_fee");
      const depositId = generateDepositId();

      const payment = await storage.createPayment({
        userId: actingUserId,
        amount: transferFeeAmount.toString(),
        currency: "RWF",
        status: "pending",
        transactionRef: depositId,
        type: "transfer_fee",
        posProductId: data.productId,
        posRetailerId: retailer.id,
        metadata: {
          newOwnerId: data.newOwnerId,
          notes: data.notes ?? null,
        },
      });

      const depositResponse = await initiateDeposit({
        amount: transferFeeAmount,
        currency: "RWF",
        depositId,
        phoneNumber: data.phoneNumber,
        metadata: {
          payment_id: payment.id.toString(),
          payment_type: "transfer_fee",
          product_id: data.productId.toString(),
        },
      });

      res.json({
        paymentId: payment.id,
        transactionRef: depositId,
        amount: transferFeeAmount,
        currency: "RWF",
        depositStatus: depositResponse.status,
      });
    } catch (error: any) {
      logger.error("Transfer payment initiation failed", { error: error.message });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      const status = error.status || 500;
      res.status(status).json({ message: error.message || "Internal server error" });
    }
  }
);

/**
 * POST /api/pos/return
 * Return a product back to the retailer's inventory.
 * Supports reason: Refund, Repair, Exchange, Other.
 */
router.post(
  "/return",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        productId: z.number().int().positive("Valid product ID is required"),
        reason: z.enum(["Refund", "Repair", "Exchange", "Defective", "Other"], {
          errorMap: () => ({ message: "Return reason is required" })
        }),
        notes: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      });

      const data = schema.parse(req.body);
      const retailer = (req as any).retailer;

      const result = await processReturn({
        productId: data.productId,
        retailerId: retailer.id,
        reason: data.reason,
        notes: data.notes,
        metadata: data.metadata,
      });

      res.json({
        success: true,
        product: result.product,
        ledger: result.ledgerEntry,
      });
    } catch (error: any) {
      logger.error("return failed", { error: error.message });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      const status = error.status || 500;
      res.status(status).json({ message: error.message || "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/shift-summary
 * Get today's shift summary (registrations, transfers, returns by category).
 */
router.get(
  "/shift-summary",
  posAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const retailer = (req as any).retailer;
      const dateParam = req.query.date as string | undefined;
      const shiftDate = dateParam ? new Date(dateParam) : undefined;

      const summary = await getShiftSummary(retailer.id, shiftDate);
      res.json({ success: true, summary });
    } catch (error: any) {
      logger.error("shift-summary failed", { error: error.message });
      res.status(500).json({ message: "Failed to fetch shift summary" });
    }
  }
);

/**
 * GET /api/pos/products/:productId/history
 * Get ownership history for a product.
 */
router.get(
  "/products/:productId/history",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.productId, 10);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await getProductById(productId, (req as any).retailer.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const history = await getProductHistory(productId);
      res.json({ success: true, history });
    } catch (error: any) {
      logger.error("getProductHistory failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/my-products
 * Get products registered by the current retailer.
 */
router.get(
  "/my-products",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const retailer = (req as any).retailer;
      const products = await getRetailerProducts(retailer.id);
      res.json({ success: true, products });
    } catch (error: any) {
      logger.error("getRetailerProducts failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/my-stats
 * Get dashboard stats for the current retailer.
 */
router.get(
  "/my-stats",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const retailer = (req as any).retailer;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const stats = await getRetailerStats(retailer.id, startDate, endDate);
      res.json({ success: true, stats, retailer: safeRetailer(retailer) });
    } catch (error: any) {
      logger.error("getRetailerStats failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/my-transactions
 * Get paginated transactions for the retailer.
 */
router.get(
  "/my-transactions",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const retailerId = (req as any).retailer.id;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const eventType = (req.query.eventType as string) || undefined;
      
      const result = await getRetailerTransactionsPaginated(retailerId, { page, limit, eventType });
      res.json({ success: true, ...result });
    } catch (error: any) {
      logger.error("Failed to get retailer transactions", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /api/pos/my-customers
 * Explicitly add a customer to this retailer's directory (create user if needed,
 * then upsert a retailer_customer_settings row so they show in the list).
 */
router.post(
  "/my-customers",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const retailerId = (req as any).retailer.id;
      const schema = z.object({
        nationalId: z.string().min(1),
        fullName: z.string().min(1),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
      });
      const { nationalId, fullName, phone, email } = schema.parse(req.body);

      const { user, isNew } = await checkOrCreateCustomer(
        nationalId,
        fullName,
        phone || undefined,
        email || undefined
      );

      // Ensure a settings row exists so the customer appears in the directory
      await getOrCreateRetailerCustomerSettings(retailerId, user.id);

      res.json({ success: true, isNew, customer: { id: user.id, fullName: user.fullName, email: user.email, phoneNumber: user.phoneNumber } });
    } catch (error: any) {
      logger.error("Failed to add customer", { error: error.message });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      const status = error.status || (error.message?.includes("already exists") ? 409 : 500);
      res.status(status).json({ message: error.message || "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/my-customers
 * Get paginated customers tied to the retailer.
 */
router.get(
  "/my-customers",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const retailerId = (req as any).retailer.id;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const result = await getRetailerCustomersPaginated(retailerId, { page, limit });
      res.json({ success: true, ...result });
    } catch (error: any) {
      logger.error("Failed to get retailer customers", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/my-customers/:id
 * Get detailed customer profile with transaction history.
 */
router.get(
  "/my-customers/:id",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const retailerId = (req as any).retailer.id;
      const customerId = parseInt(req.params.id, 10);
      if (isNaN(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }

      const result = await getRetailerCustomerDetail(retailerId, customerId);
      if (!result) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json({ success: true, customer: result });
    } catch (error: any) {
      logger.error("Failed to get customer detail", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PATCH /api/pos/my-customers/:id/settings
 * Update CRM settings (blocking, notes) for a customer.
 */
router.patch(
  "/my-customers/:id/settings",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const retailerId = (req as any).retailer.id;
      const customerId = parseInt(req.params.id, 10);
      if (isNaN(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }

      const schema = z.object({
        isBlocked: z.boolean().optional(),
        internalNotes: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const result = await updateCustomerSettings(retailerId, customerId, data);
      res.json({ success: true, settings: result });
    } catch (error: any) {
      logger.error("Failed to update customer settings", { error: error.message });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/my-profile
 * Get retailer profile/settings information.
 */
router.get(
  "/my-profile",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const retailerId = (req as any).retailer.id;
      const profile = await getRetailerById(retailerId);
      res.json({ success: true, profile });
    } catch (error: any) {
      logger.error("Failed to get retailer profile", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PATCH /api/pos/my-profile
 * Update retailer profile/settings.
 */
router.patch(
  "/my-profile",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const retailerId = (req as any).retailer.id;
      const schema = z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        logoUrl: z.string().url().optional(),
        walletPhone: z.string().optional(), // validated against verified phone below
        preferences: z.object({
          cashiers: z.array(z.object({
            id: z.string(),
            name: z.string(),
            pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
            isActive: z.boolean().default(true),
          })).optional(),
          theme: z.string().optional(),
          language: z.string().optional(),
          currency: z.string().optional(),
          posConfig: z.object({
            autoSync: z.boolean().optional(),
            requireReceipts: z.boolean().optional(),
          }).optional(),
          posNotifications: z.object({
            stolenAlert: z.boolean().optional(),
            dailySummary: z.boolean().optional(),
            lowStock: z.boolean().optional(),
          }).optional(),
        }).optional(),
      });

      const { preferences, ...rest } = schema.parse(req.body);

      // Wallet phone must match the retailer user's verified phone to prevent payout redirection
      if (rest.walletPhone) {
        const sessionUser = (req as any).user;
        const linkedUser = await storage.getUser(sessionUser?.id ?? (req as any).retailer.userId);
        if (!linkedUser?.phoneNumber || linkedUser.phoneNumber !== rest.walletPhone) {
          return res.status(400).json({
            message: "walletPhone must match your verified account phone number."
          });
        }
      }

      const updated = await updateRetailer(retailerId, rest);
      
      if (!updated) {
        return res.status(404).json({ message: "Retailer not found" });
      }

      // If preferences are provided, update the linked user record
      if (preferences) {
        const retailer = (req as any).retailer;
        // Cashier PINs are a lightweight client-side terminal lock (not a
        // security credential). Store them as-is so the POS terminal can
        // compare them with a plain === check without a server round-trip.
        logger.info("Updating user preferences for retailer", {
          retailerId,
          userId: retailer.userId,
          cashierCount: preferences.cashiers?.length,
        });
        await storage.updateUser(retailer.userId, { preferences: preferences as any });
      }

      res.json({ success: true, profile: updated });
    } catch (error: any) {
      logger.error("Failed to update retailer profile", { error: error.message });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════
// COMMISSION ENDPOINTS
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/pos/my-commissions
 * Get paginated commission history for the current retailer.
 */
router.get(
  "/my-commissions",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const retailerId = (req as any).retailer.id;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const result = await CommissionService.getCommissionHistory(retailerId, { page, limit });
      res.json({ success: true, ...result });
    } catch (error: any) {
      logger.error("Failed to get commission history", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /api/pos/my-commissions/:id/queue
 * Request a payout for a pending commission (Retailer action).
 */
router.post(
  "/my-commissions/:id/queue",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const commissionId = parseInt(req.params.id, 10);
      const commission = await CommissionService.queuePayout(commissionId, (req as any).retailer.id);
      res.json({ success: true, commission });
    } catch (error: any) {
      logger.error("Failed to queue commission payout", { error: error.message });
      const status = error.status || 500;
      res.status(status).json({ message: error.message || "Internal server error" });
    }
  }
);

/**
 * POST /api/pos/my-commissions/:id/pay
 * Process a queued commission via PawaPay (Admin only).
 */
router.post(
  "/my-commissions/:id/pay",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const commissionId = parseInt(req.params.id, 10);
      const commission = await CommissionService.processPayout(commissionId);
      res.json({ success: true, commission });
    } catch (error: any) {
      logger.error("Failed to process commission payout", { error: error.message });
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/admin/commissions
 * Admin: list all commissions across all retailers with retailer name.
 */
router.get(
  "/admin/commissions",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const page  = parseInt(req.query.page  as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 25;
      const status = req.query.status as string | undefined;
      const result = await CommissionService.getAllCommissions({ page, limit, status });
      res.json({ success: true, ...result });
    } catch (error: any) {
      logger.error("Failed to list all commissions", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PATCH /api/pos/admin/commissions/:id
 * Admin: update commission status (e.g. mark as paid after manual MoMo transfer).
 */
router.patch(
  "/admin/commissions/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const commissionId = parseInt(req.params.id, 10);
      if (isNaN(commissionId)) {
        return res.status(400).json({ message: "Invalid commission ID" });
      }
      const schema = z.object({
        status: z.enum(["pending", "queued", "processing", "paid", "failed"]),
      });
      const { status } = schema.parse(req.body);
      const commission = await CommissionService.updateCommissionStatus(commissionId, status);
      res.json({ success: true, commission });
    } catch (error: any) {
      logger.error("Failed to update commission status", { error: error.message });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(error.status || 500).json({ message: error.message || "Internal server error" });
    }
  }
);


/**
 * GET /api/pos/security-alerts
 * Get all security alerts for the current retailer.
 */
router.get(
  "/security-alerts",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const retailer = (req as any).retailer;
      const alerts = await getRetailerSecurityAlerts(retailer.id);
      res.json({ success: true, alerts });
    } catch (error: any) {
      logger.error("getRetailerSecurityAlerts failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /api/pos/my-key/regenerate
 * Regenerate API key for the current retailer.
 */
router.post(
  "/my-key/regenerate",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const retailer = (req as any).retailer;
      const updated = await regenerateApiKey(retailer.id);
      if (!updated) {
        return res.status(404).json({ message: "Retailer not found" });
      }
      res.json({ success: true, retailer: updated });
    } catch (error: any) {
      logger.error("regenerateApiKey failed for retailer", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════
// PRODUCT MANAGEMENT ENDPOINTS (Dual auth: session or API key)
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/pos/inventory/search
 * Look up a single product by serial number, scoped to the current retailer.
 * Used by the POS terminal for serial validation before transfer.
 * Query params: serialNumber (required)
 */
router.get(
  "/inventory/search",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const retailer = (req as any).retailer;
      const serialNumber = (req.query.serialNumber as string)?.trim();
      if (!serialNumber) {
        return res.status(400).json({ message: "serialNumber query param is required" });
      }

      const product = await getPosProductBySerial(serialNumber);
      if (!product || product.retailerId !== retailer.id) {
        return res.status(404).json({ message: "Product not found in your inventory" });
      }

      res.json({ success: true, product });
    } catch (error: any) {
      logger.error("inventory/search failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/my-products/search
 * Search and filter retailer products with pagination.
 * Query params: search, category, status, page (default 1), limit (default 20)
 */
router.get(
  "/my-products/search",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const retailer = (req as any).retailer;
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const search = (req.query.search as string) || undefined;
      const category = (req.query.category as string) || undefined;
      const status = (req.query.status as string) || undefined;

      const result = await searchRetailerProducts(retailer.id, {
        page,
        limit,
        search,
        category,
        status,
      });

      res.json({ success: true, ...result });
    } catch (error: any) {
      logger.error("searchRetailerProducts failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/products/:productId
 * Get a single product detail, scoped to the current retailer.
 */
router.get(
  "/products/:productId",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.productId, 10);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const retailer = (req as any).retailer;
      const product = await getProductById(productId, retailer.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ success: true, product });
    } catch (error: any) {
      logger.error("getProductById failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/products/:productId/history-paginated
 * Get paginated ownership history for a product.
 * Query params: page (default 1), limit (default 20)
 */
router.get(
  "/products/:productId/history-paginated",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.productId, 10);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await getProductById(productId, (req as any).retailer.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

      const result = await getProductHistoryPaginated(productId, { page, limit });
      res.json({ success: true, ...result });
    } catch (error: any) {
      logger.error("getProductHistoryPaginated failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PATCH /api/pos/products/:productId/archive
 * Archive a product. Only for registered or transferred products.
 */
router.patch(
  "/products/:productId/archive",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.productId, 10);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const retailer = (req as any).retailer;
      const product = await archiveProduct(productId, retailer.id);

      res.json({ success: true, product });
    } catch (error: any) {
      logger.error("archiveProduct failed", { error: error.message });
      const status = error.status || 500;
      res.status(status).json({ message: error.message || "Internal server error" });
    }
  }
);

/**
 * POST /api/pos/products/:productId/report-stolen
 * Report a product as stolen. Creates a stolen_report ledger entry.
 */
router.post(
  "/products/:productId/report-stolen",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.productId, 10);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const retailer = (req as any).retailer;
      const notes = req.body.notes as string | undefined;
      const product = await reportProductStolen(productId, retailer.id, notes);

      res.json({ success: true, product });
    } catch (error: any) {
      logger.error("reportProductStolen failed", { error: error.message });
      const status = error.status || 500;
      res.status(status).json({ message: error.message || "Internal server error" });
    }
  }
);

/**
 * POST /api/pos/products/:productId/recover
 * Recover a stolen product. Only for products with status 'stolen'.
 */
router.post(
  "/products/:productId/recover",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.productId, 10);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const retailer = (req as any).retailer;
      const notes = req.body.notes as string | undefined;
      const product = await recoverProduct(productId, retailer.id, notes);

      res.json({ success: true, product });
    } catch (error: any) {
      logger.error("recoverProduct failed", { error: error.message });
      const status = error.status || 500;
      res.status(status).json({ message: error.message || "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════
// RETAILER SELF-ONBOARDING (Session auth - any authenticated user)
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/pos/pending-status
 * Check approval status for a pending retailer application.
 * Uses session auth (not API key) — accessible before the retailer is approved.
 */
router.get(
  "/pending-status",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const retailer = await getRetailerByUserId(user.id);
      if (!retailer) {
        return res.status(404).json({ message: "No retailer application found." });
      }
      res.json({
        success: true,
        status: retailer.status,
        businessName: retailer.name,
        pendingApproval: retailer.status === "inactive",
      });
    } catch (error: any) {
      logger.error("pending-status check failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /api/pos/onboard
 * Self-registration for logged-in users to become a Retailer.
 */
router.post(
  "/onboard",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      const schema = z.object({
        name: z.string().min(2, "Business name is required"),
        email: z.string().email("Valid business email is required"),
        phone: z.string().optional(),
        address: z.string().optional(),
        businessType: z.enum([
          "Retailer", "Wholesaler", "InsuranceCompany", "EventOrganizer",
          "NGO", "GovernmentAgency", "TechCompany", "Other"
        ]).default("Retailer"),
      });

      const data = schema.parse(req.body);

      // Ensure the user doesn't already have a business profile
      const existingRetailer = await getRetailerByUserId(user.id);
      if (existingRetailer) {
        return res.status(409).json({ message: "You already have a business profile." });
      }

      const { businessType, ...coreData } = data;

      const retailer = await createRetailer({
        ...coreData,
        userId: user.id,
        subscriptionPlan: "basic",
        status: "inactive", // pending admin approval — role is not yet promoted
        metadata: { businessType },
      });

      // Role is promoted to Retailer only after admin approves via PATCH /api/pos/admin/retailers/:id

      // Email 1: Confirm receipt to the retailer (fire-and-forget)
      sendEmail({
        to: retailer.email,
        subject: "KIZERE — Your business application has been received",
        html: `<p>Hi ${retailer.name},</p>
<p>Thank you for applying to join KIZERE as a registered retailer. Your application has been received and is under review.</p>
<p><strong>What happens next:</strong></p>
<ul>
  <li>Our team will review your application within 24 hours.</li>
  <li>You will receive an email when your account is approved with your API key and getting-started guide.</li>
</ul>
<p>Questions? Reply to this email or contact us at <a href="mailto:hello@kizere.rw">hello@kizere.rw</a>.</p>
<p>— The KIZERE Team</p>`,
        text: `Hi ${retailer.name},\n\nYour business application has been received and is under review. We will review it within 24 hours and email you when it is approved.\n\nQuestions? Contact hello@kizere.rw\n\n— The KIZERE Team`,
      }).catch((err: Error) => logger.error("Failed to send retailer application receipt email", { error: err.message }));

      // Email 2: Alert admin of new application (fire-and-forget)
      const adminEmail = process.env.ADMIN_ALERT_EMAIL || "hello@kizere.rw";
      sendEmail({
        to: adminEmail,
        subject: `New retailer application — ${retailer.name}`,
        html: `<p>A new retailer has applied to join KIZERE.</p>
<table>
  <tr><td><strong>Business name:</strong></td><td>${retailer.name}</td></tr>
  <tr><td><strong>Email:</strong></td><td>${retailer.email}</td></tr>
  <tr><td><strong>Phone:</strong></td><td>${retailer.phone || "—"}</td></tr>
  <tr><td><strong>Business type:</strong></td><td>${(retailer.metadata as any)?.businessType || "Retailer"}</td></tr>
  <tr><td><strong>Application ID:</strong></td><td>#${retailer.id}</td></tr>
</table>
<p><a href="${process.env.APP_URL || "https://kizere.rw"}/admin/retailers">Review in admin panel →</a></p>`,
        text: `New retailer application: ${retailer.name} (${retailer.email}). Review at ${process.env.APP_URL || "https://kizere.rw"}/admin/retailers`,
      }).catch((err: Error) => logger.error("Failed to send admin retailer alert email", { error: err.message }));

      res.status(201).json({ success: true, retailer: safeRetailer(retailer), pendingApproval: true });
    } catch (error: any) {
      logger.error("Retailer self-onboarding failed", { error: error.message });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      const status = error.status || 500;
      res.status(status).json({ message: error.message || "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════
// ADMIN RETAILER MANAGEMENT ENDPOINTS (Session auth - Admin only)
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/pos/admin/retailers
 * List all retailers. Auth: Admin
 */
router.get(
  "/admin/retailers",
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      const list = await getRetailers();
      res.json({ success: true, retailers: list.map(safeRetailer) });
    } catch (error: any) {
      logger.error("getRetailers failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PATCH /api/pos/admin/retailers/:id/approve
 * Approve a pending retailer application — sets status to active and promotes user role.
 * Auth: Admin only
 */
router.patch(
  "/admin/retailers/:id/approve",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const retailer = await getRetailerById(id);
      if (!retailer) {
        return res.status(404).json({ message: "Retailer not found" });
      }
      const updated = await updateRetailer(id, { status: "active" });
      await storage.updateUserRole(retailer.userId, "Retailer");

      // Email 3: Notify retailer of approval with API key and getting-started links (fire-and-forget)
      const appUrl = process.env.APP_URL || "https://kizere.rw";
      sendEmail({
        to: retailer.email,
        subject: "KIZERE — Your business account is approved 🎉",
        html: `<p>Hi ${retailer.name},</p>
<p>Congratulations! Your KIZERE business account has been approved. You can now start registering product ownership at point of sale.</p>
<p><strong>Your API key:</strong></p>
<pre style="background:#f4f4f4;padding:12px;border-radius:4px;font-size:14px;">${updated?.apiKey || retailer.apiKey || "(see your settings page)"}</pre>
<p>Keep this key secret — it authenticates all POS terminal requests.</p>
<p><strong>Get started:</strong></p>
<ul>
  <li><a href="${appUrl}/pos-terminal">Open POS Terminal</a> — register your first product</li>
  <li><a href="${appUrl}/retailer/products">Manage Products</a> — bulk import your catalog</li>
  <li><a href="${appUrl}/retailer/settings">Settings</a> — view or regenerate your API key</li>
</ul>
<p>Welcome to the KIZERE network.</p>
<p>— The KIZERE Team</p>`,
        text: `Hi ${retailer.name},\n\nYour KIZERE business account has been approved!\n\nYour API key: ${updated?.apiKey || retailer.apiKey || "(see settings page)"}\n\nGet started:\n- POS Terminal: ${appUrl}/pos-terminal\n- Products: ${appUrl}/retailer/products\n- Settings: ${appUrl}/retailer/settings\n\n— The KIZERE Team`,
      }).catch((err: Error) => logger.error("Failed to send retailer approval email", { error: err.message }));

      res.json({ success: true, retailer: updated });
    } catch (error: any) {
      logger.error("approveRetailer failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/admin/retailers/:id
 * Get single retailer. Auth: Admin
 */
router.get(
  "/admin/retailers/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const retailer = await getRetailerById(id);
      if (!retailer) {
        return res.status(404).json({ message: "Retailer not found" });
      }
      res.json({ success: true, retailer: safeRetailer(retailer) });
    } catch (error: any) {
      logger.error("getRetailerById failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /api/pos/admin/retailers
 * Create new retailer. Auth: Admin
 */
router.post(
  "/admin/retailers",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        address: z.string().optional(),
        userId: z.number().int().positive("Linked user ID is required"),
        subscriptionPlan: z.string().optional().default("basic"),
        logoUrl: z.string().url().optional(),
        metadata: z.record(z.any()).optional(),
      });

      const data = schema.parse(req.body);
      const retailer = await createRetailer(data);

      res.status(201).json({ success: true, retailer });
    } catch (error: any) {
      logger.error("createRetailer failed", { error: error.message });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      const status = error.status || 500;
      res.status(status).json({ message: error.message || "Internal server error" });
    }
  }
);

/**
 * PATCH /api/pos/admin/retailers/:id
 * Update retailer details. Auth: Admin
 */
router.patch(
  "/admin/retailers/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const schema = z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        logoUrl: z.string().optional(),
        subscriptionPlan: z.string().optional(),
        metadata: z.record(z.unknown()).optional(),
      });
      const safeData = schema.parse(req.body);
      const updated = await updateRetailer(id, safeData);
      if (!updated) {
        return res.status(404).json({ message: "Retailer not found" });
      }
      res.json({ success: true, retailer: updated });
    } catch (error: any) {
      logger.error("updateRetailer failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /api/pos/admin/retailers/:id/regenerate-key
 * Regenerate API key for a retailer. Auth: Admin
 */
router.post(
  "/admin/retailers/:id/regenerate-key",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await regenerateApiKey(id);
      if (!updated) {
        return res.status(404).json({ message: "Retailer not found" });
      }
      res.json({ success: true, retailer: updated });
    } catch (error: any) {
      logger.error("regenerateApiKey failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PATCH /api/pos/admin/retailers/:id/subscription
 * Manually set or extend a retailer's subscription.
 * Body: { expiresAt: ISO date string } — absolute expiry date.
 * Auth: Admin
 */
router.patch(
  "/admin/retailers/:id/subscription",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid retailer ID" });
      }

      const schema = z.object({
        expiresAt: z.string().datetime({ message: "expiresAt must be an ISO 8601 date string" }),
      });
      const { expiresAt } = schema.parse(req.body);

      const retailer = await storage.getRetailer(id);
      if (!retailer) {
        return res.status(404).json({ message: "Retailer not found" });
      }

      const updated = await storage.updateRetailer(id, {
        subscriptionExpiresAt: new Date(expiresAt),
        subscriptionPaidAt: new Date(),
      });

      logger.info("Admin manually updated retailer subscription", {
        adminId: (req as any).user?.id,
        retailerId: id,
        expiresAt,
      });

      res.json({ success: true, retailer: updated });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      logger.error("Admin subscription update failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/admin/retailers/:id/products
 * Get products registered by a retailer. Auth: Admin
 */
router.get(
  "/admin/retailers/:id/products",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const products = await getRetailerProducts(id);
      res.json({ success: true, products });
    } catch (error: any) {
      logger.error("getRetailerProducts failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════
// OWNER PRODUCTS ENDPOINT (Session auth - any authenticated user)
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/pos/owner-products
 * Get all POS products owned by the current user.
 */
router.get(
  "/owner-products",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const products = await getOwnerProducts(user.id);
      res.json({ success: true, products });
    } catch (error: any) {
      logger.error("getOwnerProducts failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════
// CLAIM ACCOUNT ENDPOINTS (Public)
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/pos/claim/request-otp
 * Request OTP to claim a POS stub account.
 */
router.post(
  "/claim/request-otp",
  posClaimLimiter,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        nationalId: z.string().min(6),
        phone: z.string(),
      });
      const data = schema.parse(req.body);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.nationalId, data.nationalId))
        .limit(1);

      // Use a generic message to prevent national ID enumeration
      if (!user || !isPosStubAccount(user.email)) {
        return res.status(400).json({ message: "Unable to send OTP. Check your national ID or contact support." });
      }

      // Always send OTP to the phone on record, never to a caller-supplied number
      const destination = user.phoneNumber;
      if (!destination) {
        return res.status(400).json({ message: "No phone number on file for this account. Contact support." });
      }

      const result = await sendOTP(user.id, "sms", "phone_verify", destination);

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.json({ success: true, message: "OTP sent" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /api/pos/claim/verify
 * Verify OTP, set new password, and claim account.
 */
router.post(
  "/claim/verify",
  posClaimLimiter,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        nationalId: z.string().min(6),
        phone: z.string(),
        otp: z.string().length(6),
        newPassword: z.string().min(8),
        email: z.string().email().optional(),
      });
      const data = schema.parse(req.body);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.nationalId, data.nationalId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "Account not found" });
      }

      const verifyResult = await verifyOTP(user.id, data.otp, "phone_verify");
      if (!verifyResult.valid) {
        return res.status(400).json({ message: verifyResult.message });
      }

      const hashedPassword = await bcrypt.hash(data.newPassword, 10);

      // Only update password and verification status — never overwrite phone/email
      // with caller-supplied values, as that would allow account hijacking
      await db
        .update(users)
        .set({
          password: hashedPassword,
          verificationStatus: "verified",
        })
        .where(eq(users.id, user.id));

      res.json({ success: true, message: "Account successfully claimed" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/admin/analytics
 * Get POS analytics data. Auth: Admin
 */
router.get(
  "/admin/analytics",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const analytics = await getPosAnalytics(startDate, endDate);
      res.json({ success: true, analytics });
    } catch (error: any) {
      logger.error("getPosAnalytics failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ─── Platform Settings (admin) ───────────────────────────────────────────────

/**
 * GET /api/pos/admin/platform-settings
 * List all platform settings. Auth: Admin
 */
router.get(
  "/admin/platform-settings",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const settings = await PlatformSettingsService.listSettings();
      res.json({ success: true, settings });
    } catch (error: any) {
      logger.error("listPlatformSettings failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PUT /api/pos/admin/platform-settings/:key
 * Create or update a platform setting. Auth: Admin
 * Body: { value: string, description?: string }
 */
router.put(
  "/admin/platform-settings/:key",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const schema = z.object({
        value: z.string().min(1, "value is required"),
        description: z.string().optional(),
      });
      const { value, description } = schema.parse(req.body);
      await PlatformSettingsService.setSetting(key, value, req.user!.id, description);
      const updated = await PlatformSettingsService.listSettings();
      res.json({ success: true, settings: updated });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      logger.error("upsertPlatformSetting failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ─── Ownership Certificates ───────────────────────────────────────────────────

/**
 * GET /api/pos/certificates/:code
 * Public endpoint — look up an ownership certificate by its unique code.
 * Used by the QR code printed on the certificate.
 */
router.get(
  "/certificates/:code",
  async (req: Request, res: Response) => {
    try {
      const cert = await storage.getOwnershipCertificateByCode(req.params.code);
      if (!cert) {
        return res.status(404).json({ success: false, message: "Certificate not found" });
      }

      // Return the certificate plus the generated HTML so the client can render it
      const item = await storage.getItem(cert.itemId);
      if (!item) {
        return res.status(404).json({ success: false, message: "Associated item not found" });
      }
      const owner = await storage.getUser(cert.userId);
      if (!owner) {
        return res.status(404).json({ success: false, message: "Associated owner not found" });
      }

      const html = await CertificateService.generateHtml(cert, item, owner);
      res.json({ success: true, certificate: cert, html });
    } catch (error: any) {
      logger.error("getCertificate failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/my-purchase-history
 * All ledger entries where the current user was the buyer (sale or transfer events).
 * Used by the buyer to view their purchased devices and access contracts.
 */
router.get(
  "/my-purchase-history",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const history = await getBuyerPurchaseHistory(user.id);
      res.json({ success: true, history });
    } catch (error: any) {
      logger.error("getBuyerPurchaseHistory failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/ledger/:ledgerId/contract-data
 * Returns all parties and device data needed to render the purchase contract PDF.
 * Accessible by: the retailer who processed the transaction, the buyer, the seller, or an Admin.
 */
async function contractDataAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"] as string | undefined;
  if (apiKey) {
    return requireRetailerApiKey(req, res, next);
  }
  if (!req.isAuthenticated?.()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const user = (req as any).user;
  // Retailer users: resolve their retailer record
  if (user.role === "Retailer") {
    try {
      const retailer = await getRetailerByUserId(user.id);
      if (retailer) (req as any).retailer = retailer;
    } catch (_) {}
  }
  next();
}

router.get(
  "/ledger/:ledgerId/contract-data",
  contractDataAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const ledgerId = parseInt(req.params.ledgerId, 10);
      if (isNaN(ledgerId)) return res.status(400).json({ message: "Invalid ledger ID" });

      const data = await getLedgerContractData(ledgerId);
      if (!data) return res.status(404).json({ message: "Ledger entry not found" });

      const retailer = (req as any).retailer;
      const user = (req as any).user;

      const isRetailerOwner = retailer && data.ledger.registeredBy === retailer.id;
      const isParty = user && (user.id === data.ledger.toUserId || user.id === data.ledger.fromUserId);
      const isAdmin = user && user.role === "Admin";

      if (!isRetailerOwner && !isParty && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      logger.error("getLedgerContractData failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * PUT /api/pos/ledger/:ledgerId/contract-data
 * Updates contract details, saving snapshots in ownership_ledger metadata, and updating
 * the product and buyer/seller profile records.
 */
router.put(
  "/ledger/:ledgerId/contract-data",
  contractDataAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const ledgerId = parseInt(req.params.ledgerId, 10);
      if (isNaN(ledgerId)) return res.status(400).json({ message: "Invalid ledger ID" });

      const data = await getLedgerContractData(ledgerId);
      if (!data) return res.status(404).json({ message: "Ledger entry not found" });

      const retailer = (req as any).retailer;
      const user = (req as any).user;

      const isRetailerOwner = retailer && data.ledger.registeredBy === retailer.id;
      const isParty = user && (user.id === data.ledger.toUserId || user.id === data.ledger.fromUserId);
      const isAdmin = user && user.role === "Admin";

      if (!isRetailerOwner && !isParty && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateSchema = z.object({
        seller: z.object({
          fullName: z.string().min(2, "Seller name must be at least 2 characters"),
          nationalId: z.string().min(6, "Seller National ID is required").optional().nullable(),
          phoneNumber: z.string().optional().nullable(),
          province: z.string().optional().nullable(),
          district: z.string().optional().nullable(),
          sector: z.string().optional().nullable(),
          cell: z.string().optional().nullable(),
          village: z.string().optional().nullable(),
        }).optional().nullable(),
        buyer: z.object({
          fullName: z.string().min(2, "Buyer name must be at least 2 characters"),
          nationalId: z.string().min(6, "Buyer National ID is required").optional().nullable(),
          phoneNumber: z.string().optional().nullable(),
          province: z.string().optional().nullable(),
          district: z.string().optional().nullable(),
          sector: z.string().optional().nullable(),
          cell: z.string().optional().nullable(),
          village: z.string().optional().nullable(),
        }).optional().nullable(),
        product: z.object({
          name: z.string().min(2, "Product name must be at least 2 characters"),
          brand: z.string().optional().nullable(),
          model: z.string().optional().nullable(),
          category: z.string().optional().nullable(),
          color: z.string().optional().nullable(),
          features: z.string().optional().nullable(),
          accessories: z.string().optional().nullable(),
        }).optional().nullable(),
        purchaseAgreement: z.string().optional().nullable(),
      });

      const body = updateSchema.parse(req.body);

      // 1. Update the ownership ledger entry metadata snapshots
      const existingMetadata = data.ledger.metadata || {};
      const updatedMetadata = {
        ...existingMetadata,
        sellerSnapshot: body.seller || {},
        buyerSnapshot: body.buyer || {},
        productSnapshot: body.product || {},
        accessories: body.product?.accessories || existingMetadata.accessories || "",
      };

      await storage.updateOwnershipLedgerEntry(ledgerId, {
        purchaseAgreement: body.purchaseAgreement || null,
        metadata: updatedMetadata,
        notes: body.product?.features || data.ledger.notes || null,
      });

      // 2. Update the POS product details if present
      if (data.product.id && body.product) {
        const existingProduct = await storage.getPosProduct(data.product.id);
        const updatedProductMetadata = {
          ...(existingProduct?.metadata || {}),
          color: body.product.color || "",
        };
        await storage.updatePosProduct(data.product.id, {
          name: body.product.name,
          brand: body.product.brand || null,
          model: body.product.model || null,
          category: body.product.category || "Other",
          metadata: updatedProductMetadata,
        });
      }

      // 3. Update the seller profile if present
      if (data.ledger.fromUserId && body.seller) {
        const sellerUser = await storage.getUser(data.ledger.fromUserId);
        if (sellerUser) {
          const updatedPrefs = {
            ...DEFAULT_USER_PREFERENCES,
            ...(sellerUser.preferences || {}),
            addressDetails: {
              ...(sellerUser.preferences?.addressDetails || {}),
              province: body.seller.province || "",
              district: body.seller.district || "",
              sector: body.seller.sector || "",
              cell: body.seller.cell || "",
              village: body.seller.village || "",
            }
          };
          await storage.updateUser(data.ledger.fromUserId, {
            fullName: body.seller.fullName,
            nationalId: body.seller.nationalId || sellerUser.nationalId,
            phoneNumber: body.seller.phoneNumber || sellerUser.phoneNumber,
            preferences: updatedPrefs,
          });
        }
      }

      // 4. Update the buyer profile if present
      if (data.ledger.toUserId && body.buyer) {
        const buyerUser = await storage.getUser(data.ledger.toUserId);
        if (buyerUser) {
          const updatedPrefs = {
            ...DEFAULT_USER_PREFERENCES,
            ...(buyerUser.preferences || {}),
            addressDetails: {
              ...(buyerUser.preferences?.addressDetails || {}),
              province: body.buyer.province || "",
              district: body.buyer.district || "",
              sector: body.buyer.sector || "",
              cell: body.buyer.cell || "",
              village: body.buyer.village || "",
            }
          };
          await storage.updateUser(data.ledger.toUserId, {
            fullName: body.buyer.fullName,
            nationalId: body.buyer.nationalId || buyerUser.nationalId,
            phoneNumber: body.buyer.phoneNumber || buyerUser.phoneNumber,
            preferences: updatedPrefs,
          });
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      logger.error("updateLedgerContractData failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);


/**
 * GET /api/pos/device-lookup?serial=XYZ
 * Retailer: look up any registered POS device by serial number to initiate a P2P transfer.
 * Returns product details + current owner name.
 */
router.get(
  "/device-lookup",
  posAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const serial = (req.query.serial as string | undefined)?.trim();
      if (!serial || serial.length < 3) {
        return res.status(400).json({ message: "Serial number is required (min 3 chars)" });
      }

      const product = await storage.getPosProductBySerial(serial);
      if (!product) {
        return res.json({ success: true, found: false });
      }
      if (product.status === "stolen") {
        return res.json({ success: true, found: true, stolen: true, message: "This device is flagged as stolen and cannot be transferred." });
      }
      if (product.status === "archived") {
        return res.json({ success: true, found: true, archived: true, message: "This device is archived." });
      }

      const owner = product.currentOwnerId ? await storage.getUser(product.currentOwnerId) : null;

      res.json({
        success: true,
        found: true,
        stolen: false,
        product: {
          id: product.id,
          name: product.name,
          serialNumber: product.serialNumber,
          category: product.category,
          status: product.status,
          currentOwnerId: product.currentOwnerId,
        },
        ownerName: owner?.fullName ?? null,
      });
    } catch (error: any) {
      logger.error("device-lookup failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * POST /api/pos/my-subscription/renew
 * Retailer self-service: initiate a PawaPay deposit for a 1-year subscription renewal.
 * Returns paymentId + transactionRef for the client to poll.
 */
router.post(
  "/my-subscription/renew",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const retailer = (req as any).retailer;
      const schema = z.object({
        phoneNumber: z.string().min(9, "Phone number required"),
        plan: z.enum(["basic", "standard", "premium", "enterprise"]).optional(),
      });
      const { phoneNumber, plan } = schema.parse(req.body);

      const subscriptionFee = await getPaymentAmount("retailer_subscription");
      if (!subscriptionFee) {
        return res.status(400).json({ message: "Subscription pricing not configured. Contact an admin." });
      }

      const depositId = generateDepositId();
      const payment = await storage.createPayment({
        userId: retailer.userId,
        type: "retailer_subscription",
        amount: String(subscriptionFee),
        currency: "RWF",
        status: "pending",
        transactionRef: depositId,
        posRetailerId: retailer.id,
        metadata: { retailerId: retailer.id, plan: plan ?? retailer.subscriptionPlan },
      });

      const depositResponse = await initiateDeposit({
        depositId,
        amount: subscriptionFee,
        currency: "RWF",
        phoneNumber,
        metadata: { paymentId: payment.id, type: "retailer_subscription" },
      });

      logger.info("Retailer subscription payment initiated", {
        retailerId: retailer.id,
        paymentId: payment.id,
        depositId,
      });

      res.json({
        success: true,
        paymentId: payment.id,
        transactionRef: depositId,
        amount: subscriptionFee,
        currency: "RWF",
        depositStatus: depositResponse.status,
      });
    } catch (error: any) {
      logger.error("Subscription renewal initiation failed", { error: error.message });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  }
);

/**
 * GET /api/pos/my-subscription
 * Returns the retailer's current subscription status.
 */
router.get(
  "/my-subscription",
  posAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const retailer = (req as any).retailer;
      const isActive = RetailerSubscriptionService.isSubscriptionActive(retailer);
      const daysLeft = retailer.subscriptionExpiresAt
        ? Math.max(0, Math.ceil((new Date(retailer.subscriptionExpiresAt).getTime() - Date.now()) / 86_400_000))
        : null;

      res.json({
        success: true,
        subscription: {
          plan: retailer.subscriptionPlan,
          expiresAt: retailer.subscriptionExpiresAt,
          paidAt: retailer.subscriptionPaidAt,
          isActive,
          daysLeft,
        },
      });
    } catch (error: any) {
      logger.error("getSubscription failed", { error: error.message });
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
