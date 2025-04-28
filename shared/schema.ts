import { pgTable, text, serial, integer, boolean, timestamp, json, numeric, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define allowed user roles
export const userRoles = ['Admin', 'Agent', 'Moderator', 'Subscriber'] as const;

// Define account statuses
export const accountStatuses = ['active', 'pending', 'suspended', 'inactive', 'banned'] as const;

// Define verification statuses
export const verificationStatuses = ['pending', 'in_review', 'approved', 'rejected', 'expired'] as const;

// Define activity levels
export const activityLevels = ['high', 'medium', 'low', 'inactive'] as const;

// Define item categories
export const itemCategories = [
  'Electronics', 'Jewelry', 'Documents', 'Accessories', 
  'Clothing', 'Bags', 'Keys', 'Wallets', 'Phones', 
  'Computers', 'Transportation', 'Other'
] as const;

// Define item statuses
export const itemStatuses = ['Registered', 'Lost', 'Found', 'Recovered', 'Archived'] as const;

// Define report statuses
export const reportStatuses = ['Open', 'In_Progress', 'Resolved', 'Closed'] as const;

// Define permission types
export const permissionTypes = [
  'user_view', 'user_edit', 'user_delete', 'user_verify',
  'item_view', 'item_edit', 'item_delete', 'item_approve',
  'report_view', 'report_edit', 'report_delete', 'report_resolve',
  'payment_view', 'payment_process', 'payment_refund',
  'dashboard_view', 'dashboard_export', 'dashboard_admin',
  'system_settings'
] as const;

// Define payment statuses
export const paymentStatuses = ['pending', 'successful', 'failed', 'cancelled'] as const;

// Define payment types
export const paymentTypes = ['registration', 'lost_report'] as const;

// Define package status
export const packageStatuses = ['active', 'inactive', 'archived'] as const;

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phoneNumber: text("phone_number"),
  role: text("role").notNull().default('Subscriber'),
  avatarUrl: text("avatar_url"),
  status: text("status").notNull().default('active'),
  verificationStatus: text("verification_status").default('pending'),
  activityLevel: text("activity_level").default('medium'),
  lastLogin: timestamp("last_login"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  postalCode: text("postal_code"),
  bio: text("bio"),
  preferences: json("preferences"),
  customPermissions: json("custom_permissions"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  recoveryEmail: text("recovery_email"),
  notes: text("admin_notes"),
  warningCount: integer("warning_count").default(0),
  suspensionHistory: json("suspension_history"),
  verificationDocuments: json("verification_documents"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Item registration table
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  uniqueIdentifier: text("unique_identifier").notNull(),
  description: text("description"),
  status: text("status").notNull().default('Registered'),
  location: text("location"),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  details: json("details"),
  imageUrls: text("image_urls").array(),
});

// Lost and found reports
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  itemId: integer("item_id").references(() => items.id),
  type: text("type").notNull(), // 'lost' or 'found'
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull().default('Open'),
  contactInfo: text("contact_info"),
  reportedAt: timestamp("reported_at").defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // e.g., 'item_found', 'renewal_reminder'
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  relatedItemId: integer("related_item_id").references(() => items.id),
  relatedReportId: integer("related_report_id").references(() => reports.id),
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: numeric("amount").notNull(),
  currency: text("currency").notNull().default('RWF'),
  type: text("type").notNull(), // 'registration' or 'lost_report'
  status: text("status").notNull().default('pending'),
  transactionId: text("transaction_id"),
  transactionRef: text("transaction_ref").notNull().unique(),
  flutterwaveRef: text("flutterwave_ref"),
  itemId: integer("item_id").references(() => items.id),
  reportId: integer("report_id").references(() => reports.id),
  paymentDate: timestamp("payment_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: json("metadata"),
});

// Payment methods (saved for future use)
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'card', 'mobile_money', etc.
  lastFour: varchar("last_four", { length: 4 }),
  expiryDate: varchar("expiry_date", { length: 7 }),
  brand: text("brand"),
  isDefault: boolean("is_default").default(false),
  tokenized: text("tokenized"), // encrypted token for the payment method
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User activity audit log
export const userActivityLogs = pgTable("user_activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // e.g., 'login', 'item_registration', 'report_filed'
  details: json("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Admin actions audit log
export const adminActionLogs = pgTable("admin_action_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => users.id),
  targetUserId: integer("target_user_id").references(() => users.id),
  action: text("action").notNull(), // e.g., 'user_edit', 'role_change', 'account_suspension'
  previousState: json("previous_state"),
  newState: json("new_state"),
  reason: text("reason"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Custom roles for more granular permissions
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isSystem: boolean("is_system").default(false),
  permissions: json("permissions").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User verification documents and process
export const verificationRequests = pgTable("verification_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // e.g., 'identity', 'address', 'business'
  status: text("status").notNull().default('pending'),
  documentUrls: text("document_urls").array(),
  notes: text("notes"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  expiresAt: timestamp("expires_at"),
});

// Status change history
export const statusChanges = pgTable("status_changes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  previousStatus: text("previous_status").notNull(),
  newStatus: text("new_status").notNull(),
  reason: text("reason"),
  changedBy: integer("changed_by").references(() => users.id),
  expirationDate: timestamp("expiration_date"), // For temporary status changes
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// User warnings
export const userWarnings = pgTable("user_warnings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  warningType: text("warning_type").notNull(), // e.g., 'policy_violation', 'inappropriate_content'
  severity: text("severity").notNull(), // e.g., 'low', 'medium', 'high'
  message: text("message").notNull(),
  issuedBy: integer("issued_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

// Payment packages
export const paymentPackages = pgTable("payment_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'registration' or 'lost_report'
  amount: numeric("amount").notNull(),
  currency: text("currency").notNull().default('RWF'),
  status: text("status").notNull().default('active'),
  isDefault: boolean("is_default").default(false),
  features: json("features"), // Array of package features/benefits
  validityDays: integer("validity_days"), // Optional validity period in days
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Zod schemas for input validation

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const userLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Item schemas
export const insertItemSchema = createInsertSchema(items)
  .omit({ id: true, registeredAt: true, updatedAt: true })
  .extend({
    category: z.enum(itemCategories, {
      errorMap: () => ({ message: "Please select a valid category for this item" })
    }),
    status: z.enum(itemStatuses, {
      errorMap: () => ({ message: "Item status must be valid" })
    }).default('Registered'),
    imageUrls: z.array(z.string().url("Must be a valid URL")).optional().default([])
  });

// Extended item schema for item registration form with validation
export const itemRegistrationSchema = insertItemSchema.extend({
  name: z.string().min(2, "Item name must be at least 2 characters"),
  category: z.enum(itemCategories, {
    errorMap: () => ({ message: "Please select a valid category" })
  }),
  uniqueIdentifier: z.string().min(3, "Unique identifier must be at least 3 characters"),
  description: z.string().min(10, "Please provide a detailed description").max(500, "Description is too long"),
  location: z.string().min(2, "Location is required").optional(),
  details: z.record(z.any()).optional()
});

// Report schemas
export const insertReportSchema = createInsertSchema(reports)
  .omit({ id: true, reportedAt: true })
  .extend({
    type: z.enum(['lost', 'found'], {
      errorMap: () => ({ message: "Report type must be either 'lost' or 'found'" })
    }),
    status: z.enum(reportStatuses, {
      errorMap: () => ({ message: "Report status must be valid" })
    }).default('Open'),
    date: z.coerce.date({
      errorMap: () => ({ message: "Please enter a valid date" })
    }),
    location: z.string().min(3, "Please provide a specific location"),
    description: z.string().min(10, "Please provide a detailed description").max(500, "Description is too long")
  });

// Extended schema for lost item report form with validation
export const lostItemReportSchema = insertReportSchema.extend({
  title: z.string().min(5, "Title must be at least 5 characters"),
  contactInfo: z.string().min(5, "Please provide contact information").optional()
});

// Extended schema for found item report form
export const foundItemReportSchema = insertReportSchema.extend({
  title: z.string().min(5, "Title must be at least 5 characters")
});

// Notification schemas
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

// Payment schemas
export const insertPaymentSchema = createInsertSchema(payments).omit({ 
  id: true, 
  createdAt: true, 
  paymentDate: true, 
  flutterwaveRef: true, 
  transactionId: true 
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({ 
  id: true, 
  createdAt: true
});

// Create insert schemas for new tables
export const insertUserActivityLogSchema = createInsertSchema(userActivityLogs).omit({ id: true, timestamp: true });
export const insertAdminActionLogSchema = createInsertSchema(adminActionLogs).omit({ id: true, timestamp: true });
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVerificationRequestSchema = createInsertSchema(verificationRequests).omit({ 
  id: true, submittedAt: true, reviewedAt: true, expiresAt: true 
});
export const insertStatusChangeSchema = createInsertSchema(statusChanges).omit({ id: true, timestamp: true });
export const insertUserWarningSchema = createInsertSchema(userWarnings).omit({ 
  id: true, issuedAt: true, acknowledgedAt: true, expiresAt: true 
});

// Payment package schema
export const insertPaymentPackageSchema = createInsertSchema(paymentPackages).omit({
  id: true, createdAt: true, updatedAt: true
}).extend({
  type: z.enum(paymentTypes, {
    errorMap: () => ({ message: "Package type must be either 'registration' or 'lost_report'" })
  }),
  status: z.enum(packageStatuses, {
    errorMap: () => ({ message: "Package status must be valid" })
  }).default('active'),
  name: z.string().min(3, "Package name must be at least 3 characters"),
  amount: z.number().positive("Amount must be positive"),
  features: z.array(z.string()).optional().default([])
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;
export type InsertAdminActionLog = z.infer<typeof insertAdminActionLogSchema>;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertVerificationRequest = z.infer<typeof insertVerificationRequestSchema>;
export type InsertStatusChange = z.infer<typeof insertStatusChangeSchema>;
export type InsertUserWarning = z.infer<typeof insertUserWarningSchema>;
export type InsertPaymentPackage = z.infer<typeof insertPaymentPackageSchema>;

export type User = typeof users.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type AdminActionLog = typeof adminActionLogs.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type StatusChange = typeof statusChanges.$inferSelect;
export type UserWarning = typeof userWarnings.$inferSelect;
export type PaymentPackage = typeof paymentPackages.$inferSelect;

export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserRole = typeof userRoles[number];
export type AccountStatus = typeof accountStatuses[number];
export type VerificationStatus = typeof verificationStatuses[number];
export type ActivityLevel = typeof activityLevels[number];
export type ItemCategory = typeof itemCategories[number];
export type ItemStatus = typeof itemStatuses[number];
export type ReportStatus = typeof reportStatuses[number];
export type PermissionType = typeof permissionTypes[number];
export type PaymentStatus = typeof paymentStatuses[number];
export type PaymentType = typeof paymentTypes[number];
export type PackageStatus = typeof packageStatuses[number];

// Payment validation schemas
export const initiatePaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  type: z.enum(paymentTypes, {
    errorMap: () => ({ message: "Payment type must be either 'registration' or 'lost_report'" })
  }),
  itemId: z.number().optional(),
  reportId: z.number().optional(),
  metadata: z.record(z.any()).optional()
});
