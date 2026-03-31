import { Router, Request, Response, NextFunction } from "express";
import { requireRetailerApiKey } from "../middleware/retailer-auth.middleware";
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
} from "../services/pos.service";
import { createLogger } from "../utils/logger";
import { z } from "zod";

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
  posAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        nationalId: z.string().min(6, "National ID is required"),
        fullName: z.string().min(2, "Full name is required"),
        phone: z.string().optional(),
        email: z.string().email().optional(),
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
  posAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        serialNumber: z.string().min(3, "Serial number is required"),
        name: z.string().min(2, "Product name is required"),
        category: z.string().optional().default("Other"),
        sku: z.string().optional(),
        ownerId: z.number().int().positive("Valid owner ID is required"),
        metadata: z.record(z.any()).optional(),
      });

      const data = schema.parse(req.body);
      const retailer = (req as any).retailer;

      const result = await registerProduct({
        serialNumber: data.serialNumber,
        name: data.name,
        category: data.category,
        sku: data.sku,
        retailerId: retailer.id,
        ownerId: data.ownerId,
        metadata: data.metadata,
      });

      res.status(201).json({
        success: true,
        product: result.product,
        ledger: result.ledgerEntry,
      });
    } catch (error: any) {
      logger.error("register failed", { error: error.message });
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
  posAuthMiddleware,
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
  posAuthMiddleware,
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
  posAuthMiddleware,
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

export default router;
