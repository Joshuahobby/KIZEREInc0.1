import { Router } from 'express';
import { storage } from '../storage';
import { createLogger } from '../utils/logger';

// Create logger for admin user routes
const logger = createLogger('AdminUsers');

// Create express router
const router = Router();

// Get filtered users with pagination
router.get("/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = req.query.search as string || "";
    const role = req.query.role as string || "";
    const status = req.query.status as string || "";
    const verificationStatus = req.query.verificationStatus as string || "";
    const activityLevel = req.query.activityLevel as string || "";
    const sortBy = req.query.sortBy as string || "createdAt";
    const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";
    
    // Parse dates if provided
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (req.query.startDate) {
      startDate = new Date(req.query.startDate as string);
    }
    
    if (req.query.endDate) {
      endDate = new Date(req.query.endDate as string);
    }
    
    const result = await storage.getUsersWithFilters({
      page,
      pageSize,
      search,
      role,
      status,
      verificationStatus,
      activityLevel,
      startDate,
      endDate,
      sortBy,
      sortOrder
    });
    
    res.json(result);
  } catch (error) {
    logger.error("Error getting filtered users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Export users (CSV format)
router.get("/users/export", async (req, res) => {
  try {
    const format = (req.query.format as 'csv' | 'excel') || 'csv';
    
    // Parse filters from query params
    const filters: any = {};
    
    if (req.query.search) filters.search = req.query.search as string;
    if (req.query.role) filters.role = req.query.role as string;
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.verificationStatus) filters.verificationStatus = req.query.verificationStatus as string;
    if (req.query.activityLevel) filters.activityLevel = req.query.activityLevel as string;
    
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }
    
    const csvData = await storage.exportUsers(format, filters);
    
    // Set appropriate content type and headers
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=users-export.xlsx');
    }
    
    res.send(csvData);
  } catch (error) {
    logger.error("Error exporting users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user by ID
router.get("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    logger.error("Error getting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update user status
router.patch("/users/:id/status", async (req: any, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { status, reason } = req.body;
    const adminId = req.user?.id;
    
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Verify user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Update user status and create status change record
    const statusChange = await storage.updateUserStatus(userId, status, reason);
    
    // Log admin action
    await storage.createAdminActionLog({
      adminId,
      targetUserId: userId,
      action: `Changed user status to ${status}`,
      previousState: { status: user.status || 'active' },
      newState: { status }
    });
    
    res.json({ success: true, statusChange });
  } catch (error) {
    logger.error("Error updating user status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update user role
router.patch("/users/:id/role", async (req: any, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    const adminId = req.user?.id;
    
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Verify user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Update user role
    const updatedUser = await storage.updateUserRole(userId, role);
    
    // Log admin action
    await storage.createAdminActionLog({
      adminId,
      targetUserId: userId,
      action: `Changed user role to ${role}`,
      previousState: { role: user.role || 'Subscriber' },
      newState: { role }
    });
    
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    logger.error("Error updating user role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user activity logs
router.get("/users/:id/activity", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    
    // Get user activity logs
    const activityLogs = await storage.getUserActivityLogs(userId, page, pageSize);
    
    res.json(activityLogs);
  } catch (error) {
    logger.error("Error getting user activity logs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user status history
router.get("/users/:id/status-history", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Get user status history
    const statusHistory = await storage.getUserStatusHistory(userId);
    
    res.json(statusHistory);
  } catch (error) {
    logger.error("Error getting user status history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user warnings
router.get("/users/:id/warnings", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Get user warnings
    const warnings = await storage.getUserWarnings(userId);
    
    res.json(warnings);
  } catch (error) {
    logger.error("Error getting user warnings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create user warning
router.post("/users/:id/warnings", async (req: any, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { warningType, severity, message, expiresAt } = req.body;
    const adminId = req.user?.id;
    
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Verify user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Create warning
    const warning = await storage.createUserWarning({
      userId,
      warningType,
      severity,
      message,
      issuedBy: adminId
    });
    
    // Increment warning count
    await storage.updateUser(userId, { 
      warningCount: (user.warningCount || 0) + 1,
      updatedAt: new Date()
    });
    
    // Log admin action
    await storage.createAdminActionLog({
      adminId,
      targetUserId: userId,
      action: `user_warning`,
      previousState: { warningCount: user.warningCount || 0 },
      newState: { warningCount: (user.warningCount || 0) + 1 },
      reason: message
    });
    
    res.json({ success: true, warning });
  } catch (error) {
    logger.error("Error creating user warning:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create new user
router.post("/users", async (req: any, res) => {
  try {
    const { fullName, email, username, password, role, phoneNumber, status, verificationStatus } = req.body;
    const adminId = req.user?.id;
    
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if username already exists
    const existingUserByUsername = await storage.getUserByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    // Check if email already exists
    const existingUserByEmail = await storage.getUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }
    
    // Hash the password
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create the new user
    const newUser = await storage.createUser({
      fullName,
      username,
      email,
      role: role || 'Subscriber',
      password: hashedPassword,
      phoneNumber: phoneNumber || null,
      status: status || 'active',
      verificationStatus: verificationStatus || 'pending',
      warningCount: 0,
      activityLevel: 'low'
    });
    
    // Log admin action
    await storage.createAdminActionLog({
      adminId,
      targetUserId: newUser.id,
      action: `user_create`,
      previousState: null,
      newState: { 
        fullName, 
        username, 
        email, 
        role: role || 'Subscriber',
        status: status || 'active',
        verificationStatus: verificationStatus || 'pending'
      },
      reason: `User created by admin ${adminId}`
    });
    
    // Create a clean response object without the password
    const userResponse = {
      id: newUser.id,
      fullName: newUser.fullName,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      verificationStatus: newUser.verificationStatus,
      phoneNumber: newUser.phoneNumber,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };
    
    res.status(201).json({ user: userResponse, success: true });
  } catch (error) {
    logger.error("Error creating new user:", error);
    res.status(500).json({ 
      message: "Failed to create user", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

export default router;