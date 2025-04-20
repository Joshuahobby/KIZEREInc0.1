import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertItemSchema, 
  insertReportSchema, 
  insertNotificationSchema,
  userRoles,
  initiatePaymentSchema
} from "@shared/schema";
import { 
  generateTransactionReference, 
  verifyTransaction, 
  verifyWebhookSignature,
  initializePayment,
  PAYMENT_FEES,
  getPaymentAmount
} from "./utils/flutterwave";

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

  // Google Authentication
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { email, name, uid, token, photoURL } = req.body;
      
      if (!email || !name || !uid) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      console.log("Processing Google authentication for:", email);
      
      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create a new user if not found
        user = await storage.createUser({
          fullName: name,
          username: email,
          email: email,
          password: `google_${uid}`, // We don't use this password for login
          role: 'Subscriber' // Default role for new users
        });
        console.log(`Created new user from Google auth: ${user.id}`);
      }
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Authentication failed" });
        }
        
        // Return user data without password
        const { password, ...userData } = user;
        return res.status(200).json(userData);
      });
    } catch (error) {
      console.error("Google auth error:", error);
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
      const users = await storage.getAllUsers();
      
      // Strip passwords before sending to client
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
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
      
      if (updatedUser) {
        // Strip password from response
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } else {
        res.status(500).json({ message: "Failed to update user role" });
      }
    } catch (error) {
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
      itemRegistration: PAYMENT_FEES.ITEM_REGISTRATION,
      lostItemReport: PAYMENT_FEES.LOST_ITEM_REPORT,
      foundItemReport: PAYMENT_FEES.FOUND_ITEM_REPORT,
      currency: "RWF"
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
      const amount = validatedData.amount || getPaymentAmount(validatedData.type);
      
      // Generate a unique transaction reference
      const transactionRef = generateTransactionReference();
      
      // Get user information
      const user = req.user!;
      
      // Create a payment record in pending status
      const payment = await storage.createPayment({
        userId: user.id,
        amount: amount.toString(),
        currency: "RWF",
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
        currency: "RWF",
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
        currency: "RWF",
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
      
      // Check if payment exists
      const payment = await storage.getPaymentByTransactionRef(transactionRef);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Only allow users to verify their own payments (or admins)
      if (payment.userId !== req.user!.id && req.user!.role !== 'Admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // If payment is already verified, return existing status
      if (payment.status === 'successful') {
        return res.status(200).json({
          status: payment.status,
          message: "Payment already verified",
          payment
        });
      }
      
      // If we have a Flutterwave transaction ID, verify the payment
      if (payment.transactionId) {
        try {
          const verificationResult = await verifyTransaction(payment.transactionId);
          
          // Update payment based on verification result
          const updatedPayment = await storage.updatePayment(payment.id, {
            status: verificationResult.data.status === 'successful' ? 'successful' : 'failed',
            flutterwaveRef: verificationResult.data.flw_ref,
            paymentDate: new Date()
          });
          
          // Return verification result
          return res.status(200).json({
            status: updatedPayment!.status,
            message: `Payment ${updatedPayment!.status}`,
            payment: updatedPayment
          });
        } catch (verifyError) {
          return res.status(500).json({
            status: 'error',
            message: 'Failed to verify payment with Flutterwave',
            error: verifyError instanceof Error ? verifyError.message : "Unknown error"
          });
        }
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'Payment has not been processed by Flutterwave yet'
        });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ 
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
          message: `Your payment of ${payment.amount} RWF for ${payment.type === 'registration' ? 'item registration' : 'lost item report'} has been ${data.status}.`,
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
      
      // If Flutterwave redirected with a transaction_id, update the payment
      if (transaction_id && tx_ref) {
        const payment = await storage.getPaymentByTransactionRef(tx_ref as string);
        if (payment) {
          // Update the payment with the transaction ID for future verification
          await storage.updatePayment(payment.id, {
            transactionId: transaction_id as string,
            status: status === 'successful' ? 'successful' : 'failed'
          });
        }
      }
      
      // Redirect to the frontend (which will handle success/failure UI)
      res.redirect(`/payment-status?status=${status}&tx_ref=${tx_ref}`);
    } catch (error) {
      // Redirect with error
      res.redirect(`/payment-status?status=error&message=${encodeURIComponent('Failed to process payment callback')}`);
    }
  });

  // Create the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
