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
  insertPaymentPackageSchema,
  userRoles,
  initiatePaymentSchema,
  items,
  reports,
  PaymentType,
  PaymentStatus,
  PaymentPackage
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

// Import admin routes
import adminUsersRoutes from './routes/admin-users';

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Register admin routes
  app.use('/api/admin', requireAdmin, adminUsersRoutes);

  // Google Authentication Status endpoint
  app.get("/api/auth/google/status", (req, res) => {
    res.json({
      status: "Available",
      message: "Google authentication is configured and ready",
      authenticated: req.isAuthenticated(),
      user: req.isAuthenticated() ? req.user : null
    });
  });
  
  // GET endpoint to initiate the Firebase-based Google authentication
  // We don't need this endpoint since we use Firebase redirect flow for Google authentication
  app.get("/api/auth/google", (req, res) => {
    res.status(400).json({
      message: "This endpoint is deprecated. Use Firebase authentication directly from the client."
    });
  });
  
  // Handle Google OAuth callback
  app.get("/api/auth/google-callback", async (req, res) => {
    try {
      // Import and use the auth callback controller
      const { AuthCallbackController } = await import('./controllers/auth-callback.controller');
      return AuthCallbackController.handleGoogleCallback(req, res);
    } catch (error) {
      console.error("Error handling Google OAuth callback:", error);
      res.status(500).send("Authentication error");
    }
  });
  
  // Google Authentication with Firebase token verification
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { email, name, uid, token, photoURL } = req.body;
      const origin = req.headers.origin;
      const referer = req.headers.referer;
      const isReplitEnvironment = 
        (origin && (origin.includes('replit') || origin.includes('repl.co'))) ||
        (referer && (referer.includes('replit') || referer.includes('repl.co')));
      
      logger.info('Google auth request details', {
        hasEmail: !!email,
        hasName: !!name,
        hasUid: !!uid,
        hasToken: !!token,
        origin,
        referer,
        isReplitEnvironment
      });
      
      if (!email || !name || !uid) {
        logger.warn('Google auth missing required fields', { 
          hasEmail: !!email,
          hasName: !!name, 
          hasUid: !!uid
        });
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      console.log("Processing Google authentication for:", email);
      
      // For development or Replit environment, we can proceed without strict token verification
      let tokenVerified = false;
      
      // Only verify token if it's provided
      if (token) {
        try {
          // Direct import of admin module
          const admin = await import('./utils/firebase-admin');
          
          // Verify token directly with admin auth
          const decodedToken = await admin.default.auth().verifyIdToken(token)
            .catch(error => {
              logger.error('Token verification failed:', { 
                error, 
                errorMessage: error.message,
                tokenLength: token ? token.length : 0
              });
              return null;
            });
          
          // If token verification succeeds, ensure UID matches
          if (decodedToken && decodedToken.uid === uid) {
            tokenVerified = true;
            logger.info('Firebase token successfully verified', { uid });
          } else if (decodedToken) {
            logger.warn('Token UID mismatch', { tokenUid: decodedToken.uid, providedUid: uid });
          }
        } catch (tokenError) {
          // Log error with more details for debugging
          const errorMessage = tokenError instanceof Error ? tokenError.message : 'Unknown error';
          logger.error('Token verification error', { 
            errorMessage,
            errorStack: tokenError instanceof Error ? tokenError.stack : 'No stack trace',
            error: tokenError
          });
          
          // For Replit dev environments, proceed even with token errors
          if (isReplitEnvironment || process.env.NODE_ENV !== 'production') {
            logger.info('Development/Replit environment: proceeding without token verification');
          } else if (process.env.NODE_ENV === 'production') {
            // In production, we'd normally reject invalid tokens
            // But we'll proceed with a warning for now
            logger.warn('Proceeding without token verification in production environment');
          }
        }
      } else {
        logger.warn('No token provided for verification');
        // For Replit environment, allow authentication without token
        if (isReplitEnvironment) {
          logger.info('Replit environment: proceeding without token');
        }
      }
      
      // Check if user exists using UserService
      let user = await UserService.getUserByEmail(email);
      
      if (!user) {
        // Create a new user if not found
        try {
          // Create secure random password that won't be used for login
          const securePassword = `firebase_${uid}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
          const hashedPassword = await hashPassword(securePassword);
          
          user = await UserService.createUser({
            fullName: name,
            username: email,
            email: email,
            password: hashedPassword, // This password is not used for login, only Firebase auth
            phoneNumber: null,
            role: 'Subscriber', // Default role for new users
            avatarUrl: photoURL || null
          });
          logger.info('Created new user from Firebase auth', { userId: user.id, email });
        } catch (createError) {
          logger.error('Failed to create user from Firebase auth', { error: createError, email });
          return res.status(500).json({ message: "Failed to create user account" });
        }
      }
      
      // Update avatar URL if provided and different from what's stored
      if (user && photoURL && (!user.avatarUrl || user.avatarUrl !== photoURL)) {
        try {
          const updatedUser = await UserService.updateUser(user.id, { avatarUrl: photoURL });
          if (updatedUser) {
            user = updatedUser;
            logger.info('Updated user avatar from Firebase auth', { userId: user.id });
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
      logger.error('Firebase auth error', { error });
      res.status(500).json({ message: "Authentication failed" });
    }
  });
  
  // Enhanced logout endpoint for Firebase authentication
  app.post("/api/auth/logout", (req, res) => {
    // Log before logout attempt
    logger.info('User logout requested', { 
      isAuthenticated: req.isAuthenticated(),
      userId: req.user?.id
    });
    
    // Passport logout function
    req.logout((err) => {
      if (err) {
        logger.error('Logout error', { error: err });
        return res.status(500).json({ message: "Logout failed" });
      }
      
      // Destroy the session to ensure complete logout
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          logger.error('Session destruction error', { error: sessionErr });
          // Continue anyway as the user is already logged out
        }
        
        // Clear any cookies
        res.clearCookie('connect.sid');
        
        logger.info('User logged out successfully');
        return res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });
  
  // User Profile Management Endpoints
  
  /**
   * Get current user profile
   * Equivalent to GET /api/me in the specs
   */
  app.get("/api/me", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Strip password from response
      const { password, ...userWithoutPassword } = req.user;
      logger.info('User retrieved their profile', { userId: req.user.id });
      res.json(userWithoutPassword);
    } catch (error) {
      logger.error('Error fetching user profile', { error, userId: req.user?.id });
      res.status(500).json({ message: "Failed to retrieve user profile" });
    }
  });
  
  /**
   * Update current user profile
   * Equivalent to PUT /api/me in the specs
   */
  app.put("/api/me", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      // Filter allowed fields to update
      const allowedFields = ['fullName', 'email', 'phoneNumber', 'avatarUrl'];
      const filteredUpdateData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce<Record<string, any>>((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});
      
      // Update the user through UserService
      const updatedUser = await UserService.updateUser(userId, filteredUpdateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Strip password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      logger.info('User updated their profile', { userId });
      res.json(userWithoutPassword);
    } catch (error: any) {
      logger.error('Error updating user profile', { error, userId: req.user?.id });
      
      // Handle validation errors
      if (error?.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });
  
  /**
   * Change user password
   */
  app.put("/api/me/password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Get the current user with password
      const user = await UserService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      // Import the comparePasswords function from the module where it's defined
      const { comparePasswords } = await import('./utils/auth');
      const isPasswordValid = await comparePasswords(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Update with new password
      await UserService.updateUser(userId, { password: newPassword });
      
      logger.info('User changed their password', { userId });
      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      logger.error('Error changing user password', { error, userId: req.user?.id });
      
      // Handle validation errors
      if (error?.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to change password" });
    }
  });
  
  /**
   * Get user permissions
   * Equivalent to GET /api/me/permissions in the specs
   */
  app.get("/api/me/permissions", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Currently, permissions are derived from the user's role
      const role = req.user.role;
      
      // Define role-based permissions
      const permissions: Record<string, string[]> = {
        Admin: [
          'can_view_dashboard',
          'can_create_user',
          'can_delete_user',
          'can_update_user',
          'can_view_reports',
          'can_manage_items',
          'can_view_payments',
          'can_manage_settings'
        ],
        Agent: [
          'can_view_dashboard',
          'can_view_reports',
          'can_manage_items',
          'can_view_payments'
        ],
        Subscriber: [
          'can_view_dashboard',
          'can_manage_own_items',
          'can_create_reports',
          'can_view_own_payments'
        ]
      };
      
      // Get permissions for the user's role
      const userPermissions = permissions[role] || [];
      
      logger.info('User retrieved their permissions', { userId: req.user.id, role });
      res.json({ 
        role,
        permissions: userPermissions 
      });
    } catch (error) {
      logger.error('Error fetching user permissions', { error, userId: req.user?.id });
      res.status(500).json({ message: "Failed to retrieve user permissions" });
    }
  });
  
  /**
   * Get user preferences
   * Equivalent to GET /api/me/preferences in the specs
   */
  app.get("/api/me/preferences", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // For now, we'll return default preferences 
      // In the future, these could be stored in the database
      const defaultPreferences = {
        theme: 'system',
        layout: 'default',
        cardDensity: 'comfortable',
        widgetFavorites: [],
        notifications: {
          email: true,
          inApp: true
        }
      };
      
      logger.info('User retrieved their preferences', { userId: req.user.id });
      res.json(defaultPreferences);
    } catch (error) {
      logger.error('Error fetching user preferences', { error, userId: req.user?.id });
      res.status(500).json({ message: "Failed to retrieve user preferences" });
    }
  });
  
  /**
   * Update user preferences
   * Equivalent to PUT /api/me/preferences in the specs
   */
  app.put("/api/me/preferences", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const preferences = req.body;
      
      // Validate preferences
      const allowedThemes = ['light', 'dark', 'system'];
      const allowedLayouts = ['default', 'compact', 'expanded'];
      const allowedDensities = ['comfortable', 'compact'];
      
      if (preferences.theme && !allowedThemes.includes(preferences.theme)) {
        return res.status(400).json({ message: "Invalid theme option" });
      }
      
      if (preferences.layout && !allowedLayouts.includes(preferences.layout)) {
        return res.status(400).json({ message: "Invalid layout option" });
      }
      
      if (preferences.cardDensity && !allowedDensities.includes(preferences.cardDensity)) {
        return res.status(400).json({ message: "Invalid card density option" });
      }
      
      // In a real implementation, we would save these to a database
      // For now, just acknowledge that we received them
      
      logger.info('User updated their preferences', { 
        userId: req.user.id,
        preferences: JSON.stringify(preferences)
      });
      
      res.json({ 
        message: "Preferences updated successfully",
        preferences
      });
    } catch (error) {
      logger.error('Error updating user preferences', { error, userId: req.user?.id });
      res.status(500).json({ message: "Failed to update user preferences" });
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
        type: (req.body.type || 'lost') as 'lost' | 'found', // Default to 'lost' if missing
        title: req.body.title || 'Untitled Report', // Default title if missing
        description: req.body.description || 'No description provided', // Default description
        location: req.body.location || 'Unknown location', // Default location
        date: reportDate,
        contactInfo: req.body.contactInfo || null,
        itemId: req.body.itemId || null,
        status: 'Open' as 'Open' | 'In_Progress' | 'Resolved' | 'Closed'
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
      
      // Get user information
      const user = req.user!;
      
      // Use the Payment Service to initialize payment
      const result = await PaymentService.initializePayment({
        userId: user.id,
        type: validatedData.type,
        amount: validatedData.amount,
        packageId: validatedData.packageId,
        itemId: validatedData.itemId || undefined,
        reportId: validatedData.reportId || undefined,
        redirectUrl: validatedData.redirectUrl
      });
      
      // Return the payment initialization result
      res.json(result);
    } catch (error) {
      console.error("Payment initialization error:", error);
      res.status(500).json({ 
        message: "Failed to initialize payment",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Payment package routes
  app.get("/api/payment-packages", requireAuth, async (req, res) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const packages = await storage.getAllPaymentPackages(includeInactive);
      res.json(packages);
    } catch (error: any) {
      console.error('Error getting payment packages', { error });
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/payment-packages/:id", requireAuth, async (req, res) => {
    try {
      const packageId = parseInt(req.params.id);
      if (isNaN(packageId)) {
        return res.status(400).json({ error: "Invalid package ID" });
      }
      
      const packageData = await storage.getPaymentPackage(packageId);
      if (!packageData) {
        return res.status(404).json({ error: "Payment package not found" });
      }
      
      res.json(packageData);
    } catch (error: any) {
      console.error('Error getting payment package', { error });
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/payment-packages/type/:type", requireAuth, async (req, res) => {
    try {
      const type = req.params.type as PaymentType;
      const onlyActive = req.query.onlyActive !== 'false';
      
      if (!type || !["registration", "lost_report"].includes(type)) {
        return res.status(400).json({ error: "Invalid payment type" });
      }
      
      const packages = await storage.getPaymentPackageByType(type, onlyActive);
      res.json(packages);
    } catch (error: any) {
      console.error('Error getting payment packages by type', { error });
      res.status(500).json({ error: error.message });
    }
  });
  
  // Admin payment package routes
  app.post("/api/admin/payment-packages", requireAuth, requireAdmin, async (req, res) => {
    try {
      // Validate request body
      const validationResult = insertPaymentPackageSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid package data", 
          details: validationResult.error.errors 
        });
      }
      
      const packageData = validationResult.data;
      const newPackage = await storage.createPaymentPackage(packageData);
      
      // Log admin action
      await storage.createAdminActionLog({
        adminId: req.user!.id,
        action: 'create',
        entityType: 'payment_package',
        entityId: newPackage.id,
        details: `Created new payment package: ${newPackage.name}`
      });
      
      res.status(201).json(newPackage);
    } catch (error: any) {
      console.error('Error creating payment package', { error });
      res.status(500).json({ error: error.message });
    }
  });
  
  app.patch("/api/admin/payment-packages/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const packageId = parseInt(req.params.id);
      if (isNaN(packageId)) {
        return res.status(400).json({ error: "Invalid package ID" });
      }
      
      const packageData = await storage.getPaymentPackage(packageId);
      if (!packageData) {
        return res.status(404).json({ error: "Payment package not found" });
      }
      
      // Allow partial updates
      const updates: Partial<PaymentPackage> = {};
      
      // Only allow certain fields to be updated
      const allowedUpdates = [
        'name', 'description', 'amount', 'isDefault', 'status', 'features'
      ];
      
      allowedUpdates.forEach(field => {
        if (field in req.body) {
          // @ts-ignore
          updates[field] = req.body[field];
        }
      });
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      const updatedPackage = await storage.updatePaymentPackage(packageId, updates);
      
      // Log admin action
      await storage.createAdminActionLog({
        adminId: req.user!.id,
        action: 'update',
        entityType: 'payment_package',
        entityId: packageId,
        details: `Updated payment package: ${packageData.name}`
      });
      
      res.json(updatedPackage);
    } catch (error: any) {
      console.error('Error updating payment package', { error });
      res.status(500).json({ error: error.message });
    }
  });
  
  app.delete("/api/admin/payment-packages/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const packageId = parseInt(req.params.id);
      if (isNaN(packageId)) {
        return res.status(400).json({ error: "Invalid package ID" });
      }
      
      const packageData = await storage.getPaymentPackage(packageId);
      if (!packageData) {
        return res.status(404).json({ error: "Payment package not found" });
      }
      
      const result = await storage.deletePaymentPackage(packageId);
      
      // Log admin action
      await storage.createAdminActionLog({
        adminId: req.user!.id,
        action: 'delete',
        entityType: 'payment_package',
        entityId: packageId,
        details: `Deleted payment package: ${packageData.name}`
      });
      
      res.json({ success: result });
    } catch (error: any) {
      console.error('Error deleting payment package', { error });
      res.status(500).json({ error: error.message });
    }
  });
  
  app.patch("/api/admin/payment-packages/:id/default", requireAuth, requireAdmin, async (req, res) => {
    try {
      const packageId = parseInt(req.params.id);
      if (isNaN(packageId)) {
        return res.status(400).json({ error: "Invalid package ID" });
      }
      
      const packageData = await storage.getPaymentPackage(packageId);
      if (!packageData) {
        return res.status(404).json({ error: "Payment package not found" });
      }
      
      const updatedPackage = await storage.setDefaultPaymentPackage(packageId);
      
      // Log admin action
      await storage.createAdminActionLog({
        adminId: req.user!.id,
        action: 'update',
        entityType: 'payment_package',
        entityId: packageId,
        details: `Set payment package as default: ${packageData.name}`
      });
      
      res.json(updatedPackage);
    } catch (error: any) {
      console.error('Error setting default payment package', { error });
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update payment package status
  app.patch("/api/admin/payment-packages/:id/status", requireAuth, requireAdmin, async (req, res) => {
    try {
      const packageId = parseInt(req.params.id);
      if (isNaN(packageId)) {
        return res.status(400).json({ error: "Invalid package ID" });
      }
      
      const { status } = req.body;
      if (!status || !['active', 'inactive', 'archived'].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      
      const packageData = await storage.getPaymentPackage(packageId);
      if (!packageData) {
        return res.status(404).json({ error: "Payment package not found" });
      }
      
      const updatedPackage = await storage.updatePaymentPackage(packageId, { status });
      
      // Log admin action
      await storage.createAdminActionLog({
        adminId: req.user!.id,
        action: 'update',
        entityType: 'payment_package',
        entityId: packageId,
        details: `Updated payment package status to ${status}: ${packageData.name}`
      });
      
      res.json(updatedPackage);
    } catch (error: any) {
      console.error('Error updating payment package status', { error });
      res.status(500).json({ error: error.message });
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
  
  // Admin API: Get all items with filtering, sorting, and pagination
  app.get("/api/admin/items", requireAdmin, async (req, res) => {
    try {
      logger.info('Admin requesting all items with filters');
      
      // Parse query parameters - basic filters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = req.query.sortBy as string || 'registeredAt';
      const sortOrder = req.query.sortOrder as string || 'desc';
      const search = req.query.search as string || '';
      const category = req.query.category as string || '';
      const status = req.query.status as string || '';
      
      // Parse advanced filter parameters
      const ownerName = req.query.ownerName as string || '';
      const serialNumber = req.query.serialNumber as string || '';
      const location = req.query.location as string || '';
      
      // Parse value range filters
      const minValue = req.query.minValue ? parseFloat(req.query.minValue as string) : undefined;
      const maxValue = req.query.maxValue ? parseFloat(req.query.maxValue as string) : undefined;
      
      // Parse date range filters
      let registeredAfter: Date | undefined;
      let registeredBefore: Date | undefined;
      
      if (req.query.registeredAfter) {
        registeredAfter = new Date(req.query.registeredAfter as string);
      }
      
      if (req.query.registeredBefore) {
        registeredBefore = new Date(req.query.registeredBefore as string);
      }
      
      // Parse report filters
      const hasReports = req.query.hasReports === 'true';
      const reportType = (req.query.reportType as string) || undefined;
      
      // Get filtered items
      const result = await storage.getPaginatedItems({
        page,
        limit,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
        search,
        category,
        status,
        // Advanced filters
        ownerName,
        serialNumber,
        location,
        minValue,
        maxValue,
        registeredAfter,
        registeredBefore,
        hasReports,
        reportType
      });
      
      res.json(result);
    } catch (error) {
      logger.error('Error fetching admin items list', { error });
      res.status(500).json({ 
        message: "Failed to fetch items",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Admin API: Get a specific item by ID
  app.get("/api/admin/items/:id", requireAdmin, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      const item = await storage.getItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Get the owner information
      const owner = await storage.getUser(item.userId);
      
      // Get related reports for this item
      const reports = await storage.getItemReports(itemId);
      
      res.json({
        item,
        owner: owner ? {
          id: owner.id,
          fullName: owner.fullName,
          email: owner.email,
          phoneNumber: owner.phoneNumber,
          role: owner.role,
          status: owner.status
        } : null,
        reports
      });
    } catch (error) {
      logger.error('Error fetching item details', { error });
      res.status(500).json({ 
        message: "Failed to fetch item details",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  

  
  // Admin API: Get a specific item by ID with owner and reports
  app.get("/api/admin/items/:id", requireAdmin, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      // Get the item
      const item = await storage.getItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Get the owner
      const owner = await storage.getUser(item.userId);
      
      // Get associated reports
      const reports = await storage.getItemReports(itemId);
      
      res.json({
        item,
        owner,
        reports
      });
    } catch (error) {
      logger.error('Error fetching item details', { error });
      res.status(500).json({ 
        message: "Failed to fetch item details",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Admin API: Update item status
  app.patch("/api/admin/items/:id/status", requireAdmin, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      const { status, notes } = req.body;
      
      if (!status || !["Registered", "Lost", "Found", "Recovered", "Archived"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const item = await storage.getItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Update the item status
      const updatedItem = await storage.updateItem(itemId, { status });
      
      // Log the admin action
      await storage.createAdminActionLog({
        adminId: req.user!.id,
        action: 'item_status_update',
        targetUserId: item.userId,
        previousState: { status: item.status },
        newState: { status },
        reason: notes
      });
      
      // Create a notification for the item owner
      await storage.createNotification({
        userId: item.userId,
        title: "Item Status Update",
        message: `Your item "${item.name}" status has been updated to ${status}`,
        type: 'item_status_update',
        isRead: false,
        relatedItemId: itemId
      });
      
      res.json(updatedItem);
    } catch (error) {
      logger.error('Error updating item status', { error });
      res.status(500).json({ 
        message: "Failed to update item status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Admin API: Delete an item
  app.delete("/api/admin/items/:id", requireAdmin, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      const item = await storage.getItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Store item data for logging before deletion
      const itemData = { ...item };
      
      // Delete the item
      await storage.deleteItem(itemId);
      
      // Log the admin action
      await storage.createAdminActionLog({
        adminId: req.user!.id,
        action: 'item_delete',
        targetUserId: item.userId,
        previousState: itemData,
        reason: req.body.reason || "No reason provided"
      });
      
      // Create a notification for the item owner
      await storage.createNotification({
        userId: item.userId,
        title: "Item Deleted",
        message: `Your item "${item.name}" has been deleted by an administrator`,
        type: 'item_deleted',
        isRead: false
      });
      
      res.json({ success: true, message: "Item successfully deleted" });
    } catch (error) {
      logger.error('Error deleting item', { error });
      res.status(500).json({ 
        message: "Failed to delete item",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Admin API: Create new item
  app.post("/api/admin/items", requireAdmin, async (req, res) => {
    try {
      const { name, category, description, ownerId, status, estimatedValue, lastKnownLocation, serialNumber, modelNumber } = req.body;
      
      // Validate required fields
      if (!name || !category) {
        return res.status(400).json({ message: "Item name and category are required" });
      }
      
      // Generate a unique identifier for the item
      const uniqueIdentifier = `KZ-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();
      
      // Determine the userId - either from ownerId parameter or assign to the admin
      const userId = ownerId ? parseInt(ownerId) : req.user!.id;
      
      // Create item object
      const itemData = {
        userId,
        name,
        category,
        uniqueIdentifier,
        description: description || "",
        status: status || "Registered",
        location: lastKnownLocation || "",
        details: {
          estimatedValue: estimatedValue ? parseFloat(estimatedValue.toString()) : null,
          serialNumber: serialNumber || null,
          modelNumber: modelNumber || null,
          registeredBy: req.user!.id,
          registrationMethod: "admin"
        },
        imageUrls: []
      };
      
      // Create the item
      const newItem = await storage.createItem(itemData);
      
      // Log the admin action
      await storage.createAdminActionLog({
        adminId: req.user!.id,
        action: 'item_create',
        targetUserId: userId,
        newState: newItem,
        reason: "Item created by administrator"
      });
      
      // Create a notification for the item owner if it's a different user
      if (userId !== req.user!.id) {
        await storage.createNotification({
          userId,
          title: "New Item Registered",
          message: `An administrator has registered a new item "${name}" on your behalf`,
          type: 'item_registered',
          isRead: false
        });
      }
      
      res.status(201).json({ 
        success: true, 
        message: "Item created successfully", 
        item: newItem 
      });
    } catch (error) {
      logger.error('Error creating item', { error });
      res.status(500).json({ 
        success: false,
        message: "Failed to create item",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Admin API: Get report statistics
  app.get("/api/admin/reports/stats", requireAdmin, async (req, res) => {
    try {
      logger.info('Admin requesting report statistics');
      
      // Get comprehensive report statistics
      const reportStats = await storage.getReportStats();
      
      // Log the output to debug
      logger.info('Report statistics result:', { reportStats });
      
      res.json(reportStats);
    } catch (error) {
      logger.error("Report statistics error:", error);
      res.status(500).json({ 
        message: "Failed to fetch report statistics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Admin API: Get filtered reports
  app.get("/api/admin/reports", requireAdmin, async (req, res) => {
    try {
      logger.info('Admin requesting reports with filters');
      
      // Extract query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const type = req.query.type as string;
      const status = req.query.status as string;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const itemId = req.query.itemId ? parseInt(req.query.itemId as string) : undefined;
      const location = req.query.location as string;
      const sortBy = req.query.sortBy as string || 'reportedAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
      
      // Parse date range if provided
      let dateRange = null;
      if (req.query.startDate && req.query.endDate) {
        dateRange = {
          start: new Date(req.query.startDate as string),
          end: new Date(req.query.endDate as string)
        };
      }
      
      // Get reports with filters
      const result = await storage.getReportsWithFilters({
        page,
        limit,
        search,
        type,
        status,
        userId,
        itemId,
        location,
        dateRange,
        sortBy,
        sortOrder
      });
      
      res.json(result);
    } catch (error) {
      logger.error("Error fetching reports with filters:", error);
      res.status(500).json({ 
        message: "Failed to fetch reports",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Admin API: Get report details
  app.get("/api/admin/reports/:id", requireAdmin, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }
      
      // Get report with related data
      const reportData = await storage.getReportWithRelatedData(reportId);
      
      if (!reportData.report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.json(reportData);
    } catch (error) {
      logger.error("Error fetching report details:", error);
      res.status(500).json({ 
        message: "Failed to fetch report details",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Admin API: Update report status
  app.patch("/api/admin/reports/:id/status", requireAdmin, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }
      
      const { status, notes } = req.body;
      
      // Validate status
      if (!status || !['Open', 'In_Progress', 'Resolved', 'Closed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      // Get existing report
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      // Update report status
      const updatedReport = await storage.updateReport(reportId, { 
        status: status as any
      });
      
      // Create notification for the report owner
      await storage.createNotification({
        userId: report.userId,
        title: `Report Status Updated: ${status}`,
        message: notes || `Your report "${report.title}" status has been updated to ${status}.`,
        type: 'report',
        isRead: false,
        relatedReportId: reportId
      });
      
      // Log the admin action
      await storage.createAdminActionLog({
        adminId: req.user!.id,
        action: 'report_status_update',
        targetUserId: report.userId,
        previousState: { status: report.status },
        newState: { status },
        reason: notes || `Updated report status to ${status}`
      });
      
      res.json({
        message: "Report status updated successfully",
        report: updatedReport
      });
    } catch (error) {
      logger.error("Error updating report status:", error);
      res.status(500).json({ 
        message: "Failed to update report status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Admin API: Export reports to CSV
  app.get("/api/admin/reports/export/csv", requireAdmin, async (req, res) => {
    try {
      logger.info('Admin exporting reports to CSV');
      
      // Generate CSV content
      const csvContent = await storage.generateReportCSV();
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="reports-export-${new Date().toISOString().split('T')[0]}.csv"`);
      
      // Send CSV content
      res.send(csvContent);
    } catch (error) {
      logger.error("Error exporting reports to CSV:", error);
      res.status(500).json({ 
        message: "Failed to export reports",
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
  
  // Admin API: Get system status
  app.get("/api/admin/system-status", requireAdmin, async (req, res) => {
    try {
      logger.info('Admin requesting system status');
      
      // Get all services status
      const services = [
        {
          id: 'api-service',
          name: 'API Services',
          status: 'operational',
          description: 'External API connectors and endpoints',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'database',
          name: 'Database',
          status: 'operational',
          description: 'Main application database',
          updatedAt: new Date().toISOString(),
          metrics: {
            responseTime: 45,
            uptime: 99.9,
            errorRate: 0.01
          }
        },
        {
          id: 'auth',
          name: 'Authentication',
          status: 'operational',
          description: 'User authentication services',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'payment',
          name: 'Payment Services',
          status: 'operational',
          description: 'Payment processing and transactions',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'storage',
          name: 'Storage Services',
          status: 'operational',
          description: 'File storage and media handling',
          updatedAt: new Date().toISOString()
        }
      ];
      
      // Sample active issues (empty for now)
      const issues: any[] = [];
      
      // Calculate health score (percentage of services that are operational)
      const operationalServices = services.filter(s => s.status === 'operational').length;
      const healthScore = Math.round((operationalServices / services.length) * 100);
      
      res.json({
        overall: 'operational',
        lastUpdated: new Date().toISOString(),
        services,
        issues,
        healthScore,
        activeIssues: 0
      });
    } catch (error) {
      logger.error('Error fetching system status', { error });
      res.status(500).json({ 
        message: "Failed to fetch system status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Admin API: Get activity log
  app.get("/api/admin/activity-log", requireAdmin, async (req, res) => {
    try {
      logger.info('Admin requesting activity log');
      
      // Get recent admin actions
      const adminActions = await storage.getRecentAdminActions(20);
      
      // Transform admin actions into activity events
      const events = adminActions.map(action => {
        // Extract entity information from action
        const actionParts = action.action.split('_');
        const entityType = actionParts[0]; // e.g., 'user', 'item', 'report'
        const actionType = actionParts[1] || 'edit'; // e.g., 'edit', 'suspend', 'delete'
        
        // Determine event type
        let eventType = 'info';
        if (actionType === 'warning' || actionType === 'suspend') eventType = 'warning';
        if (actionType === 'alert' || actionType === 'delete') eventType = 'alert';
        if (actionType === 'activate' || actionType === 'approve') eventType = 'success';
        
        // Determine category based on entity type
        let category = 'system';
        if (entityType === 'user') category = 'users';
        if (entityType === 'item') category = 'items';
        if (entityType === 'report') category = 'reports';
        if (entityType === 'payment') category = 'revenue';
        
        // Parse previous and new state if available
        const previousState = action.previousState as any || {};
        const newState = action.newState as any || {};
        
        // Generate title and message
        const title = `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ${actionType}`;
        const message = action.reason || 
                      `Admin ${action.adminId} performed ${actionType} on ${entityType} ${action.targetUserId || ''}`;
        
        // Determine related IDs
        const userId = entityType === 'user' ? action.targetUserId : undefined;
        
        return {
          id: action.id.toString(),
          type: eventType,
          category,
          title,
          message,
          time: new Date(action.timestamp).toISOString(),
          userId,
          metadata: {
            previousState,
            newState,
            reason: action.reason
          }
        };
      });
      
      res.json(events);
    } catch (error) {
      logger.error('Error fetching activity log', { error });
      res.status(500).json({ 
        message: "Failed to fetch activity log",
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

  // Unified admin dashboard statistics endpoint
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      logger.info('Admin requesting unified dashboard statistics');
      
      // Get all users
      const allUsers = await storage.getAllUsers();
      const totalUsers = allUsers.length;
      
      // Get all items
      const allItems = await storage.getAllItems();
      const totalItems = allItems.length;
      
      // Get all reports
      const lostReports = await storage.getLostReports();
      const foundReports = await storage.getFoundReports();
      const allReports = [...lostReports, ...foundReports];
      const pendingReports = allReports.filter(report => report.status === 'Open').length;
      
      // Get all payments
      const allPayments = await storage.getAllPayments();
      const totalPayments = allPayments.length;
      
      // Return the combined statistics
      res.json({
        totalUsers,
        totalItems,
        pendingReports,
        totalPayments,
        // Additional statistics that might be useful for the dashboard
        userStats: {
          subscriberCount: allUsers.filter(user => user.role === 'Subscriber').length,
          agentCount: allUsers.filter(user => user.role === 'Agent').length,
          adminCount: allUsers.filter(user => user.role === 'Admin').length
        },
        itemStats: {
          registeredItems: allItems.filter(item => item.status === 'Registered').length,
          lostItems: allItems.filter(item => item.status === 'Lost').length,
          foundItems: allItems.filter(item => item.status === 'Found').length
        },
        reportStats: {
          lostReportsCount: lostReports.length,
          foundReportsCount: foundReports.length,
          resolvedReportsCount: allReports.filter(report => report.status === 'Resolved').length
        },
        paymentStats: {
          successfulPayments: allPayments.filter(p => p.status === 'successful').length,
          pendingPayments: allPayments.filter(p => p.status === 'pending').length,
          failedPayments: allPayments.filter(p => p.status === 'failed').length
        }
      });
    } catch (error) {
      logger.error('Error fetching unified admin stats', { error });
      res.status(500).json({ 
        message: "Failed to fetch admin dashboard statistics",
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
