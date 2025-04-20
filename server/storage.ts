import { 
  users, type User, type InsertUser,
  items, type Item, type InsertItem,
  reports, type Report, type InsertReport,
  notifications, type Notification, type InsertNotification,
  payments, type Payment, type InsertPayment,
  paymentMethods, type PaymentMethod, type InsertPaymentMethod
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, or, desc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Item methods
  getItem(id: number): Promise<Item | undefined>;
  getUserItems(userId: number): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, item: Partial<Item>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
  searchItems(query: string, filters?: object): Promise<Item[]>;
  getAllItems(): Promise<Item[]>;
  
  // Report methods
  getReport(id: number): Promise<Report | undefined>;
  getUserReports(userId: number): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: number, report: Partial<Report>): Promise<Report | undefined>;
  getLostReports(): Promise<Report[]>;
  getFoundReports(): Promise<Report[]>;
  
  // Notification methods
  getNotification(id: number): Promise<Notification | undefined>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;

  // Payment methods
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByTransactionRef(transactionRef: string): Promise<Payment | undefined>;
  getUserPayments(userId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined>;
  getItemPayments(itemId: number): Promise<Payment[]>;
  getReportPayments(reportId: number): Promise<Payment[]>;
  
  // Admin payment methods
  getAllPayments(): Promise<Payment[]>;
  getPaymentsWithFilters(options: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    type?: string;
    dateFilter?: { start: Date; end: Date } | null;
  }): Promise<{ payments: Payment[]; total: number }>;
  
  // Payment method storage
  getUserPaymentMethods(userId: number): Promise<PaymentMethod[]>;
  createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: number, paymentMethod: Partial<PaymentMethod>): Promise<PaymentMethod | undefined>;
  deletePaymentMethod(id: number): Promise<boolean>;
  setDefaultPaymentMethod(userId: number, paymentMethodId: number): Promise<void>;

  // Session management
  sessionStore: session.Store;
}

// PostgreSQL implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Item methods
  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async getUserItems(userId: number): Promise<Item[]> {
    return await db.select().from(items).where(eq(items.userId, userId));
  }

  async createItem(item: InsertItem): Promise<Item> {
    const now = new Date();
    const [newItem] = await db
      .insert(items)
      .values({
        ...item,
        registeredAt: now,
        updatedAt: now,
        imageUrls: item.imageUrls || []
      })
      .returning();
    return newItem;
  }

  async updateItem(id: number, itemData: Partial<Item>): Promise<Item | undefined> {
    const updatedData = {
      ...itemData,
      updatedAt: new Date()
    };
    
    const [updatedItem] = await db
      .update(items)
      .set(updatedData)
      .where(eq(items.id, id))
      .returning();
    return updatedItem;
  }

  async deleteItem(id: number): Promise<boolean> {
    const result = await db
      .delete(items)
      .where(eq(items.id, id))
      .returning({ id: items.id });
    return result.length > 0;
  }

  async searchItems(query: string, filters?: { category?: string; status?: string; location?: string }): Promise<Item[]> {
    let conditions = [];
    
    // Add search query condition if provided
    if (query) {
      conditions.push(
        or(
          like(items.name, `%${query}%`),
          like(items.description || '', `%${query}%`),
          like(items.uniqueIdentifier, `%${query}%`)
        )
      );
    }
    
    // Add filters if provided
    if (filters) {
      if (filters.category) {
        conditions.push(eq(items.category, filters.category));
      }
      
      if (filters.status) {
        conditions.push(eq(items.status, filters.status));
      }
      
      if (filters.location) {
        conditions.push(like(items.location || '', `%${filters.location}%`));
      }
    }
    
    // Execute the query with all conditions
    if (conditions.length > 0) {
      return await db
        .select()
        .from(items)
        .where(and(...conditions));
    } else {
      return await db.select().from(items);
    }
  }
  
  async getAllItems(): Promise<Item[]> {
    return await db.select().from(items);
  }

  // Report methods
  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async getUserReports(userId: number): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.userId, userId));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db
      .insert(reports)
      .values(report)
      .returning();
    return newReport;
  }

  async updateReport(id: number, reportData: Partial<Report>): Promise<Report | undefined> {
    const [updatedReport] = await db
      .update(reports)
      .set(reportData)
      .where(eq(reports.id, id))
      .returning();
    return updatedReport;
  }

  async getLostReports(): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.type, 'lost'));
  }

  async getFoundReports(): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.type, 'found'));
  }

  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }

  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentByTransactionRef(transactionRef: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.transactionRef, transactionRef));
    return payment;
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set(paymentData)
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  async getItemPayments(itemId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.itemId, itemId))
      .orderBy(desc(payments.createdAt));
  }

  async getReportPayments(reportId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.reportId, reportId))
      .orderBy(desc(payments.createdAt));
  }
  
  // Admin payment methods
  async getAllPayments(): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt));
  }
  
  async getPaymentsWithFilters(options: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    type?: string;
    dateFilter?: { start: Date; end: Date } | null;
  }): Promise<{ payments: Payment[]; total: number }> {
    const { page, pageSize, search, status, type, dateFilter } = options;
    
    // Build conditions array
    const conditions: any[] = [];
    
    if (status) {
      conditions.push(eq(payments.status, status));
    }
    
    if (type) {
      conditions.push(eq(payments.type, type));
    }
    
    if (dateFilter) {
      conditions.push(
        and(
          sql`${payments.createdAt} >= ${dateFilter.start}`,
          sql`${payments.createdAt} <= ${dateFilter.end}`
        )
      );
    }
    
    // Apply search to transaction reference or ID as string
    if (search) {
      conditions.push(
        or(
          like(payments.transactionRef, `%${search}%`),
          like(payments.transactionId || '', `%${search}%`)
        )
      );
    }
    
    // Get total count with filters
    let query = db.select().from(payments);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // First, get the total count
    const allPayments = await query;
    const total = allPayments.length;
    
    // Apply pagination and ordering
    const paymentsResult = await query
      .orderBy(desc(payments.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    
    return {
      payments: paymentsResult,
      total
    };
  }

  // Payment method storage
  async getUserPaymentMethods(userId: number): Promise<PaymentMethod[]> {
    return await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, userId))
      .orderBy(desc(paymentMethods.createdAt));
  }

  async createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    const [newPaymentMethod] = await db
      .insert(paymentMethods)
      .values(paymentMethod)
      .returning();
    return newPaymentMethod;
  }

  async updatePaymentMethod(id: number, paymentMethodData: Partial<PaymentMethod>): Promise<PaymentMethod | undefined> {
    const [updatedPaymentMethod] = await db
      .update(paymentMethods)
      .set(paymentMethodData)
      .where(eq(paymentMethods.id, id))
      .returning();
    return updatedPaymentMethod;
  }

  async deletePaymentMethod(id: number): Promise<boolean> {
    const result = await db
      .delete(paymentMethods)
      .where(eq(paymentMethods.id, id))
      .returning({ id: paymentMethods.id });
    return result.length > 0;
  }

  async setDefaultPaymentMethod(userId: number, paymentMethodId: number): Promise<void> {
    // First, set all payment methods for this user to non-default
    await db
      .update(paymentMethods)
      .set({ isDefault: false })
      .where(eq(paymentMethods.userId, userId));
    
    // Then set the specified payment method as default
    await db
      .update(paymentMethods)
      .set({ isDefault: true })
      .where(and(
        eq(paymentMethods.id, paymentMethodId),
        eq(paymentMethods.userId, userId)
      ));
  }
}

export const storage = new DatabaseStorage();
