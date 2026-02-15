import session from "express-session";
import {
  User, InsertUser, Item, InsertItem, Report, InsertReport,
  Notification, InsertNotification, Payment, InsertPayment,
  PaymentMethod, InsertPaymentMethod, UserActivityLog, InsertUserActivityLog,
  AdminActionLog, InsertAdminActionLog, Role, InsertRole,
  VerificationRequest, InsertVerificationRequest, StatusChange, InsertStatusChange,
  UserWarning, InsertUserWarning, PaymentPackage, InsertPaymentPackage,
  Claim, InsertClaim, ClaimAppeal, InsertClaimAppeal, ClaimStatusLog, InsertClaimStatusLog,
  Chat, InsertChat, Message, InsertMessage,
  PushSubscription, InsertPushSubscription,
  AccountStatus, VerificationStatus, PaymentType
} from "@shared/schema";

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
  updateUserReputation(userId: number, pointsDelta: number, itemsReturnedDelta: number): Promise<User | undefined>;

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
  getItemByUniqueIdentifier(identifier: string): Promise<Item | undefined>;

  // Report methods
  getReport(id: number): Promise<Report | undefined>;
  getUserReports(userId: number): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: number, reportData: Partial<Report>): Promise<Report | undefined>;
  getLostReports(): Promise<Report[]>;
  getFoundReports(): Promise<Report[]>;
  getAllReports(): Promise<Report[]>;
  getReportStats(): Promise<any>;
  getReportsWithFilters(options: any): Promise<{ reports: Report[]; total: number; page: number; totalPages: number }>;
  getReportWithRelatedData(id: number): Promise<any>;
  generateReportCSV(): Promise<string>;
  findPotentialMatches(reportId: number): Promise<any[]>;

  // Notification methods
  getNotification(id: number): Promise<Notification | undefined>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;

  // Push Subscription methods
  createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  getUserPushSubscriptions(userId: number): Promise<PushSubscription[]>;
  deletePushSubscription(endpoint: string): Promise<void>;

  // Claim methods
  getClaim(id: number): Promise<Claim | undefined>;
  getClaimWithDetails(id: number): Promise<any>;
  getClaimsForReport(reportId: number): Promise<Claim[]>;
  getClaimsForReportWithUsers(reportId: number): Promise<any[]>;
  getUserClaims(userId: number): Promise<Claim[]>;
  getUserClaimsWithReports(userId: number): Promise<any[]>;
  getClaimsReceived(userId: number): Promise<Claim[]>;
  getClaimsReceivedWithDetails(userId: number): Promise<any[]>;
  getUserClaimForReport(userId: number, reportId: number): Promise<Claim | undefined>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  updateClaim(id: number, claim: Partial<Claim>): Promise<Claim | undefined>;
  getClaimStats(): Promise<any>;
  getClaimsByStatus(status: string): Promise<Claim[]>;
  createClaimStatusLog(log: InsertClaimStatusLog): Promise<ClaimStatusLog>;
  getClaimStatusHistory(claimId: number): Promise<ClaimStatusLog[]>;
  createClaimAppeal(appeal: InsertClaimAppeal): Promise<ClaimAppeal>;
  getClaimAppeal(claimId: number): Promise<ClaimAppeal | undefined>;
  getAppeal(id: number): Promise<ClaimAppeal | undefined>;
  getPendingAppeals(): Promise<ClaimAppeal[]>;
  updateClaimAppeal(id: number, appealData: Partial<ClaimAppeal>): Promise<ClaimAppeal | undefined>;

  // User lookup
  getUsersByRole(roles: string[]): Promise<User[]>;

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

  // Verification methods
  createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest>;
  getVerificationRequest(userId: number): Promise<VerificationRequest | undefined>;
  getPendingVerificationRequests(): Promise<(VerificationRequest & { user: User })[]>;
  updateVerificationRequestStatus(id: number, status: 'approved' | 'rejected', adminId: number, comment?: string): Promise<VerificationRequest | undefined>;
  getAllPaymentPackages(includeInactive?: boolean): Promise<PaymentPackage[]>;

  // Chat methods
  getChat(id: number): Promise<Chat | undefined>;
  getChatForClaim(claimId: number): Promise<Chat | undefined>;
  getUserChats(userId: number): Promise<Chat[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  getMessages(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(chatId: number, userId: number): Promise<void>;

  // Session management
  sessionStore: session.Store;
}
