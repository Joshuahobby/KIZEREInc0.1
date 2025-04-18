import { 
  users, type User, type InsertUser,
  items, type Item, type InsertItem,
  reports, type Report, type InsertReport,
  notifications, type Notification, type InsertNotification
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Item methods
  getItem(id: number): Promise<Item | undefined>;
  getUserItems(userId: number): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, item: Partial<Item>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
  searchItems(query: string, filters?: object): Promise<Item[]>;
  
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
}

// In-memory implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private items: Map<number, Item>;
  private reports: Map<number, Report>;
  private notifications: Map<number, Notification>;
  private userIdCounter: number;
  private itemIdCounter: number;
  private reportIdCounter: number;
  private notificationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.items = new Map();
    this.reports = new Map();
    this.notifications = new Map();
    this.userIdCounter = 1;
    this.itemIdCounter = 1;
    this.reportIdCounter = 1;
    this.notificationIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Item methods
  async getItem(id: number): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async getUserItems(userId: number): Promise<Item[]> {
    return Array.from(this.items.values()).filter(
      (item) => item.userId === userId,
    );
  }

  async createItem(item: InsertItem): Promise<Item> {
    const id = this.itemIdCounter++;
    const now = new Date();
    const newItem: Item = { 
      ...item, 
      id, 
      registeredAt: now,
      updatedAt: now,
      imageUrls: item.imageUrls || []
    };
    this.items.set(id, newItem);
    return newItem;
  }

  async updateItem(id: number, itemData: Partial<Item>): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;
    
    const updatedItem = { 
      ...item, 
      ...itemData, 
      updatedAt: new Date() 
    };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async deleteItem(id: number): Promise<boolean> {
    return this.items.delete(id);
  }

  async searchItems(query: string, filters?: object): Promise<Item[]> {
    let results = Array.from(this.items.values());
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(item => 
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.uniqueIdentifier.toLowerCase().includes(lowerQuery)
      );
    }
    
    if (filters) {
      // Apply filters if provided
      if (filters.hasOwnProperty('category') && filters['category']) {
        results = results.filter(item => item.category === filters['category']);
      }
      
      if (filters.hasOwnProperty('status') && filters['status']) {
        results = results.filter(item => item.status === filters['status']);
      }
      
      if (filters.hasOwnProperty('location') && filters['location']) {
        results = results.filter(item => 
          item.location && item.location.toLowerCase().includes(filters['location'].toLowerCase())
        );
      }
    }
    
    return results;
  }

  // Report methods
  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getUserReports(userId: number): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      (report) => report.userId === userId,
    );
  }

  async createReport(report: InsertReport): Promise<Report> {
    const id = this.reportIdCounter++;
    const now = new Date();
    const newReport: Report = { ...report, id, reportedAt: now };
    this.reports.set(id, newReport);
    return newReport;
  }

  async updateReport(id: number, reportData: Partial<Report>): Promise<Report | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;
    
    const updatedReport = { ...report, ...reportData };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  async getLostReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      (report) => report.type === 'lost',
    );
  }

  async getFoundReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      (report) => report.type === 'found',
    );
  }

  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    const newNotification: Notification = { ...notification, id, createdAt: now };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
}

export const storage = new MemStorage();
