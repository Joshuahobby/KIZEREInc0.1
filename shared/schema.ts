import { pgTable, text, serial, integer, boolean, timestamp, json, numeric, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define allowed user roles
export const userRoles = ['Admin', 'Agent', 'Subscriber'] as const;

// Define payment statuses
export const paymentStatuses = ['pending', 'successful', 'failed', 'cancelled'] as const;

// Define payment types
export const paymentTypes = ['registration', 'lost_report'] as const;

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phoneNumber: text("phone_number"),
  role: text("role").notNull().default('Subscriber'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

// Zod schemas for input validation

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const userLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Item schemas
export const insertItemSchema = createInsertSchema(items).omit({ id: true, registeredAt: true, updatedAt: true });

// Report schemas
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, reportedAt: true });

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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type User = typeof users.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserRole = typeof userRoles[number];
export type PaymentStatus = typeof paymentStatuses[number];
export type PaymentType = typeof paymentTypes[number];

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
