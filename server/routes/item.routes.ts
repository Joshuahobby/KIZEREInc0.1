import { Router } from "express";
import { storage } from "../storage";
import { insertItemSchema } from "@shared/schema";
import { z } from "zod";
import { createLogger } from "../utils/logger";

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
    if (item.userId !== req.user!.id && !['Admin', 'Agent'].includes(req.user!.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch item" });
  }
});

router.post("/", async (req, res) => {
  logger.info("Received item registration request", { body: req.body, user: req.user?.id });
  try {
    const validatedData = insertItemSchema.parse({
      ...req.body,
      userId: req.user!.id
    });
    
    const newItem = await storage.createItem(validatedData);
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
    
    const updatedItem = await storage.updateItem(itemId, req.body);
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
    
    // Check if item exists
    const item = await storage.getItem(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    
    // Ensure user is the current owner of the item
    if (item.userId !== req.user!.id) {
      return res.status(403).json({ message: "You do not own this item" });
    }
    
    // Find recipient user by email
    const recipientUser = await storage.getUserByEmail(recipientEmail);
    if (!recipientUser) {
      return res.status(404).json({ message: "Recipient user not found" });
    }
    
    // Prevent self-transfer
    if (recipientUser.id === req.user!.id) {
      return res.status(400).json({ message: "Cannot transfer item to yourself" });
    }
    
    // Transfer ownership by updating the item's userId
    const updatedItem = await storage.updateItem(itemId, { 
      userId: recipientUser.id,
      updatedAt: new Date()
    });
    
    // Create notification for the recipient
    await storage.createNotification({
      userId: recipientUser.id,
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

export default router;
