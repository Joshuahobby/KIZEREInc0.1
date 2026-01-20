import { 
  users, type User, type InsertUser,
  items, type Item, type InsertItem,
  reports, type Report, type InsertReport,
  notifications, type Notification, type InsertNotification,
  payments, type Payment, type InsertPayment,
  paymentMethods, type PaymentMethod, type InsertPaymentMethod,
  userActivityLogs, type UserActivityLog, type InsertUserActivityLog,
  adminActionLogs, type AdminActionLog, type InsertAdminActionLog,
  roles, type Role, type InsertRole,
  verificationRequests, type VerificationRequest, type InsertVerificationRequest,
  statusChanges, type StatusChange, type InsertStatusChange,
  userWarnings, type UserWarning, type InsertUserWarning,
  paymentPackages, type PaymentPackage, type InsertPaymentPackage,
  type AccountStatus, type VerificationStatus, type ActivityLevel, type PaymentType
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, like, and, or, desc, asc, not, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import MemoryStoreFactory from "memorystore";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersWithFilters(options: {
    page: number;
    pageSize: number;
    search?: string;
    role?: string;
    status?: string;
    verificationStatus?: string;
    activityLevel?: string;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ users: User[]; total: number }>;
  exportUsers(format: 'csv' | 'excel', filters?: any): Promise<string>;
  updateUserStatus(userId: number, status: AccountStatus, reason?: string, expirationDate?: Date): Promise<StatusChange>;
  updateUserRole(userId: number, role: string): Promise<User | undefined>;
  updateUserVerificationStatus(userId: number, status: VerificationStatus): Promise<User | undefined>;
  
  // User activity logs
  getUserActivityLogs(userId: number, page: number, pageSize: number): Promise<UserActivityLog[]>;
  countUserActivityLogs(userId: number): Promise<number>;
  createUserActivityLog(log: InsertUserActivityLog): Promise<UserActivityLog>;
  
  // Admin action logs
  getRecentAdminActions(limit?: number): Promise<AdminActionLog[]>;
  getAdminActionLogs(filters?: {
    adminId?: number;
    targetUserId?: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }): Promise<{ logs: AdminActionLog[]; total: number }>;
  createAdminActionLog(log: InsertAdminActionLog): Promise<AdminActionLog>;

  // Role management
  getRole(id: number): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  getAllRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<Role>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;
  
  // Verification requests
  getVerificationRequest(id: number): Promise<VerificationRequest | undefined>;
  getUserVerificationRequests(userId: number): Promise<VerificationRequest[]>;
  getPendingVerificationRequests(page: number, pageSize: number): Promise<{ requests: VerificationRequest[]; total: number }>;
  createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest>;
  updateVerificationRequest(id: number, request: Partial<VerificationRequest>): Promise<VerificationRequest | undefined>;
  
  // Status changes
  getUserStatusHistory(userId: number): Promise<StatusChange[]>;
  createStatusChange(change: InsertStatusChange): Promise<StatusChange>;
  
  // User warnings
  getUserWarnings(userId: number): Promise<UserWarning[]>;
  createUserWarning(warning: InsertUserWarning): Promise<UserWarning>;
  acknowledgeWarning(id: number): Promise<UserWarning | undefined>;
  
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
  
  // Payment packages
  getPaymentPackage(id: number): Promise<PaymentPackage | undefined>;
  getPaymentPackageByType(type: PaymentType, onlyActive?: boolean): Promise<PaymentPackage[]>;
  getDefaultPackageByType(type: PaymentType): Promise<PaymentPackage | undefined>;
  createPaymentPackage(paymentPackage: InsertPaymentPackage): Promise<PaymentPackage>;
  updatePaymentPackage(id: number, paymentPackage: Partial<PaymentPackage>): Promise<PaymentPackage | undefined>;
  deletePaymentPackage(id: number): Promise<boolean>;
  setDefaultPaymentPackage(id: number): Promise<PaymentPackage | undefined>;
  getAllPaymentPackages(includeInactive?: boolean): Promise<PaymentPackage[]>;

  // Session management
  sessionStore: session.Store;
}

// PostgreSQL implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    if (process.env.NODE_ENV === "production") {
      const PostgresSessionStore = connectPg(session);
      this.sessionStore = new PostgresSessionStore({ 
        pool, 
        createTableIfMissing: true 
      });
    } else {
      const MemoryStore = MemoryStoreFactory(session);
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      });
    }
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
  
  async getUsersWithFilters(options: {
    page: number;
    pageSize: number;
    search?: string;
    role?: string;
    status?: string;
    verificationStatus?: string;
    activityLevel?: string;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ users: User[]; total: number }> {
    const {
      page,
      pageSize,
      search,
      role,
      status,
      verificationStatus,
      activityLevel,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Build conditions array
    const conditions: any[] = [];
    
    // Add search condition
    if (search) {
      conditions.push(
        or(
          like(users.fullName, `%${search}%`),
          like(users.username, `%${search}%`),
          like(users.email, `%${search}%`),
          like(users.phoneNumber || '', `%${search}%`)
        )
      );
    }
    
    // Add role filter
    if (role) {
      conditions.push(eq(users.role, role));
    }
    
    // Add status filter
    if (status) {
      conditions.push(eq(users.status, status));
    }
    
    // Add verification status filter
    if (verificationStatus) {
      conditions.push(eq(users.verificationStatus, verificationStatus));
    }
    
    // Add activity level filter
    if (activityLevel) {
      conditions.push(eq(users.activityLevel, activityLevel));
    }
    
    // Add date range filter
    if (startDate && endDate) {
      conditions.push(
        and(
          sql`${users.createdAt} >= ${startDate}`,
          sql`${users.createdAt} <= ${endDate}`
        )
      );
    } else if (startDate) {
      conditions.push(sql`${users.createdAt} >= ${startDate}`);
    } else if (endDate) {
      conditions.push(sql`${users.createdAt} <= ${endDate}`);
    }
    
    // Calculate total count
    const totalQuery = conditions.length > 0
      ? db.select({ count: sql<number>`count(*)` }).from(users).where(and(...conditions))
      : db.select({ count: sql<number>`count(*)` }).from(users);
    
    const totalResult = await totalQuery;
    const count = totalResult[0]?.count || 0;
    
    // Get paginated users with sorting
    const offset = (page - 1) * pageSize;
    
    let query: any = db.select().from(users);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Apply sorting
    if (sortBy && sortOrder) {
      const column = users[sortBy as keyof typeof users];
      if (column) {
        query = sortOrder === 'asc'
          ? query.orderBy(asc(column as any))
          : query.orderBy(desc(column as any));
      } else {
        // Default sort by createdAt if column doesn't exist
        query = sortOrder === 'asc'
          ? query.orderBy(asc(users.createdAt))
          : query.orderBy(desc(users.createdAt));
      }
    } else {
      // Default sort by createdAt desc
      query = query.orderBy(desc(users.createdAt));
    }
    
    // Apply pagination
    query = query.limit(pageSize).offset(offset);
    
    const usersList = await query;
    
    return {
      users: usersList,
      total: Number(count)
    };
  }
  
  async exportUsers(format: 'csv' | 'excel', filters?: any): Promise<string> {
    // Retrieve users based on filters
    let usersList: User[] = [];
    
    if (filters) {
      const { users } = await this.getUsersWithFilters({
        page: 1,
        pageSize: 1000, // Get a larger batch for export
        ...filters
      });
      usersList = users;
    } else {
      usersList = await this.getAllUsers();
    }
    
    // Format the data based on the requested format
    if (format === 'csv') {
      const headers = ['ID', 'Full Name', 'Username', 'Email', 'Phone Number', 'Role', 'Status', 'Verification Status', 'Created At', 'Last Login'];
      
      const rows = usersList.map(user => [
        user.id.toString(),
        user.fullName,
        user.username,
        user.email,
        user.phoneNumber || '',
        user.role,
        user.status || 'active',
        user.verificationStatus || 'pending',
        user.createdAt.toISOString(),
        user.lastLogin ? user.lastLogin.toISOString() : ''
      ]);
      
      // Generate CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      return csvContent;
    } else if (format === 'excel') {
      // For simplicity, we'll return the same format as CSV
      // In a real application, you would use a library like ExcelJS to generate a proper Excel file
      return this.exportUsers('csv', filters);
    }
    
    throw new Error('Unsupported export format');
  }
  
  async updateUserStatus(userId: number, status: AccountStatus, reason?: string, expirationDate?: Date): Promise<StatusChange> {
    // Get current user status
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const previousStatus = user.status || 'active';
    
    // Update user status
    await this.updateUser(userId, { 
      status, 
      updatedAt: new Date() 
    });
    
    // Create status change record
    const statusChange: InsertStatusChange = {
      userId,
      previousStatus,
      newStatus: status,
      reason: reason || null,
      changedBy: null, // This should be set by the API with the current admin ID
      expirationDate: expirationDate || null,
      notes: null
    };
    
    return await this.createStatusChange(statusChange);
  }
  
  async updateUserRole(userId: number, role: string): Promise<User | undefined> {
    return await this.updateUser(userId, { 
      role,
      updatedAt: new Date() 
    });
  }
  
  async updateUserVerificationStatus(userId: number, status: VerificationStatus): Promise<User | undefined> {
    return await this.updateUser(userId, { 
      verificationStatus: status,
      updatedAt: new Date() 
    });
  }
  
  // User activity logs
  async countUserActivityLogs(userId: number): Promise<number> {
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userActivityLogs)
      .where(eq(userActivityLogs.userId, userId));
    
    return Number(totalResult?.count || 0);
  }
  
  async getUserActivityLogs(userId: number, page: number, pageSize: number): Promise<UserActivityLog[]> {
    const offset = (page - 1) * pageSize;
    const logs = await db
      .select()
      .from(userActivityLogs)
      .where(eq(userActivityLogs.userId, userId))
      .orderBy(desc(userActivityLogs.timestamp))
      .limit(pageSize)
      .offset(offset);
    
    return logs;
  }
  
  async createUserActivityLog(log: InsertUserActivityLog): Promise<UserActivityLog> {
    const [newLog] = await db
      .insert(userActivityLogs)
      .values(log)
      .returning();
    return newLog;
  }
  
  // Admin action logs
  async getRecentAdminActions(limit: number = 20): Promise<AdminActionLog[]> {
    return await db.select()
      .from(adminActionLogs)
      .orderBy(desc(adminActionLogs.timestamp))
      .limit(limit);
  }

  // Admin action logs
  async getAdminActionLogs(filters?: {
    adminId?: number;
    targetUserId?: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }): Promise<{ logs: AdminActionLog[]; total: number }> {
    const {
      adminId,
      targetUserId,
      action,
      startDate,
      endDate,
      page = 1,
      pageSize = 10
    } = filters || {};
    
    // Build conditions
    const conditions: any[] = [];
    
    if (adminId) {
      conditions.push(eq(adminActionLogs.adminId, adminId));
    }
    
    if (targetUserId) {
      conditions.push(eq(adminActionLogs.targetUserId, targetUserId));
    }
    
    if (action) {
      conditions.push(eq(adminActionLogs.action, action));
    }
    
    // Add date range filter
    if (startDate && endDate) {
      conditions.push(
        and(
          sql`${adminActionLogs.timestamp} >= ${startDate}`,
          sql`${adminActionLogs.timestamp} <= ${endDate}`
        )
      );
    } else if (startDate) {
      conditions.push(sql`${adminActionLogs.timestamp} >= ${startDate}`);
    } else if (endDate) {
      conditions.push(sql`${adminActionLogs.timestamp} <= ${endDate}`);
    }
    
    // Calculate total count
    const totalQuery = conditions.length > 0
      ? db.select({ count: sql<number>`count(*)` }).from(adminActionLogs).where(and(...conditions))
      : db.select({ count: sql<number>`count(*)` }).from(adminActionLogs);
    
    const totalResult = await totalQuery;
    const count = totalResult[0]?.count || 0;
    
    // Get paginated logs
    const offset = (page - 1) * pageSize;
    
    let query: any = db.select().from(adminActionLogs);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query
      .orderBy(desc(adminActionLogs.timestamp))
      .limit(pageSize)
      .offset(offset);
      
    const results = await query;
    
    return {
      logs: results,
      total: Number(count)
    };
  }
  
  async createAdminActionLog(log: InsertAdminActionLog): Promise<AdminActionLog> {
    const [newLog] = await db
      .insert(adminActionLogs)
      .values(log)
      .returning();
    return newLog;
  }
  
  // Role management
  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, id));
    return role;
  }
  
  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, name));
    return role;
  }
  
  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }
  
  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db
      .insert(roles)
      .values(role)
      .returning();
    return newRole;
  }
  
  async updateRole(id: number, roleData: Partial<Role>): Promise<Role | undefined> {
    const now = new Date();
    const [updatedRole] = await db
      .update(roles)
      .set({
        ...roleData,
        updatedAt: now
      })
      .where(eq(roles.id, id))
      .returning();
    return updatedRole;
  }
  
  async deleteRole(id: number): Promise<boolean> {
    const result = await db
      .delete(roles)
      .where(eq(roles.id, id))
      .returning({ id: roles.id });
    return result.length > 0;
  }
  
  // Verification requests
  async getVerificationRequest(id: number): Promise<VerificationRequest | undefined> {
    const [request] = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.id, id));
    return request;
  }
  
  async getUserVerificationRequests(userId: number): Promise<VerificationRequest[]> {
    return await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.userId, userId))
      .orderBy(desc(verificationRequests.submittedAt));
  }
  
  async getPendingVerificationRequests(page: number, pageSize: number): Promise<{ requests: VerificationRequest[]; total: number }> {
    // Count total pending requests
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(verificationRequests)
      .where(eq(verificationRequests.status, 'pending'));
    
    const count = totalResult[0]?.count || 0;
    
    // Get paginated pending requests
    const offset = (page - 1) * pageSize;
    const requests = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.status, 'pending'))
      .orderBy(desc(verificationRequests.submittedAt))
      .limit(pageSize)
      .offset(offset);
    
    return {
      requests,
      total: Number(count)
    };
  }
  
  async createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest> {
    const [newRequest] = await db
      .insert(verificationRequests)
      .values({
        ...request,
        documentUrls: request.documentUrls || []
      })
      .returning();
    return newRequest;
  }
  
  async updateVerificationRequest(id: number, requestData: Partial<VerificationRequest>): Promise<VerificationRequest | undefined> {
    const [updatedRequest] = await db
      .update(verificationRequests)
      .set(requestData)
      .where(eq(verificationRequests.id, id))
      .returning();
    return updatedRequest;
  }
  
  // Status changes
  async getUserStatusHistory(userId: number): Promise<StatusChange[]> {
    return await db
      .select()
      .from(statusChanges)
      .where(eq(statusChanges.userId, userId))
      .orderBy(desc(statusChanges.timestamp));
  }
  
  async createStatusChange(change: InsertStatusChange): Promise<StatusChange> {
    const [newChange] = await db
      .insert(statusChanges)
      .values(change)
      .returning();
    return newChange;
  }
  
  // User warnings
  async getUserWarnings(userId: number): Promise<UserWarning[]> {
    return await db
      .select()
      .from(userWarnings)
      .where(eq(userWarnings.userId, userId))
      .orderBy(desc(userWarnings.issuedAt));
  }
  
  async createUserWarning(warning: InsertUserWarning): Promise<UserWarning> {
    const [newWarning] = await db
      .insert(userWarnings)
      .values(warning)
      .returning();
    return newWarning;
  }
  
  async acknowledgeWarning(id: number): Promise<UserWarning | undefined> {
    const [acknowledgedWarning] = await db
      .update(userWarnings)
      .set({ acknowledgedAt: new Date() })
      .where(eq(userWarnings.id, id))
      .returning();
    return acknowledgedWarning;
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
  
  async getPaginatedItems(options: {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    search?: string;
    category?: string;
    status?: string;
    // Advanced filters
    ownerName?: string;
    serialNumber?: string;
    location?: string;
    minValue?: number;
    maxValue?: number;
    registeredAfter?: Date;
    registeredBefore?: Date;
    hasReports?: boolean;
    reportType?: string;
  }): Promise<{ items: Item[]; total: number; page: number; totalPages: number }> {
    const { 
      page, 
      limit, 
      sortBy, 
      sortOrder, 
      search, 
      category, 
      status,
      ownerName,
      serialNumber,
      location,
      minValue,
      maxValue,
      registeredAfter,
      registeredBefore,
      hasReports,
      reportType
    } = options;
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build conditions array for filtering
    const conditions = [];
    
    // Add search condition if provided
    if (search) {
      conditions.push(
        or(
          like(items.name, `%${search}%`),
          like(items.description || '', `%${search}%`),
          like(items.uniqueIdentifier, `%${search}%`)
        )
      );
    }
    
    // Add category filter if provided
    if (category) {
      conditions.push(eq(items.category, category));
    }
    
    // Add status filter if provided
    if (status) {
      conditions.push(eq(items.status, status));
    }
    
    // Add advanced filter conditions
    
    // Filter by serial number
    if (serialNumber) {
      conditions.push(
        sql`${items.details}->>'serialNumber' ILIKE ${`%${serialNumber}%`}`
      );
    }
    
    // Filter by location
    if (location) {
      conditions.push(like(items.location || '', `%${location}%`));
    }
    
    // Filter by value range
    if (minValue !== undefined) {
      conditions.push(
        sql`(${items.details}->>'estimatedValue')::float >= ${minValue}`
      );
    }
    
    if (maxValue !== undefined) {
      conditions.push(
        sql`(${items.details}->>'estimatedValue')::float <= ${maxValue}`
      );
    }
    
    // Filter by registration date range
    if (registeredAfter) {
      conditions.push(
        sql`${items.registeredAt} >= ${registeredAfter}`
      );
    }
    
    if (registeredBefore) {
      conditions.push(
        sql`${items.registeredAt} <= ${registeredBefore}`
      );
    }
    
    // Handle owner name filter - need to join with users table
    if (ownerName) {
      // We'll handle the owner name filter in a separate query
      // because it requires a join with the users table
      const usersWithName = await db
        .select({ id: users.id })
        .from(users)
        .where(
          or(
            like(users.fullName, `%${ownerName}%`),
            like(users.username, `%${ownerName}%`)
          )
        );
      
      if (usersWithName.length > 0) {
        const userIds = usersWithName.map(user => user.id);
        conditions.push(
          sql`${items.userId} IN (${userIds.join(', ')})`
        );
      } else {
        // If no users match the name search, return no results
        conditions.push(sql`1 = 0`); // Always false condition
      }
    }
    
    // Handle report filters
    if (hasReports) {
      if (reportType && reportType !== 'any') {
        // Get items with specific report type
        const itemsWithReports = await db
          .select({ id: reports.itemId })
          .from(reports)
          .where(
            and(
              sql`${reports.itemId} IS NOT NULL`,
              eq(reports.type, reportType)
            )
          );
        
        if (itemsWithReports.length > 0) {
          const itemIds = itemsWithReports.map(item => item.id);
          conditions.push(
            sql`${items.id} IN (${itemIds.join(', ')})`
          );
        } else {
          conditions.push(sql`1 = 0`); // Always false condition
        }
      } else {
        // Get items with any report type
        const itemsWithReports = await db
          .select({ id: reports.itemId })
          .from(reports)
          .where(sql`${reports.itemId} IS NOT NULL`);
        
        if (itemsWithReports.length > 0) {
          const itemIds = itemsWithReports.map(item => item.id);
          conditions.push(
            sql`${items.id} IN (${itemIds.join(', ')})`
          );
        } else {
          conditions.push(sql`1 = 0`); // Always false condition
        }
      }
    }
    
    // Get total count of matching items
    const countResult = await db
      .select({ count: sql`count(*)::int` })
      .from(items)
      .where(conditions.length ? and(...conditions) : undefined);
      
    const total = Number(countResult[0].count);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    // Get sorted and paginated items
    let query: any = db
      .select()
      .from(items)
      .where(conditions.length ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset);
      
    // Apply sorting
    if (sortBy === 'registeredAt') {
      query = sortOrder === 'asc' 
        ? query.orderBy(asc(items.registeredAt))
        : query.orderBy(desc(items.registeredAt));
    } else if (sortBy === 'updatedAt') {
      query = sortOrder === 'asc' 
        ? query.orderBy(asc(items.updatedAt))
        : query.orderBy(desc(items.updatedAt));
    } else if (sortBy === 'name') {
      query = sortOrder === 'asc' 
        ? query.orderBy(asc(items.name))
        : query.orderBy(desc(items.name));
    } else if (sortBy === 'category') {
      query = sortOrder === 'asc' 
        ? query.orderBy(asc(items.category))
        : query.orderBy(desc(items.category));
    } else if (sortBy === 'status') {
      query = sortOrder === 'asc' 
        ? query.orderBy(asc(items.status))
        : query.orderBy(desc(items.status));
    } else {
      // Default sort by registeredAt desc
      query = query.orderBy(desc(items.registeredAt));
    }
    
    const result = await query;
    
    return {
      items: result,
      total: Number(total),
      page,
      totalPages
    };
  }
  
  async getItemReports(itemId: number): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.itemId, itemId));
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
  
  async getAllReports(): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .orderBy(desc(reports.reportedAt));
  }
  
  async getReportStats(): Promise<{
    totalReports: number;
    lostReports: number;
    foundReports: number;
    openReports: number;
    inProgressReports: number;
    resolvedReports: number;
    closedReports: number;
    reportsThisWeek: number;
    reportsThisMonth: number;
  }> {
    // Get all reports
    const allReports = await this.getAllReports();
    
    // Calculate date thresholds
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Return the statistics
    return {
      totalReports: allReports.length,
      lostReports: allReports.filter(report => report.type === 'lost').length,
      foundReports: allReports.filter(report => report.type === 'found').length,
      openReports: allReports.filter(report => report.status === 'Open').length,
      inProgressReports: allReports.filter(report => report.status === 'In_Progress').length,
      resolvedReports: allReports.filter(report => report.status === 'Resolved').length,
      closedReports: allReports.filter(report => report.status === 'Closed').length,
      reportsThisWeek: allReports.filter(report => new Date(report.reportedAt) >= oneWeekAgo).length,
      reportsThisMonth: allReports.filter(report => new Date(report.reportedAt) >= oneMonthAgo).length
    };
  }
  
  async getReportsWithFilters(options: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    type?: string;
    status?: string;
    dateRange?: { start: Date; end: Date } | null;
    userId?: number;
    itemId?: number;
    location?: string;
  }): Promise<{ reports: Report[]; total: number; page: number; totalPages: number }> {
    const { 
      page, 
      limit, 
      sortBy = 'reportedAt', 
      sortOrder = 'desc', 
      search,
      type,
      status,
      dateRange,
      userId,
      itemId,
      location
    } = options;
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build conditions array for filtering
    const conditions = [];
    
    // Add search condition if provided
    if (search) {
      conditions.push(
        or(
          like(reports.title, `%${search}%`),
          like(reports.description, `%${search}%`)
        )
      );
    }
    
    // Add type filter if provided
    if (type) {
      conditions.push(eq(reports.type, type));
    }
    
    // Add status filter if provided
    if (status) {
      conditions.push(eq(reports.status, status));
    }
    
    // Add date range filter if provided
    if (dateRange) {
      conditions.push(
        and(
          sql`${reports.date} >= ${dateRange.start}`,
          sql`${reports.date} <= ${dateRange.end}`
        )
      );
    }
    
    // Add user filter if provided
    if (userId) {
      conditions.push(eq(reports.userId, userId));
    }
    
    // Add item filter if provided
    if (itemId) {
      conditions.push(eq(reports.itemId, itemId));
    }
    
    // Add location filter if provided
    if (location) {
      conditions.push(like(reports.location, `%${location}%`));
    }
    
    // Get total count of matching reports
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reports)
      .where(conditions.length ? and(...conditions) : undefined);
    
    const total = Number(countResult[0]?.count || 0);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    // Get sorted and paginated reports
    let query: any = db
      .select()
      .from(reports)
      .where(conditions.length ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset);
    
    // Apply sorting
    if (sortBy === 'reportedAt') {
      query = sortOrder === 'asc' 
        ? query.orderBy(asc(reports.reportedAt))
        : query.orderBy(desc(reports.reportedAt));
    } else if (sortBy === 'date') {
      query = sortOrder === 'asc' 
        ? query.orderBy(asc(reports.date))
        : query.orderBy(desc(reports.date));
    } else if (sortBy === 'title') {
      query = sortOrder === 'asc' 
        ? query.orderBy(asc(reports.title))
        : query.orderBy(desc(reports.title));
    } else if (sortBy === 'status') {
      query = sortOrder === 'asc' 
        ? query.orderBy(asc(reports.status))
        : query.orderBy(desc(reports.status));
    } else if (sortBy === 'type') {
      query = sortOrder === 'asc' 
        ? query.orderBy(asc(reports.type))
        : query.orderBy(desc(reports.type));
    } else {
      // Default sort by reportedAt desc
      query = query.orderBy(desc(reports.reportedAt));
    }
    
    const result = await query;
    
    return {
      reports: result,
      total,
      page,
      totalPages
    };
  }
  
  async getReportWithRelatedData(id: number): Promise<{
    report: Report | undefined;
    user?: User;
    item?: Item;
  }> {
    const report = await this.getReport(id);
    
    if (!report) {
      return { report: undefined };
    }
    
    // Get user who created the report
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, report.userId));
    
    // Get item if associated
    let item = undefined;
    if (report.itemId) {
      [item] = await db
        .select()
        .from(items)
        .where(eq(items.id, report.itemId));
    }
    
    return {
      report,
      user,
      item
    };
  }
  
  async generateReportCSV(): Promise<string> {
    const allReports = await this.getAllReports();
    
    // Define CSV headers
    const csvHeaders = [
      'ID', 'Type', 'Title', 'Description', 'Location', 'Date', 
      'Status', 'User ID', 'Item ID', 'Contact Info', 'Reported At'
    ];
    
    // Convert reports to CSV format
    const csvRows = allReports.map(report => [
      report.id,
      report.type,
      `"${report.title.replace(/"/g, '""')}"`,
      `"${report.description.replace(/"/g, '""')}"`,
      `"${report.location.replace(/"/g, '""')}"`,
      new Date(report.date).toISOString().split('T')[0],
      report.status,
      report.userId,
      report.itemId || '',
      report.contactInfo ? `"${report.contactInfo.replace(/"/g, '""')}"` : '',
      new Date(report.reportedAt).toISOString()
    ]);
    
    // Combine headers and rows
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
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
    let query: any = db.select().from(payments);
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
      total: Number(total)
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
  
  // Payment Package methods
  async getPaymentPackage(id: number): Promise<PaymentPackage | undefined> {
    const [package_] = await db
      .select()
      .from(paymentPackages)
      .where(eq(paymentPackages.id, id));
    return package_;
  }

  async getPaymentPackageByType(type: PaymentType, onlyActive: boolean = true): Promise<PaymentPackage[]> {
    let query: any = db
      .select()
      .from(paymentPackages)
      .where(eq(paymentPackages.type, type));
    
    if (onlyActive) {
      query = query.where(eq(paymentPackages.status, 'active'));
    }
    
    return await query.orderBy(desc(paymentPackages.isDefault));
  }

  async getDefaultPackageByType(type: PaymentType): Promise<PaymentPackage | undefined> {
    const [package_] = await db
      .select()
      .from(paymentPackages)
      .where(and(
        eq(paymentPackages.type, type),
        eq(paymentPackages.isDefault, true),
        eq(paymentPackages.status, 'active')
      ));
    return package_;
  }

  async createPaymentPackage(paymentPackage: InsertPaymentPackage): Promise<PaymentPackage> {
    // If this is the first package of this type, make it default
    const existingPackages = await this.getPaymentPackageByType(paymentPackage.type, false);
    
    if (existingPackages.length === 0) {
      paymentPackage.isDefault = true;
    }
    
    // If marking this package as default, unset default for other packages of same type
    if (paymentPackage.isDefault) {
      await db
        .update(paymentPackages)
        .set({ isDefault: false })
        .where(eq(paymentPackages.type, paymentPackage.type));
    }
    
    const [newPackage] = await db
      .insert(paymentPackages)
      .values({
        ...paymentPackage,
        amount: paymentPackage.amount.toString() as any
      })
      .returning();
    return newPackage;
  }

  async updatePaymentPackage(id: number, packageData: Partial<PaymentPackage>): Promise<PaymentPackage | undefined> {
    const package_ = await this.getPaymentPackage(id);
    if (!package_) {
      return undefined;
    }
    
    // If updating to make this default, unset default flag on other packages
    if (packageData.isDefault) {
      await db
        .update(paymentPackages)
        .set({ isDefault: false })
        .where(and(
          eq(paymentPackages.type, package_.type),
          not(eq(paymentPackages.id, id))
        ));
    }
    
    const [updatedPackage] = await db
      .update(paymentPackages)
      .set({
        ...packageData,
        updatedAt: new Date()
      })
      .where(eq(paymentPackages.id, id))
      .returning();
    return updatedPackage;
  }

  async deletePaymentPackage(id: number): Promise<boolean> {
    const package_ = await this.getPaymentPackage(id);
    if (!package_) {
      return false;
    }
    
    // If deleting default package, make another package the default
    if (package_.isDefault) {
      const [newDefault] = await db
        .select()
        .from(paymentPackages)
        .where(and(
          eq(paymentPackages.type, package_.type),
          not(eq(paymentPackages.id, id)),
          eq(paymentPackages.status, 'active')
        ))
        .limit(1);
        
      if (newDefault) {
        await this.setDefaultPaymentPackage(newDefault.id);
      }
    }
    
    const result = await db
      .delete(paymentPackages)
      .where(eq(paymentPackages.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async setDefaultPaymentPackage(id: number): Promise<PaymentPackage | undefined> {
    const package_ = await this.getPaymentPackage(id);
    if (!package_) {
      return undefined;
    }
    
    // Set all packages of same type to non-default
    await db
      .update(paymentPackages)
      .set({ isDefault: false })
      .where(eq(paymentPackages.type, package_.type));
    
    // Set this package as default
    return this.updatePaymentPackage(id, { isDefault: true });
  }

  async getAllPaymentPackages(includeInactive: boolean = false): Promise<PaymentPackage[]> {
    let query: any = db.select().from(paymentPackages);
    
    if (!includeInactive) {
      query = query.where(eq(paymentPackages.status, 'active'));
    }
    
    return await query.orderBy(asc(paymentPackages.type), desc(paymentPackages.isDefault));
  }
}

export const storage = new DatabaseStorage();
