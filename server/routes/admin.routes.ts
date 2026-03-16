import { Router } from 'express';
import { storage } from '../storage';
import { createLogger } from '../utils/logger';
import { hashPassword } from '../utils/auth-crypto';
import { z } from 'zod';
import { dashboardService } from '../services/dashboard.service';
import { ReportMatchingService } from '../services/report-matching.service';
import { DEFAULT_USER_PREFERENCES } from '../../shared/schema';
import { requireAdmin } from '../middleware/auth.middleware';
import { getUrlWithSignature } from '../services/cloudinary.service';

const logger = createLogger('AdminRoutes');
const router = Router();

// ==========================================
// USER MANAGEMENT
// ==========================================

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

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (req.query.startDate) startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) endDate = new Date(req.query.endDate as string);

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

// Export users (CSV format) - Admin Only
router.get("/users/export", requireAdmin, async (req, res) => {
  try {
    const format = (req.query.format as 'csv' | 'excel') || 'csv';
    const filters: any = {};

    if (req.query.search) filters.search = req.query.search as string;
    if (req.query.role) filters.role = req.query.role as string;
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.verificationStatus) filters.verificationStatus = req.query.verificationStatus as string;
    if (req.query.activityLevel) filters.activityLevel = req.query.activityLevel as string;

    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

    const csvData = await storage.exportUsers(format, filters);

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
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    logger.error("Error getting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update user status - Admin Only
router.patch("/users/:id/status", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { status, reason } = req.body;
    const adminId = req.user!.id;

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const statusChange = await storage.updateUserStatus(userId, status, reason);

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

// Update user role - Admin Only
router.patch("/users/:id/role", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    const adminId = req.user!.id;

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updatedUser = await storage.updateUserRole(userId, role);

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

// Get user activity, status history, and warnings (consolidated)
router.get("/users/:id/activity", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const logs = await storage.getUserActivityLogs(userId, page, pageSize);
    res.json({ logs, total: logs.length, page });
  } catch (error) {
    logger.error("Error getting activity logs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/users/:id/status-history", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const history = await storage.getUserStatusHistory(userId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/users/:id/warnings", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const warnings = await storage.getUserWarnings(userId);
    res.json(warnings);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user payments
router.get("/users/:id/payments", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const payments = await storage.getUserPayments(userId);
    res.json(payments);
  } catch (error) {
    logger.error("Error getting user payments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user verification requests
router.get("/users/:id/verification-requests", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const request = await storage.getVerificationRequest(userId);
    
    // Return as an array to maintain compatibility with existing frontend expectations (if needed)
    // but with signed URLs for private documents
    if (!request) return res.json([]);
    
    const enriched = {
      ...request,
      documentUrl: request.documentPublicId ? getUrlWithSignature(request.documentPublicId) : request.documentUrl,
      selfieUrl: request.selfiePublicId ? getUrlWithSignature(request.selfiePublicId) : request.selfieUrl
    };

    res.json([enriched]);
  } catch (error) {
    logger.error("Error getting user verification requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create user warning
router.post("/users/:id/warnings", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { warningType, severity, message } = req.body;
    const adminId = req.user!.id;

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const warning = await storage.createUserWarning({
      userId,
      warningType,
      severity,
      message,
      issuedBy: adminId
    });

    await storage.updateUser(userId, {
      warningCount: (user.warningCount || 0) + 1,
      updatedAt: new Date()
    });

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
    logger.error("Error creating warning:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create new user (Admin version)
router.post("/users", async (req, res) => {
  try {
    const { fullName, email, username, password, role, phoneNumber, status, verificationStatus } = req.body;
    const adminId = req.user!.id;

    if (await storage.getUserByUsername(username)) return res.status(400).json({ message: "Username already exists" });
    if (await storage.getUserByEmail(email)) return res.status(400).json({ message: "Email already exists" });

    // Harmonized hashing
    const hashedPassword = await hashPassword(password);

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
      activityLevel: 'low',
      preferences: DEFAULT_USER_PREFERENCES
    });

    await storage.createAdminActionLog({
      adminId,
      targetUserId: newUser.id,
      action: `user_create`,
      newState: { fullName, email, role },
      reason: `Created by admin ${adminId}`
    });

    const { password: _, ...userResponse } = newUser;
    res.status(201).json({ user: userResponse, success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to create user" });
  }
});

// ==========================================
// VERIFICATION REQUESTS
// ==========================================

router.get("/verification-requests", async (req, res) => {
  try {
    const requests = await storage.getPendingVerificationRequests();
    
    // Generate signed URLs for private documents
    const enriched = requests.map(r => ({
      ...r,
      documentUrl: r.documentPublicId ? getUrlWithSignature(r.documentPublicId) : r.documentUrl,
      selfieUrl: r.selfiePublicId ? getUrlWithSignature(r.selfiePublicId) : r.selfieUrl
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/verification-requests/:id", async (req, res) => {
  try {
    const request = await storage.getVerificationRequest(parseInt(req.params.id));
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Generate signed URLs if private
    const enriched = {
      ...request,
      documentUrl: request.documentPublicId ? getUrlWithSignature(request.documentPublicId) : request.documentUrl,
      selfieUrl: request.selfiePublicId ? getUrlWithSignature(request.selfiePublicId) : request.selfieUrl
    };

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/verification-requests/:id", async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const { status, adminComment } = req.body;
    const adminId = req.user!.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedRequest = await storage.updateVerificationRequestStatus(requestId, status, adminId, adminComment);

    if (!updatedRequest) return res.status(404).json({ message: "Request not found" });

    // The storage layer already updates the user verificationStatus
    
    await storage.createAdminActionLog({
      adminId,
      targetUserId: updatedRequest.userId,
      action: `Verification ${status}`,
      newState: { verificationStatus: status },
      reason: adminComment
    });

    res.json({ success: true, request: updatedRequest });
  } catch (error) {
    logger.error("Failed to update verification request", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================================
// ITEM MANAGEMENT (Admin)
// ==========================================

router.post("/items", async (req, res) => {
  try {
    const { name, category, description, ownerId, status, estimatedValue, lastKnownLocation, serialNumber, modelNumber } = req.body;
    if (!name || !category) return res.status(400).json({ message: "Name and category required" });

    const uniqueIdentifier = `KZ-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();
    const userId = ownerId ? parseInt(ownerId) : req.user!.id;

    const newItem = await storage.createItem({
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
    });

    await storage.createAdminActionLog({
      adminId: req.user!.id,
      action: 'item_create',
      targetUserId: userId,
      newState: newItem
    });

    res.status(201).json({ success: true, item: newItem });
  } catch (error) {
    res.status(500).json({ message: "Failed to create item" });
  }
});

router.patch("/items/:id/status", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const { status } = req.body;
    const item = await storage.getItem(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const updatedItem = await storage.updateItem(itemId, { status });

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
    res.status(500).json({ message: "Failed to update status" });
  }
});

router.delete("/items/:id", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const item = await storage.getItem(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    await storage.deleteItem(itemId);

    await storage.createAdminActionLog({
      adminId: req.user!.id,
      action: 'item_delete',
      targetUserId: item.userId,
      previousState: item
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete item" });
  }
});

// ==========================================
// REPORT MANAGEMENT (Admin)
// ==========================================

router.get("/reports/stats", async (req, res) => {
  try {
    const stats = await storage.getReportStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

router.get("/reports", async (req, res) => {
  try {
    const result = await storage.getReportsWithFilters({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      type: req.query.type as string,
      status: req.query.status as string,
      sortBy: req.query.sortBy as string || 'reportedAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reports" });
  }
});

router.patch("/reports/:id/status", async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const { status, notes } = req.body;
    const report = await storage.getReport(reportId);
    if (!report) return res.status(404).json({ message: "Report not found" });

    const updated = await storage.updateReport(reportId, { status: status as any });

    await storage.createNotification({
      userId: report.userId,
      title: `Report Status Updated: ${status}`,
      message: notes || `Your report status has been updated to ${status}.`,
      type: 'report',
      isRead: false,
      relatedReportId: reportId
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update report" });
  }
});

router.get("/reports/:id", async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const reportData = await storage.getReportWithRelatedData(reportId);

    if (!reportData) return res.status(404).json({ message: "Report not found" });

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch report" });
  }
});

// Export reports - Admin Only
router.get("/reports/export/csv", requireAdmin, async (req, res) => {
  try {
    const csvContent = await storage.generateReportCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="reports-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: "Export failed" });
  }
});

// ==========================================
// PAYMENT MANAGEMENT (Admin Only)
// ==========================================

router.get("/revenue-summary", requireAdmin, async (req, res) => {
  try {
    const summary = await dashboardService.getAdminPaymentSummary();
    res.json(summary);
  } catch (error) {
    logger.error("Failed to fetch revenue summary:", error);
    res.status(500).json({ message: "Failed to fetch revenue summary" });
  }
});

router.get("/payments/summary", requireAdmin, async (req, res) => {
  try {
    const allPayments = await storage.getAllPayments();
    const successful = allPayments.filter(p => p.status === 'successful');

    res.json({
      totalRevenue: successful.reduce((sum, p) => sum + Number(p.amount), 0),
      successfulTransactions: successful.length,
      totalTransactions: allPayments.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch summary" });
  }
});

router.get("/payments", requireAdmin, async (req, res) => {
  try {
    const result = await storage.getPaymentsWithFilters({
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      status: req.query.status as string,
    });

    const transactions = await Promise.all(result.payments.map(async p => {
      const user = await storage.getUser(p.userId);
      return { ...p, username: user?.username || 'Unknown' };
    }));

    res.json({ transactions, total: result.total });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// CRUD for Payment Packages

// Get all packages
router.get("/payment-packages", async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const packages = await storage.getAllPaymentPackages(includeInactive);
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch packages" });
  }
});

// Create new package - Admin Only
router.post("/payment-packages", requireAdmin, async (req, res) => {
  try {
    const newPackage = await storage.createPaymentPackage(req.body);
    await storage.createAdminActionLog({
      adminId: req.user!.id,
      action: 'package_create',
      newState: newPackage,
      targetUserId: req.user!.id
    });
    res.status(201).json(newPackage);
  } catch (error) {
    logger.error("Failed to create package", error);
    res.status(500).json({ message: "Failed to create package" });
  }
});

// Update package - Admin Only
router.patch("/payment-packages/:id", requireAdmin, async (req, res) => {
  try {
    const pkgId = parseInt(req.params.id);
    const updated = await storage.updatePaymentPackage(pkgId, req.body);
    if (!updated) return res.status(404).json({ message: "Package not found" });

    await storage.createAdminActionLog({
      adminId: req.user!.id,
      action: 'package_update',
      newState: updated,
      targetUserId: req.user!.id
    });

    res.json(updated);
  } catch (error) {
    logger.error("Failed to update package", error);
    res.status(500).json({ message: "Update failed" });
  }
});

// Delete package - Admin Only
router.delete("/payment-packages/:id", requireAdmin, async (req, res) => {
  try {
    const pkgId = parseInt(req.params.id);
    const success = await storage.deletePaymentPackage(pkgId);
    if (!success) return res.status(404).json({ message: "Package not found" });

    await storage.createAdminActionLog({
      adminId: req.user!.id,
      action: 'package_delete',
      previousState: { id: pkgId },
      targetUserId: req.user!.id
    });

    res.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete package", error);
    res.status(500).json({ message: "Delete failed" });
  }
});

// Update status specific
router.patch("/payment-packages/:id/status", async (req, res) => {
  try {
    const pkgId = parseInt(req.params.id);
    const { status } = req.body;
    const updated = await storage.updatePaymentPackage(pkgId, { status });
    if (!updated) return res.status(404).json({ message: "Package not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Status update failed" });
  }
});

// Set default
router.patch("/payment-packages/:id/default", async (req, res) => {
  try {
    const pkgId = parseInt(req.params.id);
    const updated = await storage.setDefaultPaymentPackage(pkgId);
    if (!updated) return res.status(404).json({ message: "Package not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to set default" });
  }
});

// Legacy PUT support (optional, can be removed if frontend is fully updated to PATCH)
router.put("/payment-packages/:id", async (req, res) => {
  try {
    const updated = await storage.updatePaymentPackage(parseInt(req.params.id), req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

// ==========================================
// SYSTEM & DASHBOARD
// ==========================================

router.get("/system-status", requireAdmin, async (req, res) => {
  try {
    const status = await dashboardService.getSystemStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error getting system status', { error });
    // Return degraded status on error instead of 500 if possible, 
    // or let the frontend handle the error
    res.status(500).json({ message: "Failed to get system status" });
  }
});

router.get("/activity-log", async (req, res) => {
  try {
    const adminActions = await storage.getRecentAdminActions(50);
    res.json(adminActions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch logs" });
  }
});

// Detailed stats - Admin Only
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const stats = await dashboardService.getAdminDetailedStats();
    res.json(stats);
  } catch (error) {
    logger.error("Failed to fetch detailed stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

export default router;
