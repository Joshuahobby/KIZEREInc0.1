import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { db } from "./db";
import { and, eq, like, or, sql, desc } from "drizzle-orm";
import { 
  insertItemSchema, 
  insertReportSchema, 
  insertNotificationSchema,
  userRoles,
  initiatePaymentSchema,
  items,
  reports
} from "@shared/schema";
import { 
  generateTransactionReference, 
  verifyTransaction, 
  verifyWebhookSignature,
  initializePayment,
  PAYMENT_FEES,
  getPaymentAmount
} from "./utils/flutterwave";
import { getPaymentDescription } from "./config/payment.config";
import { createLogger } from "./utils/logger";
import { DEFAULT_CURRENCY } from "./config/payment.config";
import { 
  format, 
  subDays, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear 
} from "date-fns";
// Import service layer
import { UserService } from "./services/user.service";
import { PaymentService } from "./services/payment.service";
import { dashboardService, DashboardService } from "./services/dashboard.service";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// We need hashPassword function in this file for Google auth simulation
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Create logger for routes
const logger = createLogger('Routes');

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
  
  if (req.user && req.user!.role !== 'Admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Google Authentication Status endpoint
  app.get("/api/auth/google/status", (req, res) => {
    res.json({
      status: "Available",
      message: "Google authentication is configured and ready",
      authenticated: req.isAuthenticated(),
      user: req.isAuthenticated() ? req.user : null
    });
  });
  
  // Google Authentication endpoint - this simulates OAuth consent flow
  app.get("/api/auth/google", async (req, res) => {
    try {
      // In a real implementation, this would redirect to Google OAuth consent screen
      // For now, we'll try to create or find a mock user in the database
      
      const email = "demo@example.com";
      
      // Check if mock user already exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create the mock user if it doesn't exist
        user = await storage.createUser({
          fullName: "Demo User",
          username: email,
          email: email,
          password: await hashPassword("google_auth_password"),
          phoneNumber: null,
          role: "Subscriber",
          avatarUrl: null
        });
        
        console.log("Created mock Google user:", user.id);
      } else {
        console.log("Found existing mock Google user:", user.id);
      }
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Authentication failed" });
        }
        
        console.log("Successfully logged in mock Google user:", user.id);
        
        // Redirect to the frontend
        res.redirect("/");
      });
    } catch (error: any) {
      console.error("Google auth simulation error:", error);
      res.status(500).json({ 
        message: "Authentication failed", 
        error: error.message || "Unknown error" 
      });
    }
  });
  
  // Google Authentication
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { email, name, uid, token, photoURL } = req.body;
      
      if (!email || !name || !uid) {
        logger.warn('Google auth missing required fields', { email });
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      console.log("Processing Google authentication for:", email);
      
      // Check if user exists using UserService
      let user = await UserService.getUserByEmail(email);
      
      if (!user) {
        // Create a new user if not found
        try {
          user = await UserService.createUser({
            fullName: name,
            username: email,
            email: email,
            password: `google_${uid}`, // We don't use this password for login
            phoneNumber: null,
            role: 'Subscriber', // Default role for new users
            avatarUrl: photoURL || null
          });
          logger.info('Created new user from Google auth', { userId: user.id, email });
        } catch (createError) {
          logger.error('Failed to create user from Google auth', { error: createError, email });
          return res.status(500).json({ message: "Failed to create user account" });
        }
      }
      
      // Update avatar URL if provided and different from what's stored
      if (user && photoURL && (!user.avatarUrl || user.avatarUrl !== photoURL)) {
        try {
          const updatedUser = await UserService.updateUser(user.id, { avatarUrl: photoURL });
          if (updatedUser) {
            user = updatedUser;
            logger.info('Updated user avatar from Google auth', { userId: user.id });
          }
        } catch (updateError) {
          logger.warn('Failed to update user avatar', { userId: user.id, error: updateError });
          // Non-critical error, continue with login
        }
      }
      
      // Log in the user
      if (!user) {
        logger.error('User is undefined after creation/lookup', { email });
        return res.status(500).json({ message: "Authentication failed" });
      }
      
      req.login(user, (err) => {
        if (err) {
          logger.error('Login error', { userId: user.id, error: err });
          return res.status(500).json({ message: "Authentication failed" });
        }
        
        // Return user data without password
        const { password, ...userData } = user;
        return res.status(200).json(userData);
      });
    } catch (error) {
      logger.error('Google auth error', { error });
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Items API
  app.get("/api/items", requireAuth, async (req, res) => {
    try {
      // After requireAuth middleware, req.user is guaranteed to exist
      const userId = req.user!.id;
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
      if (item.userId !== req.user!.id && !['Admin', 'Agent'].includes(req.user!.role)) {
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
        userId: req.user!.id
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
      if (item.userId !== req.user!.id && req.user!.role !== 'Admin') {
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
        reports = await storage.getUserReports(req.user!.id);
      }
      
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports", requireAuth, async (req, res) => {
    try {
      console.log("Received report data:", req.body);
      
      // Handle the date field with extra validation
      let reportDate;
      try {
        // In case the date is already a Date object or a valid ISO string
        reportDate = new Date(req.body.date);
        
        // Check if the date is valid
        if (isNaN(reportDate.getTime())) {
          reportDate = new Date(); // Default to current date if invalid
          console.log("Using default date due to invalid date input");
        }
      } catch (dateError) {
        reportDate = new Date(); // Default to current date on error
        console.log("Error parsing date, using default:", dateError);
      }
      
      // Create a new report object with the required data
      const reportData = {
        userId: req.user!.id,
        type: req.body.type || 'lost', // Default to 'lost' if missing
        title: req.body.title || 'Untitled Report', // Default title if missing
        description: req.body.description || 'No description provided', // Default description
        location: req.body.location || 'Unknown location', // Default location
        date: reportDate,
        contactInfo: req.body.contactInfo || null,
        itemId: req.body.itemId || null,
        status: 'Open'
      };

      console.log("Processed report data:", reportData);

      // Create the report
      const newReport = await storage.createReport(reportData);
      
      console.log("Report created successfully:", newReport);
      
      // Return success response
      res.status(201).json(newReport);
    } catch (error) {
      console.error("Report creation error:", error);
      
      // Provide more detailed error messages based on error type
      if (error instanceof Error) {
        res.status(500).json({ 
          message: "Failed to create report",
          error: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      } else {
        res.status(500).json({ 
          message: "Failed to create report",
          error: "Unknown error"
        });
      }
    }
  });

  // Notifications API
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user!.id);
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
      if (notification.userId !== req.user!.id) {
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
      logger.info('Admin requesting all users');
      // Use UserService to get all users
      const users = await UserService.getAllUsers();
      
      // Strip passwords before sending to client
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      logger.info('Successfully fetched all users for admin', { count: users.length });
      res.json(usersWithoutPasswords);
    } catch (error) {
      logger.error('Failed to fetch users for admin', { error });
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/users/:id/role", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        logger.warn('Invalid user ID provided for role update', { userId: req.params.id });
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const { role } = req.body;
      if (!role || !userRoles.includes(role)) {
        logger.warn('Invalid role provided for user update', { userId, role });
        return res.status(400).json({ message: "Invalid role" });
      }
      
      // Use UserService to get and update user
      const user = await UserService.getUserById(userId);
      if (!user) {
        logger.warn('User not found for role update', { userId });
        return res.status(404).json({ message: "User not found" });
      }
      
      logger.info('Updating user role', { userId, oldRole: user.role, newRole: role });
      const updatedUser = await UserService.updateUser(userId, { role });
      
      if (updatedUser) {
        // Strip password from response
        const { password, ...userWithoutPassword } = updatedUser;
        logger.info('User role updated successfully', { userId, role });
        res.json(userWithoutPassword);
      } else {
        logger.error('Failed to update user role - no user returned', { userId, role });
        res.status(500).json({ message: "Failed to update user role" });
      }
    } catch (error) {
      logger.error('Error updating user role', { error });
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Dashboard statistics
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
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

  // Payment routes
  app.get("/api/payments/fees", (req, res) => {
    // Return the payment fee structure
    res.json({
      itemRegistration: PAYMENT_FEES.REGISTRATION,
      lostItemReport: PAYMENT_FEES.LOST_REPORT,
      foundItemReport: PAYMENT_FEES.FOUND_REPORT,
      currency: DEFAULT_CURRENCY
    });
  });

  // Fetch user's payment history
  app.get("/api/payments", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const payments = await storage.getUserPayments(userId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch payment history",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Initialize a payment
  app.post("/api/payments/initialize", requireAuth, async (req, res) => {
    try {
      // Validate input
      const validatedData = initiatePaymentSchema.parse(req.body);
      
      // Get payment amount based on type if not explicitly provided
      let amount = validatedData.amount;
      
      if (!amount) {
        // If amount not provided, get the default amount for this payment type
        amount = getPaymentAmount(validatedData.type);
        
        // Log for debugging
        console.log(`Using default amount for ${validatedData.type}: ${amount} ${DEFAULT_CURRENCY}`);
        
        // Make sure we have a valid amount
        if (!amount || amount <= 0) {
          throw new Error(`Invalid payment amount for ${validatedData.type}`);
        }
      }
      
      // Generate a unique transaction reference
      const transactionRef = generateTransactionReference();
      
      // Get user information
      const user = req.user!;
      
      // Create a payment record in pending status
      const payment = await storage.createPayment({
        userId: user.id,
        amount: amount.toString(),
        currency: DEFAULT_CURRENCY,
        type: validatedData.type,
        status: "pending",
        transactionRef,
        itemId: validatedData.itemId || null,
        reportId: validatedData.reportId || null,
        metadata: validatedData.metadata || null
      });
      
      // Base redirect URL - the frontend will handle success/failure
      // Use the request origin or a default host
      const baseUrl = req.headers.origin || 
                     (process.env.NODE_ENV === 'production' 
                      ? 'https://kizere.replit.app' 
                      : 'http://localhost:5000');
      
      const redirectUrl = `${baseUrl}/payment-status`;
      
      // Initialize payment with Flutterwave
      const flutterwavePayment = await initializePayment({
        amount,
        currency: DEFAULT_CURRENCY,
        tx_ref: transactionRef,
        redirect_url: redirectUrl,
        customer: {
          email: user.email,
          phone_number: user.phoneNumber || undefined,
          name: user.fullName || user.username
        },
        customizations: {
          title: "KIZERE Payment",
          description: `Payment for ${validatedData.type === 'registration' ? 'item registration' : 'lost item report'}`,
          logo: "https://kizere.rw/logo.png" // Replace with your actual logo URL
        },
        meta: {
          paymentId: payment.id,
          ...validatedData.metadata
        }
      });
      
      // Return necessary data to the client
      res.status(200).json({
        paymentId: payment.id,
        transactionRef,
        amount,
        currency: DEFAULT_CURRENCY,
        // Extract payment link from Flutterwave response
        paymentUrl: flutterwavePayment.data && typeof flutterwavePayment.data === 'object' 
          ? (flutterwavePayment.data as any).link || null 
          : null,
        redirectUrl
      });
    } catch (error) {
      console.error("Payment initialization error:", error);
      res.status(500).json({ 
        message: "Failed to initialize payment",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Payment verification endpoint
  app.get("/api/payments/verify/:reference", requireAuth, async (req, res) => {
    try {
      const transactionRef = req.params.reference;
      
      console.log(`Verifying payment with reference: ${transactionRef}`);
      
      // Check if payment exists
      const payment = await storage.getPaymentByTransactionRef(transactionRef);
      if (!payment) {
        console.error(`Payment not found with reference: ${transactionRef}`);
        return res.status(404).json({ 
          status: 'error',
          message: "Payment not found" 
        });
      }
      
      // Only allow users to verify their own payments (or admins)
      if (payment.userId !== req.user!.id && req.user!.role !== 'Admin') {
        console.error(`Access denied for user ${req.user!.id} trying to verify payment ${payment.id} owned by user ${payment.userId}`);
        return res.status(403).json({ 
          status: 'error',
          message: "Access denied" 
        });
      }
      
      // If payment is already verified, return existing status
      if (payment.status === 'successful') {
        console.log(`Payment ${payment.id} already verified successfully`);
        return res.status(200).json({
          status: payment.status,
          message: "Payment already verified",
          payment
        });
      }
      
      // For testing or demo purposes, auto-verify in development 
      if ((process.env.NODE_ENV === 'development' || process.env.PAYMENT_AUTO_SUCCESS === 'true') && !payment.transactionId) {
        console.log(`Auto-verifying payment ${payment.id}`);
        
        // Create a mock transaction ID and approve the payment
        const mockTransactionId = `demo-tx-${Date.now()}`;
        const updatedPayment = await storage.updatePayment(payment.id, {
          status: 'successful',
          transactionId: mockTransactionId,
          flutterwaveRef: `demo-flw-${Date.now()}`,
          paymentDate: new Date()
        });
        
        // Also create a notification
        await storage.createNotification({
          userId: payment.userId,
          title: 'Payment Processed',
          message: `Your payment of ${payment.amount} ${DEFAULT_CURRENCY} for ${payment.type === 'registration' ? 'item registration' : 'lost item report'} has been processed successfully.`,
          type: 'payment',
          isRead: false,
          relatedItemId: payment.itemId,
          relatedReportId: payment.reportId
        });
        
        return res.status(200).json({
          status: 'successful',
          message: "Payment approved automatically",
          payment: updatedPayment
        });
      }
      
      // If we have a Flutterwave transaction ID, verify the payment
      if (payment.transactionId) {
        try {
          // Validate transaction ID - sometimes it might be stored but invalid
          if (!payment.transactionId || payment.transactionId.trim() === '' || 
              payment.transactionId.includes('demo-tx-')) {
            console.log(`Payment ${payment.id} has invalid transaction ID: ${payment.transactionId}`);
            
            // In development or when auto-success is enabled, approve automatically
            if (process.env.NODE_ENV === 'development' || process.env.PAYMENT_AUTO_SUCCESS === 'true') {
              console.log(`Auto-approving payment ${payment.id} in development mode`);
              const updatedPayment = await storage.updatePayment(payment.id, {
                status: 'successful',
                paymentDate: new Date()
              });
              
              return res.status(200).json({
                status: 'successful',
                message: "Payment auto-approved in development",
                payment: updatedPayment
              });
            }
            
            return res.status(400).json({
              status: 'pending',
              message: 'Invalid transaction ID, cannot verify with Flutterwave'
            });
          }
          
          console.log(`Verifying payment ${payment.id} with transaction ID ${payment.transactionId}`);
          const verificationResult = await verifyTransaction(payment.transactionId);
          
          console.log(`Verification result for payment ${payment.id}:`, verificationResult);
          
          // Update payment based on verification result
          const updatedPayment = await storage.updatePayment(payment.id, {
            status: verificationResult.data?.status === 'successful' ? 'successful' : 'failed',
            flutterwaveRef: verificationResult.data?.flw_ref || null,
            paymentDate: new Date()
          });
          
          // Return verification result
          return res.status(200).json({
            status: updatedPayment!.status,
            message: `Payment ${updatedPayment!.status}`,
            payment: updatedPayment
          });
        } catch (verifyError) {
          console.error(`Error verifying payment ${payment.id} with Flutterwave:`, verifyError);
          return res.status(500).json({
            status: 'error',
            message: 'Failed to verify payment with Flutterwave',
            error: verifyError instanceof Error ? verifyError.message : "Unknown error"
          });
        }
      } else {
        console.log(`Payment ${payment.id} has no transaction ID yet`);
        return res.status(400).json({
          status: 'pending',
          message: 'Payment has not been processed by Flutterwave yet'
        });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to verify payment",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Flutterwave webhook endpoint
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      // Verify webhook signature
      const signature = req.headers['verif-hash'] as string;
      if (!signature) {
        return res.status(400).json({ message: "No signature provided" });
      }
      
      // Verify the signature
      const isValid = verifyWebhookSignature(signature, JSON.stringify(req.body));
      if (!isValid) {
        return res.status(401).json({ message: "Invalid signature" });
      }
      
      // Process the webhook data
      const eventData = req.body;
      const { event, data } = eventData;
      
      // Handle different event types
      if (event === 'charge.completed') {
        // Find payment by transaction reference
        const payment = await storage.getPaymentByTransactionRef(data.tx_ref);
        if (!payment) {
          return res.status(404).json({ message: "Payment not found" });
        }
        
        // Update payment status based on webhook data
        await storage.updatePayment(payment.id, {
          status: data.status === 'successful' ? 'successful' : 'failed',
          transactionId: data.id.toString(),
          flutterwaveRef: data.flw_ref,
          paymentDate: new Date()
        });
        
        // Create notification for the user
        await storage.createNotification({
          userId: payment.userId,
          title: 'Payment Processed',
          message: `Your payment of ${payment.amount} ${DEFAULT_CURRENCY} for ${payment.type === 'registration' ? 'item registration' : 'lost item report'} has been ${data.status}.`,
          type: 'payment',
          isRead: false,
          relatedItemId: payment.itemId,
          relatedReportId: payment.reportId
        });
        
        // Return success response
        return res.status(200).json({ message: "Webhook processed successfully" });
      }
      
      // Return default response for unhandled events
      return res.status(200).json({ message: "Unhandled event type" });
    } catch (error) {
      console.error("Webhook processing error:", error);
      // Always return 200 to Flutterwave to avoid retries
      res.status(200).json({ 
        message: "Webhook processed with errors",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get payment history for the current user
  app.get("/api/payments/history", requireAuth, async (req, res) => {
    try {
      const payments = await storage.getUserPayments(req.user!.id);
      res.status(200).json(payments);
    } catch (error) {
      console.error("Payment history error:", error);
      res.status(500).json({ 
        message: "Failed to fetch payment history",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // ==== Admin Payment Dashboard API Endpoints ====
  
  // Get payment summary for admin dashboard
  app.get("/api/admin/payments/summary", requireAdmin, async (req, res) => {
    try {
      // Get all payments
      const allPayments = await storage.getAllPayments();
      
      // Calculate summary statistics
      const summary = {
        totalRevenue: 0,
        registrationRevenue: 0,
        lostReportRevenue: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        pendingTransactions: 0
      };
      
      // Process each payment
      for (const payment of allPayments) {
        // Only count successful payments for revenue
        if (payment.status === 'successful') {
          const amount = parseFloat(payment.amount);
          summary.totalRevenue += amount;
          
          if (payment.type === 'registration') {
            summary.registrationRevenue += amount;
          } else if (payment.type === 'lost_report') {
            summary.lostReportRevenue += amount;
          }
          
          summary.successfulTransactions++;
        } else if (payment.status === 'failed' || payment.status === 'cancelled') {
          summary.failedTransactions++;
        } else if (payment.status === 'pending') {
          summary.pendingTransactions++;
        }
      }
      
      res.status(200).json(summary);
    } catch (error) {
      console.error("Admin payment summary error:", error);
      res.status(500).json({ 
        message: "Failed to fetch payment summary",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get all payment transactions for admin dashboard with filtering, search, and pagination
  app.get("/api/admin/payments", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const type = req.query.type as string;
      const dateRange = req.query.dateRange as string;
      
      // Prepare date filters
      let dateFilter: { start: Date, end: Date } | null = null;
      
      if (dateRange) {
        const now = new Date();
        
        switch (dateRange) {
          case 'today':
            dateFilter = {
              start: startOfDay(now),
              end: endOfDay(now)
            };
            break;
            
          case 'yesterday':
            const yesterday = subDays(now, 1);
            dateFilter = {
              start: startOfDay(yesterday),
              end: endOfDay(yesterday)
            };
            break;
            
          case 'week':
            dateFilter = {
              start: startOfWeek(now, { weekStartsOn: 1 }),
              end: endOfWeek(now, { weekStartsOn: 1 })
            };
            break;
            
          case 'month':
            dateFilter = {
              start: startOfMonth(now),
              end: endOfMonth(now)
            };
            break;
            
          case 'year':
            dateFilter = {
              start: startOfYear(now),
              end: endOfYear(now)
            };
            break;
        }
      }
      
      // Get payments with filters
      const { payments, total } = await storage.getPaymentsWithFilters({
        page,
        pageSize,
        search,
        status,
        type,
        dateFilter
      });
      
      // For each payment, get the username
      const transactions = await Promise.all(payments.map(async (payment) => {
        const user = await storage.getUser(payment.userId);
        return {
          ...payment,
          username: user ? user.username : 'Unknown'
        };
      }));
      
      res.status(200).json({
        transactions,
        total
      });
    } catch (error) {
      console.error("Admin payments list error:", error);
      res.status(500).json({ 
        message: "Failed to fetch payment transactions",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Export payments as CSV
  app.get("/api/admin/payments/export", requireAdmin, async (req, res) => {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      const type = req.query.type as string;
      const dateRange = req.query.dateRange as string;
      
      // Prepare date filters (same as in the list endpoint)
      let dateFilter: { start: Date, end: Date } | null = null;
      
      if (dateRange) {
        const now = new Date();
        
        switch (dateRange) {
          case 'today':
            dateFilter = {
              start: startOfDay(now),
              end: endOfDay(now)
            };
            break;
            
          case 'yesterday':
            const yesterday = subDays(now, 1);
            dateFilter = {
              start: startOfDay(yesterday),
              end: endOfDay(yesterday)
            };
            break;
            
          case 'week':
            dateFilter = {
              start: startOfWeek(now, { weekStartsOn: 1 }),
              end: endOfWeek(now, { weekStartsOn: 1 })
            };
            break;
            
          case 'month':
            dateFilter = {
              start: startOfMonth(now),
              end: endOfMonth(now)
            };
            break;
            
          case 'year':
            dateFilter = {
              start: startOfYear(now),
              end: endOfYear(now)
            };
            break;
        }
      }
      
      // Get all payments with filters (no pagination)
      const { payments } = await storage.getPaymentsWithFilters({
        page: 1,
        pageSize: 1000000, // Large number to get all records
        search,
        status,
        type,
        dateFilter
      });
      
      // For each payment, get the username
      const transactions = await Promise.all(payments.map(async (payment) => {
        const user = await storage.getUser(payment.userId);
        return {
          ...payment,
          username: user ? user.username : 'Unknown'
        };
      }));
      
      // Create CSV content manually
      const headers = ["Transaction ID", "Reference", "User", "Amount", "Currency", "Type", "Status", "Date", "Created At"];
      
      // Function to escape CSV fields
      const escapeField = (field: string | number | null | undefined) => {
        if (field === null || field === undefined) return '';
        return `"${String(field).replace(/"/g, '""')}"`;
      };
      
      // Generate CSV rows
      const rows = transactions.map(tx => [
        escapeField(tx.id),
        escapeField(tx.transactionRef),
        escapeField(tx.username),
        escapeField(tx.amount),
        escapeField(tx.currency),
        escapeField(tx.type === 'registration' ? 'Item Registration' : 'Lost Item Report'),
        escapeField(tx.status),
        escapeField(tx.paymentDate ? new Date(tx.paymentDate).toISOString() : ''),
        escapeField(tx.createdAt ? new Date(tx.createdAt).toISOString() : '')
      ].join(','));
      
      // Combine headers and rows
      const csvContent = [headers.join(','), ...rows].join('\n');
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payment-transactions-${new Date().toISOString().split('T')[0]}.csv"`);
      
      // Send CSV content
      res.send(csvContent);
    } catch (error) {
      console.error("Admin payments export error:", error);
      res.status(500).json({ 
        message: "Failed to export payment transactions",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Process refund
  app.post("/api/admin/payments/refund/:id", requireAdmin, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      
      // Get the payment
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({
          message: "Payment not found"
        });
      }
      
      // Check if payment is in valid state for refund
      if (payment.status !== 'successful') {
        return res.status(400).json({
          message: "Only successful payments can be refunded"
        });
      }
      
      // In a real-world scenario, you would call the payment gateway's refund API here
      // For now, we'll just update the payment status
      const refundedPayment = await storage.updatePayment(paymentId, {
        status: 'refunded'
      });
      
      // Create a notification for the user
      await storage.createNotification({
        userId: payment.userId,
        title: 'Payment Refunded',
        message: `Your payment of ${payment.amount} ${payment.currency} has been refunded.`,
        type: 'payment',
        isRead: false,
        relatedItemId: payment.itemId,
        relatedReportId: payment.reportId
      });
      
      res.status(200).json({
        message: "Refund processed successfully",
        payment: refundedPayment
      });
    } catch (error) {
      console.error("Admin payment refund error:", error);
      res.status(500).json({ 
        message: "Failed to process refund",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get payment status by transaction reference
  app.get("/api/payments/status/:reference", requireAuth, async (req, res) => {
    try {
      const transactionRef = req.params.reference;
      
      // Check if payment exists
      const payment = await storage.getPaymentByTransactionRef(transactionRef);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Only allow users to view their own payments (or admins)
      if (payment.userId !== req.user!.id && req.user!.role !== 'Admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.status(200).json(payment);
    } catch (error) {
      console.error("Payment status error:", error);
      res.status(500).json({ 
        message: "Failed to fetch payment status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Payment callback endpoint (for redirect from Flutterwave)
  app.get("/api/payments/callback", async (req, res) => {
    try {
      const { status, tx_ref, transaction_id } = req.query;
      
      console.log("Payment callback received:", {
        status,
        tx_ref, 
        transaction_id,
        allParams: req.query
      });
      
      // If Flutterwave redirected with a transaction_id, update the payment
      if (tx_ref) {
        const payment = await storage.getPaymentByTransactionRef(tx_ref as string);
        
        if (payment) {
          console.log(`Found payment record with ID ${payment.id} for reference ${tx_ref}`);
          
          // Try to get transaction ID from different possible parameters
          const finalTransactionId = 
            transaction_id || 
            req.query.id || 
            req.query.transaction_id || 
            req.query.flw_ref;
            
          if (finalTransactionId) {
            console.log(`Updating payment ${payment.id} with transaction ID: ${finalTransactionId}`);
            
            // Update the payment with the transaction ID for future verification
            await storage.updatePayment(payment.id, {
              transactionId: finalTransactionId as string,
              status: status === 'successful' ? 'successful' : 
                      status === 'cancelled' ? 'cancelled' : 'pending'
            });
          } else {
            console.log(`No transaction ID found in callback for payment ${payment.id}`);
          }
        } else {
          console.log(`No payment found for reference ${tx_ref}`);
        }
      } else {
        console.log("No tx_ref in callback parameters");
      }
      
      // Redirect to the frontend (which will handle success/failure UI)
      res.redirect(`/payment-status?status=${status || 'unknown'}&tx_ref=${tx_ref || ''}`);
    } catch (error) {
      console.error("Payment callback error:", error);
      // Redirect with error
      res.redirect(`/payment-status?status=error&message=${encodeURIComponent('Failed to process payment callback')}`);
    }
  });

  // Admin API: Get user statistics
  app.get("/api/admin/users/stats", requireAdmin, async (req, res) => {
    try {
      // Get all users
      const allUsers = await storage.getAllUsers();
      
      // Calculate total users
      const totalUsers = allUsers.length;
      
      // Calculate new users this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const newUsersThisWeek = allUsers.filter(user => {
        return new Date(user.createdAt) >= oneWeekAgo;
      }).length;
      
      // Return the statistics
      res.json({
        totalUsers,
        newUsersThisWeek,
        subscriberCount: allUsers.filter(user => user.role === 'Subscriber').length,
        agentCount: allUsers.filter(user => user.role === 'Agent').length,
        adminCount: allUsers.filter(user => user.role === 'Admin').length
      });
    } catch (error) {
      console.error("User statistics error:", error);
      res.status(500).json({ 
        message: "Failed to fetch user statistics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Admin API: Get item statistics
  app.get("/api/admin/items/stats", requireAdmin, async (req, res) => {
    try {
      // Get all items using storage interface
      const allItems = await storage.getAllItems();
      
      // Calculate total items
      const totalItems = allItems.length;
      
      // Calculate new items this month
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const newItemsThisMonth = allItems.filter((item) => {
        return new Date(item.registeredAt) >= oneMonthAgo;
      }).length;
      
      // Return the statistics
      res.json({
        totalItems,
        newItemsThisMonth,
        registeredItems: allItems.filter((item) => item.status === 'Registered').length,
        lostItems: allItems.filter((item) => item.status === 'Lost').length,
        foundItems: allItems.filter((item) => item.status === 'Found').length
      });
    } catch (error) {
      console.error("Item statistics error:", error);
      res.status(500).json({ 
        message: "Failed to fetch item statistics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Admin API: Get report statistics
  app.get("/api/admin/reports/stats", requireAdmin, async (req, res) => {
    try {
      // Get lost and found reports using storage interface
      const lostReports = await storage.getLostReports();
      const foundReports = await storage.getFoundReports();
      const allReports = [...lostReports, ...foundReports];
      
      // Count open reports
      const openReports = allReports.filter((report) => report.status === 'Open').length;
      
      // Calculate change from last week (dummy calculation for now)
      const changeLastWeek = -8; // This would normally be calculated from historical data
      
      // Return the statistics
      res.json({
        openReports,
        changeLastWeek,
        totalReports: allReports.length,
        lostReports: lostReports.length,
        foundReports: foundReports.length,
        resolvedReports: allReports.filter((report) => report.status === 'Resolved').length
      });
    } catch (error) {
      console.error("Report statistics error:", error);
      res.status(500).json({ 
        message: "Failed to fetch report statistics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Admin API: Get payment summary statistics
  app.get("/api/admin/payments/summary", requireAdmin, async (req, res) => {
    try {
      // Get all payments
      const allPayments = await storage.getAllPayments();
      
      // Calculate summary statistics
      const totalRevenue = allPayments
        .filter(p => p.status === 'successful')
        .reduce((sum, p) => sum + Number(p.amount), 0);
        
      const registrationRevenue = allPayments
        .filter(p => p.status === 'successful' && p.type === 'registration')
        .reduce((sum, p) => sum + Number(p.amount), 0);
        
      const lostReportRevenue = allPayments
        .filter(p => p.status === 'successful' && p.type === 'lost_report')
        .reduce((sum, p) => sum + Number(p.amount), 0);
        
      // Count transactions by status
      const successfulTransactions = allPayments.filter(p => p.status === 'successful').length;
      const pendingTransactions = allPayments.filter(p => p.status === 'pending').length;
      const failedTransactions = allPayments.filter(p => p.status === 'failed').length;
      const cancelledTransactions = allPayments.filter(p => p.status === 'cancelled').length;
      const refundedTransactions = allPayments.filter(p => p.status === 'refunded').length;
      
      // Count by payment type
      const registrationCount = allPayments.filter(p => p.type === 'registration').length;
      const lostReportCount = allPayments.filter(p => p.type === 'lost_report').length;
      
      // Return the summary
      res.json({
        totalRevenue,
        registrationRevenue,
        lostReportRevenue,
        successfulTransactions,
        pendingTransactions,
        failedTransactions,
        cancelledTransactions,
        refundedTransactions,
        totalTransactions: allPayments.length,
        registrationCount,
        lostReportCount
      });
    } catch (error) {
      console.error("Payment summary error:", error);
      res.status(500).json({ 
        message: "Failed to fetch payment summary",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Admin API: Get paginated, filtered payment transactions
  app.get("/api/admin/payments", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const type = req.query.type as string;
      const dateRange = req.query.dateRange as string;
      
      // Parse date range
      let dateFilter: { start: Date, end: Date } | null = null;
      if (dateRange) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (dateRange) {
          case 'today':
            dateFilter = {
              start: today,
              end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
            };
            break;
          case 'yesterday':
            dateFilter = {
              start: new Date(today.getTime() - 24 * 60 * 60 * 1000),
              end: new Date(today.getTime() - 1)
            };
            break;
          case 'week':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            dateFilter = {
              start: startOfWeek,
              end: new Date(now.getTime())
            };
            break;
          case 'month':
            dateFilter = {
              start: new Date(now.getFullYear(), now.getMonth(), 1),
              end: new Date(now.getTime())
            };
            break;
          case 'year':
            dateFilter = {
              start: new Date(now.getFullYear(), 0, 1),
              end: new Date(now.getTime())
            };
            break;
          default:
            dateFilter = null;
        }
      }
      
      // Get payments with filters
      const result = await storage.getPaymentsWithFilters({
        page,
        pageSize,
        search,
        status,
        type,
        dateFilter
      });
      
      // Fetch usernames for each payment
      const paymentsWithUsernames = await Promise.all(
        result.payments.map(async (payment) => {
          const user = await storage.getUser(payment.userId);
          return {
            ...payment,
            username: user ? user.username : 'Unknown'
          };
        })
      );
      
      // Return the payments with pagination info
      res.json({
        transactions: paymentsWithUsernames,
        total: result.total,
        page,
        pageSize,
        totalPages: Math.ceil(result.total / pageSize)
      });
    } catch (error) {
      console.error("Admin payments listing error:", error);
      res.status(500).json({ 
        message: "Failed to fetch payment transactions",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Dashboard API
  // Get admin dashboard payment summary
  app.get("/api/admin/payments/summary", requireAdmin, async (req, res) => {
    try {
      const dashboardService = new DashboardService();
      const summaryData = await dashboardService.getAdminPaymentSummary();
      res.json(summaryData);
    } catch (error) {
      logger.error('Error fetching admin payment summary', { error });
      res.status(500).json({ 
        message: "Failed to fetch payment summary data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get user dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role as any; // TODO: Fix typing
      
      // Use the imported singleton instance of dashboardService
      const dashboardStats = await dashboardService.getUserDashboardStats(userId, userRole);
      res.json(dashboardStats);
    } catch (error) {
      logger.error('Error fetching user dashboard stats', { error, userId: req.user?.id });
      res.status(500).json({ 
        message: "Failed to fetch dashboard statistics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
