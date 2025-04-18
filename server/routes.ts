import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertItemSchema, 
  insertReportSchema, 
  insertNotificationSchema,
  userRoles
} from "@shared/schema";

// Middleware to check authentication
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Middleware to check admin role
function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user && req.user.role !== 'Admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Items API
  app.get("/api/items", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const items = await storage.getUserItems(userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/:id", requireAuth, async (req, res) => {
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
      if (item.userId !== req.user.id && !['Admin', 'Agent'].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.post("/api/items", requireAuth, async (req, res) => {
    try {
      const validatedData = insertItemSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const newItem = await storage.createItem(validatedData);
      res.status(201).json(newItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  app.put("/api/items/:id", requireAuth, async (req, res) => {
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
      if (item.userId !== req.user.id && req.user.role !== 'Admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedItem = await storage.updateItem(itemId, req.body);
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  app.delete("/api/items/:id", requireAuth, async (req, res) => {
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
      if (item.userId !== req.user.id && req.user.role !== 'Admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteItem(itemId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Item Ownership Transfer API
  app.post("/api/items/:id/transfer", requireAuth, async (req, res) => {
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
      if (item.userId !== req.user.id) {
        return res.status(403).json({ message: "You do not own this item" });
      }
      
      // Find recipient user by email
      const recipientUser = await storage.getUserByEmail(recipientEmail);
      if (!recipientUser) {
        return res.status(404).json({ message: "Recipient user not found" });
      }
      
      // Prevent self-transfer
      if (recipientUser.id === req.user.id) {
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
        message: `${req.user.fullName || req.user.username} has transferred ownership of ${item.name} to you.`,
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
      console.error("Transfer error:", error);
      res.status(500).json({ message: "Failed to transfer ownership" });
    }
  });

  // Search API
  app.get("/api/search", requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string || '';
      const filters: { category?: string; status?: string; location?: string } = {};
      
      if (req.query.category) {
        filters.category = req.query.category as string;
      }
      
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      
      if (req.query.location) {
        filters.location = req.query.location as string;
      }
      
      const results = await storage.searchItems(query, filters);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Lost and Found Reports API
  app.get("/api/reports", requireAuth, async (req, res) => {
    try {
      const type = req.query.type as string;
      
      let reports;
      if (type === 'lost') {
        reports = await storage.getLostReports();
      } else if (type === 'found') {
        reports = await storage.getFoundReports();
      } else {
        // Get user's reports by default
        reports = await storage.getUserReports(req.user.id);
      }
      
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports", requireAuth, async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const newReport = await storage.createReport(validatedData);
      
      // Create notification for found items (if the item was registered as lost)
      if (validatedData.type === 'found' && validatedData.itemId) {
        const item = await storage.getItem(validatedData.itemId);
        if (item && item.status === 'Lost') {
          await storage.createNotification({
            userId: item.userId,
            title: `Item Found: ${item.name}`,
            message: `Someone has reported finding your ${item.name}. Click to see details and contact information.`,
            type: 'item_found',
            isRead: false,
            relatedItemId: item.id,
            relatedReportId: newReport.id
          });
        }
      }
      
      res.status(201).json(newReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Notifications API
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const notification = await storage.getNotification(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Ensure users can only mark their own notifications as read
      if (notification.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // User Management API (Admin only)
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      // In a real database implementation, this would query all users
      // For in-memory storage, we'd need to expose a getAllUsers method
      // Mocking this for now
      const users = Array.from(new Array(10)).map((_, i) => ({
        id: i + 1,
        username: `user${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: userRoles[i % userRoles.length],
        fullName: `User ${i + 1}`,
        createdAt: new Date()
      }));
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/users/:id/role", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const { role } = req.body;
      if (!role || !userRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, { role });
      
      // Strip password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Dashboard statistics
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get user items
      const items = await storage.getUserItems(userId);
      
      // Count items by status
      const registeredItems = items.filter(item => item.status === 'Registered').length;
      const lostItems = items.filter(item => item.status === 'Lost').length;
      
      // Get reports by type
      const userReports = await storage.getUserReports(userId);
      const foundItems = userReports.filter(report => report.type === 'found').length;
      
      // Get unread notifications count
      const notifications = await storage.getUserNotifications(userId);
      const unreadNotifications = notifications.filter(notif => !notif.isRead).length;
      
      res.json({
        registeredItems,
        lostItems,
        foundItems,
        notifications: unreadNotifications
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
