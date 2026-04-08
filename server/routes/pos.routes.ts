import { Router, Request, Response, NextFunction } from "express";
import { requireRetailerApiKey } from "../middleware/retailer-auth.middleware";
import { posRateLimiter, requireFeature } from "../middleware/retailer-subscription.middleware";
import { requireAuth, requireRole, requireAdmin } from "../middleware/auth.middleware";
import {
  checkOrCreateCustomer,
  registerProduct,
  transferOwnership,
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
  bulkRegisterProducts,
  getRetailerSecurityAlerts,
  getRetailerTransactionsPaginated,
  getRetailerCustomersPaginated,
  reportProductStolen,
  getRetailerCustomerDetail,
  updateCustomerSettings,
  getOrCreateRetailerCustomerSettings,
} from "../services/pos.service";
import { createLogger } from "../utils/logger";
import { z } from "zod";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { sendOTP, verifyOTP } from "../services/otp.service";
import bcrypt from "bcrypt";
import { isPosStubAccount } from "../services/pos.service";
import { CommissionService } from "../services/commission.service";

const logger = createLogger("PosRoutes");
const router = Router();

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
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        nationalId: z.string().min(6, "National ID is required"),
        fullName: z.string().min(2, "Full name is required"),
        phone: z.string().optional().or(z.literal("")).transform(v => v === "" ? undefined : v),
        email: z.string().email().optional().or(z.literal("")).transform(e => e === "" ? undefined : e),
      });

      const data = schema.parse(req.body);
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
 * POST /api/pos/register
 * Register a new product and assign ownership.
 */
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
 * Transfer product ownership to a new customer.
 */
router.post(
  "/transfer",
  posAuthMiddleware, posRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        productId: z.number().int().positive("Valid product ID is required"),
        newOwnerId: z.number().int().positive("Valid new owner ID is required"),
        notes: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const retailer = (req as any).retailer;

      const result = await transferOwnership({
        productId: data.productId,
        newOwnerId: data.newOwnerId,
        retailerId: retailer.id,
        notes: data.notes,
      });

      res.json({
        success: true,
        product: result.product,
        ledger: result.ledgerEntry,
      });
    } catch (error: any) {
      logger.error("transfer failed", { error: error.message });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      const status = error.status || 500;
      res.status(status).json({ message: error.message || "Internal server error" });
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
      res.json({ success: true, stats, retailer });
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
      
      const result = await getRetailerTransactionsPaginated(retailerId, { page, limit });
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
        walletPhone: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const updated = await updateRetailer(retailerId, data);
      
      if (!updated) {
        return res.status(404).json({ message: "Retailer not found" });
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
      const commission = await CommissionService.queuePayout(commissionId);
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
      });

      const data = schema.parse(req.body);
      
      // Ensure the user doesn't already have a retailer profile
      const existingRetailer = await getRetailerByUserId(user.id);
      if (existingRetailer) {
        return res.status(409).json({ message: "You already have a retailer profile." });
      }

      // Create the retailer and update user role
      const retailer = await createRetailer({
        ...data,
        userId: user.id,
        subscriptionPlan: "basic", // Default plan for self-registration
      });

      res.status(201).json({ success: true, retailer });
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
      res.json({ success: true, retailers: list });
    } catch (error: any) {
      logger.error("getRetailers failed", { error: error.message });
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
      res.json({ success: true, retailer });
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
      const updated = await updateRetailer(id, req.body);
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

      if (!user) {
        return res.status(404).json({ message: "Account not found" });
      }

      if (!isPosStubAccount(user.email)) {
        return res.status(400).json({ message: "This account is already claimed or wasn't created via POS." });
      }

      // POS might have created the account with a different phone or no phone, but we must verify the provided phone
      // Let's send the OTP to the provided phone
      const result = await sendOTP(user.id, "sms", "phone_verify", data.phone);

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
      
      const updateData: any = {
        password: hashedPassword,
        verificationStatus: "verified",
        phoneNumber: data.phone,
      };

      if (data.email) {
        updateData.email = data.email;
      }

      await db
        .update(users)
        .set(updateData)
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

export default router;
