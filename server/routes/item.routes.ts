import { Router } from "express";
import { storage } from "../storage";
import { insertItemSchema } from "@shared/schema";
import { z } from "zod";
import { createLogger } from "../utils/logger";
import { OCRService } from "../services/ocr.service";
import { QRCodeService } from "../services/qrcode.service";
import { config } from "../config";
import { publicVerifyLimiter } from "../middleware/claim-rate-limit.middleware";

// Schema for updating an item - restricts fields that can be modified
const updateItemSchema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  details: z.record(z.any()).optional(),
});

const logger = createLogger('ItemRoutes');
const router = Router();

// Items API
router.get("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const items = await storage.getUserItems(userId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch items" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    if (isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const item = await storage.getItem(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Only allow access to own items unless Admin or Agent
    // Return 404 (not 403) to avoid revealing item existence to unauthorized users
    if (item.userId !== req.user!.id && !['Admin', 'Agent'].includes(req.user!.role)) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch item" });
  }
});

router.post("/", async (req, res) => {
  logger.info("Received item registration request", { body: req.body, user: req.user?.id });
  try {
    const isAdminOrAgent = ['Admin', 'Agent'].includes(req.user!.role);
    let targetUserId = req.user!.id;

    // Agent/Admin can register on behalf of another user
    if (isAdminOrAgent && (req.body.targetUserId || req.body.targetUserEmail)) {
      if (req.body.targetUserId) {
        targetUserId = parseInt(req.body.targetUserId);
      } else if (req.body.targetUserEmail) {
        const targetUser = await storage.getUserByEmail(req.body.targetUserEmail);
        if (!targetUser) {
          return res.status(404).json({ message: "Target user not found" });
        }
        targetUserId = targetUser.id;
      }
    } else {
      // Subscriber self-registration check
      const user = await storage.getUser(req.user!.id);
      if (user?.role === 'Subscriber' && user.verificationStatus !== 'approved') {
        return res.status(403).json({ 
          message: "Account Verification Required",
          description: "To maintain the security of the KIZERE registry, item registration is only available to verified profiles. Please complete your identity verification to continue.",
          code: "VERIFICATION_REQUIRED"
        });
      }
    }

    const validatedData = insertItemSchema.parse({
      ...req.body,
      userId: targetUserId
    });

    // Prevent duplicate unique identifiers
    const existingItem = await storage.getItemByUniqueIdentifier(validatedData.uniqueIdentifier);
    if (existingItem) {
      return res.status(400).json({ 
        message: "An item with this Serial Number / Unique Identifier is already registered in our system. Please contact support if you believe this is an error." 
      });
    }

    // Enforce image upload limits
    const { getUploadLimit } = await import("../config/payment.config");
    const limit = getUploadLimit(req.user);
    if (validatedData.imageUrls && validatedData.imageUrls.length > limit) {
      return res.status(400).json({
        message: `Image upload limit exceeded. Your current limit is ${limit} images.`
      });
    }

    const newItem = await storage.createItem(validatedData);

    // Phase 3: Trigger OCR for registered item
    if (newItem.imageUrls && newItem.imageUrls.length > 0) {
      OCRService.extractTextFromImage(newItem.imageUrls[0]).then(text => {
        if (text) {
          storage.updateItem(newItem.id, { ocrText: text });
        }
      }).catch(err => logger.error('OCR processing failed for item', { itemId: newItem.id, error: err }));
    }

    // Log the assisted registration if applicable
    if (isAdminOrAgent && targetUserId !== req.user!.id) {
       await storage.createUserActivityLog({
        userId: req.user!.id,
        action: 'assisted_item_registration',
        details: {
          itemId: newItem.id,
          targetUserId: targetUserId,
          itemIdentifier: newItem.uniqueIdentifier
        },
        ipAddress: (req.ip as string) || null,
        userAgent: req.headers['user-agent'] || null
      });
    }

    logger.info("Item created successfully", { itemId: newItem.id });
    res.status(201).json(newItem);
  } catch (error) {
    logger.error("Failed to create item", { error });
    if (error instanceof z.ZodError) {
      logger.warn("Validation error details", { errors: error.errors });
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    res.status(500).json({ message: "Failed to create item" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    if (isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const item = await storage.getItem(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Only allow updating own items unless Admin
    if (item.userId !== req.user!.id && req.user!.role !== 'Admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    const validation = updateItemSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid update data",
        errors: validation.error.errors
      });
    }

    const updatedItem = await storage.updateItem(itemId, validation.data);
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: "Failed to update item" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    if (isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const item = await storage.getItem(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Only allow deleting own items unless Admin
    if (item.userId !== req.user!.id && req.user!.role !== 'Admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    await storage.deleteItem(itemId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete item" });
  }
});

// Item Ownership Transfer API
router.post("/:id/transfer", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    if (isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const { recipientEmail } = req.body;
    if (!recipientEmail) {
      return res.status(400).json({ message: "Recipient email is required" });
    }

    const item = await storage.getItem(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.userId !== req.user!.id && req.user!.role !== 'Admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    const recipient = await storage.getUserByEmail(recipientEmail);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient user not found" });
    }

    const updatedItem = await storage.updateItem(itemId, { userId: recipient.id });

    // Create notification for recipient
    await storage.createNotification({
      userId: recipient.id,
      title: `New Item: ${item.name}`,
      message: `${req.user!.fullName || req.user!.username} has transferred ownership of ${item.name} to you.`,
      type: 'ownership_transfer',
      isRead: false,
      relatedItemId: itemId,
      relatedReportId: null
    });

    res.status(200).json({
      success: true,
      message: `Ownership transferred to ${recipientEmail}`,
      item: updatedItem
    });

  } catch (error) {
    logger.error("Transfer error:", error);
    res.status(500).json({ message: "Failed to transfer ownership" });
  }
});

/**
 * POST /api/items/:id/mark-found
 * Mark a lost item as found (recovered)
 */
router.post("/:id/mark-found", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const item = await storage.getItem(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Authorization: Only owner or admin can mark as found
    const isOwner = item.userId === req.user!.id;
    const isAdmin = ['Admin'].includes(req.user!.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (item.status !== 'Lost') {
      return res.status(400).json({ message: "Only lost items can be marked as found" });
    }

    // Find the associated lost report
    const { reports } = await storage.getReportsWithFilters({
      page: 1,
      limit: 1,
      itemId: id,
      type: 'lost',
      status: 'Open'
    });

    // Mark report as Resolved if it exists
    if (reports.length > 0) {
      await storage.updateReport(reports[0].id, { status: 'Resolved' });
    }

    // Update item status to Recovered
    const updatedItem = await storage.updateItem(id, { status: 'Recovered' });

    // Log the activity
    await storage.createUserActivityLog({
      userId: req.user!.id,
      action: 'item_recovered',
      details: {
        itemId: id,
        name: item.name,
        reportId: reports.length > 0 ? reports[0].id : null
      },
      ipAddress: (req.ip as string) || null,
      userAgent: req.headers['user-agent'] || null
    });

    logger.info('Item marked as found/recovered', {
      itemId: id,
      userId: req.user!.id,
      reportId: reports.length > 0 ? reports[0].id : null
    });

    res.json(updatedItem);
  } catch (error) {
    logger.error('Failed to mark item as found', { error: error });
    res.status(500).json({ message: "Failed to mark item as found" });
  }
});

/**
 * GET /api/items/:id/qrcode
 * Generate a QR code for the item's public verification page
 */
router.get("/:id/qrcode", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const item = await storage.getItem(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Only allow owner or admin to generate the QR code
    const isOwner = item.userId === req.user!.id;
    const isAdmin = ['Admin', 'Agent'].includes(req.user!.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const baseUrl = config.APP_URL;
    const verificationUrl = `${baseUrl}/verify/${item.uniqueIdentifier}`;
    
    // Support multiple formats via query param
    const format = req.query.format as string;
    
    if (format === 'svg') {
      const svg = await QRCodeService.generateSVG(verificationUrl);
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(svg);
    }
    
    const dataUrl = await QRCodeService.generateDataURL(verificationUrl);
    res.json({ dataUrl, verificationUrl });
  } catch (error) {
    logger.error('Failed to generate QR code', { error });
    res.status(500).json({ message: "Failed to generate QR code" });
  }
});

/**
 * GET /api/items/public/:uniqueIdentifier
 * Public endpoint to verify an item's registration status via QR code
 */
router.get("/public/:uniqueIdentifier", publicVerifyLimiter, async (req, res) => {
  try {
    const { uniqueIdentifier } = req.params;
    if (!uniqueIdentifier) {
      return res.status(400).json({ message: "Identifier required" });
    }

    // Check the lost-and-found items registry first
    const item = await storage.getItemByUniqueIdentifier(uniqueIdentifier);
    if (item) {
      if (item.status === 'Lost') {
        logger.warn('Stolen/lost item lookup via public verify', {
          identifier: uniqueIdentifier,
          itemId: item.id,
          status: item.status,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      return res.json({
        name: item.name,
        category: item.category,
        status: item.status,
        isRegistered: true,
        registeredAt: item.registeredAt,
        isFlagged: item.status === 'Lost',
        description: item.description,
        imageCount: item.imageUrls?.length || 0,
        source: 'registry',
      });
    }

    // Fall back to POS product registry (lookup by serial number)
    const posProduct = await storage.getPosProductBySerialWithRetailer(uniqueIdentifier);
    if (posProduct) {
      if (posProduct.status === 'stolen') {
        logger.warn('Stolen POS product lookup via public verify', {
          identifier: uniqueIdentifier,
          productId: posProduct.id,
          status: posProduct.status,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      return res.json({
        name: posProduct.name,
        category: posProduct.category || 'Product',
        status: posProduct.status,
        isRegistered: true,
        registeredAt: posProduct.registrationDate,
        isFlagged: posProduct.status === 'stolen',
        description: null,
        imageCount: 0,
        source: 'pos',
        retailerName: posProduct.retailerName,
      });
    }

    return res.status(404).json({
      message: "Item not found",
      description: "This item is not registered in the KIZERE global registry."
    });
  } catch (error) {
    logger.error('Public verification failed', { error });
    res.status(500).json({ message: "Verification service error" });
  }
});

export default router;
