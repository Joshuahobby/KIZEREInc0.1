import { Router } from "express";
import { storage } from "../storage";
import { insertCouponSchema } from "@shared/schema";
import { z } from "zod";
import { createLogger } from "../utils/logger";
import { CouponService } from "../services/coupon.service";
import { requireAdmin } from "../middleware/auth.middleware";

const logger = createLogger('CouponRoutes');
const router = Router();

// --- Admin Routes ---

// Get all coupons (Admin only)
router.get("/all", requireAdmin, async (req, res) => {
  try {
    const coupons = await storage.getAllCoupons();
    res.json(coupons);
  } catch (error) {
    logger.error('Failed to fetch all coupons', { error });
    res.status(500).json({ message: "Failed to fetch coupons" });
  }
});

// Get coupons with filters (Admin only)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const type = req.query.type as string;

    const result = await storage.getCouponsWithFilters({
      page,
      pageSize,
      search,
      status,
      type
    });

    res.json(result);
  } catch (error) {
    logger.error('Failed to fetch filtered coupons', { error });
    res.status(500).json({ message: "Failed to fetch coupons" });
  }
});

// Create a new coupon (Admin only)
router.post("/", requireAdmin, async (req, res) => {
  try {
    logger.info('Creating new coupon', { body: req.body });
    const validatedData = insertCouponSchema.parse(req.body);
    const newCoupon = await storage.createCoupon(validatedData);
    res.status(201).json(newCoupon);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Coupon validation error', { errors: error.errors, body: req.body });
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    logger.error('Failed to create coupon', { error, body: req.body });
    res.status(500).json({ message: "Failed to create coupon" });
  }
});

// Update a coupon (Admin only)
router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    // Validate and transform update data
    const validatedData = insertCouponSchema.partial().parse(req.body);
    const updatedCoupon = await storage.updateCoupon(id, validatedData);
    if (!updatedCoupon) return res.status(404).json({ message: "Coupon not found" });

    res.json(updatedCoupon);
  } catch (error) {
    logger.error('Failed to update coupon', { id: req.params.id, error });
    res.status(500).json({ message: "Failed to update coupon" });
  }
});

// Delete a coupon (Admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const deleted = await storage.deleteCoupon(id);
    if (!deleted) return res.status(404).json({ message: "Coupon not found" });

    res.status(204).end();
  } catch (error) {
    logger.error('Failed to delete coupon', { id: req.params.id, error });
    res.status(500).json({ message: "Failed to delete coupon" });
  }
});

// --- Public/Authenticated User Routes ---

// Validate a coupon (For users during checkout)
router.post("/validate", async (req, res) => {
  try {
    const { code, amount, type } = req.body;

    if (!code) return res.status(400).json({ message: "Coupon code is required" });
    if (!amount) return res.status(400).json({ message: "Amount is required" });
    if (!type) return res.status(400).json({ message: "Service type is required" });

    const validation = await CouponService.validateCoupon(
      code,
      req.user!.id,
      parseFloat(amount),
      type
    );

    if (!validation.isValid) {
      return res.status(400).json({ 
        isValid: false, 
        message: validation.message || 'Invalid coupon' 
      });
    }

    res.json({
      isValid: true,
      discountAmount: validation.discountAmount,
      finalAmount: validation.finalAmount,
      description: validation.coupon?.description,
      discountType: validation.coupon?.discountType,
      discountValue: validation.coupon?.discountValue
    });
  } catch (error) {
    logger.error('Coupon validation failed', { error });
    res.status(500).json({ message: "Failed to validate coupon" });
  }
});

export default router;
