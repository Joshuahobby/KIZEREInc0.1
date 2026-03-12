import { db, pool } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import MemoryStoreFactory from "memorystore";
import { IStorage } from "./storage/types";
import * as userOps from "./storage/user.storage";
import * as adminOps from "./storage/admin.storage";
import * as itemOps from "./storage/item.storage";
import * as reportOps from "./storage/report.storage";
import * as claimOps from "./storage/claim.storage";
import * as notificationOps from "./storage/notification.storage";
import * as paymentOps from "./storage/payment.storage";
import * as verificationOps from "./storage/verification.storage";
import * as chatOps from "./storage/chat.storage";
import {
  User, InsertUser, Item, InsertItem, Report, InsertReport,
  Notification, InsertNotification, Payment, InsertPayment,
  PaymentMethod, InsertPaymentMethod, UserActivityLog, InsertUserActivityLog,
  AdminActionLog, InsertAdminActionLog, Role, InsertRole,
  VerificationRequest, InsertVerificationRequest, StatusChange, InsertStatusChange,
  UserWarning, InsertUserWarning, PaymentPackage, InsertPaymentPackage,
  AccountStatus, VerificationStatus, PaymentType
} from "@shared/schema";

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    if (process.env.NODE_ENV === "production" && process.env.VERCEL === "1") {
      try {
        console.log("⚡ Initializing Postgres Session Store...");
        if (!process.env.DATABASE_URL) {
          throw new Error("DATABASE_URL missing for Postgres session store");
        }

        const PostgresSessionStore = connectPg(session);
        this.sessionStore = new PostgresSessionStore({
          pool,
          createTableIfMissing: true,
          pruneSessionInterval: 60 * 15 // 15 minutes
        });
        console.log("✓ Using Postgres Session Store");
      } catch (error: any) {
        console.error("⚠️ Failed to initialize Postgres Session Store", {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        console.log("🔄 Falling back to MemoryStore for recovery");
        const MemoryStore = MemoryStoreFactory(session);
        this.sessionStore = new MemoryStore({
          checkPeriod: 86400000
        });
      }
    } else {
      const MemoryStore = MemoryStoreFactory(session);
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000
      });
      console.log("✓ Using Memory Session Store");
    }
  }

  // User methods
  getUser = userOps.getUser;
  getUserByUsername = userOps.getUserByUsername;
  getUserByEmail = userOps.getUserByEmail;
  createUser = userOps.createUser;
  updateUser = userOps.updateUser;
  getAllUsers = userOps.getAllUsers;
  getUsersWithFilters = userOps.getUsersWithFilters;
  exportUsers = userOps.exportUsers;
  updateUserStatus = userOps.updateUserStatus;
  updateUserRole = userOps.updateUserRole;
  updateUserVerificationStatus = userOps.updateUserVerificationStatus;
  getUsersByRole = userOps.getUsersByRole;
  updateUserReputation = userOps.updateUserReputation;

  // User activity logs
  getUserActivityLogs = userOps.getUserActivityLogs;
  countUserActivityLogs = userOps.countUserActivityLogs;
  createUserActivityLog = userOps.createUserActivityLog;

  // Admin action logs
  getRecentAdminActions = adminOps.getRecentAdminActions;
  getAdminActionLogs = adminOps.getAdminActionLogs;
  createAdminActionLog = adminOps.createAdminActionLog;

  // Role management
  getRole = adminOps.getRole;
  getRoleByName = adminOps.getRoleByName;
  getAllRoles = adminOps.getAllRoles;
  createRole = adminOps.createRole;
  updateRole = adminOps.updateRole;
  deleteRole = adminOps.deleteRole;


  // Status changes
  getUserStatusHistory = adminOps.getUserStatusHistory;
  createStatusChange = adminOps.createStatusChange;

  // User warnings
  getUserWarnings = adminOps.getUserWarnings;
  createUserWarning = adminOps.createUserWarning;
  acknowledgeWarning = adminOps.acknowledgeWarning;

  // Item methods
  getItem = itemOps.getItem;
  getUserItems = itemOps.getUserItems;
  createItem = itemOps.createItem;
  updateItem = itemOps.updateItem;
  deleteItem = itemOps.deleteItem;
  searchItems = itemOps.searchItems;
  getAllItems = itemOps.getAllItems;
  getItemByUniqueIdentifier = itemOps.getItemByUniqueIdentifier;

  // Report methods
  getReport = reportOps.getReport;
  getUserReports = reportOps.getUserReports;
  createReport = reportOps.createReport;
  updateReport = reportOps.updateReport;
  getLostReports = reportOps.getLostReports;
  getFoundReports = reportOps.getFoundReports;
  getAllReports = reportOps.getAllReports;
  getReportStats = reportOps.getReportStats;
  findPotentialMatches = reportOps.findPotentialMatches;
  getReportsWithFilters = reportOps.getReportsWithFilters;
  getReportWithRelatedData = reportOps.getReportWithRelatedData;
  generateReportCSV = reportOps.generateReportCSV;

  // Claim methods
  getClaim = claimOps.getClaim;
  getClaimWithDetails = claimOps.getClaimWithDetails;
  getClaimsForReport = claimOps.getClaimsForReport;
  getClaimsForReportWithUsers = claimOps.getClaimsForReportWithUsers;
  getUserClaims = claimOps.getUserClaims;
  getUserClaimsWithReports = claimOps.getUserClaimsWithReports;
  getClaimsReceived = claimOps.getClaimsReceived;
  getClaimsReceivedWithDetails = claimOps.getClaimsReceivedWithDetails;
  getUserClaimForReport = claimOps.getUserClaimForReport;
  createClaim = claimOps.createClaim;
  updateClaim = claimOps.updateClaim;
  getClaimStats = claimOps.getClaimStats;
  getClaimsByStatus = claimOps.getClaimsByStatus;
  createClaimStatusLog = claimOps.createClaimStatusLog;
  getClaimStatusHistory = claimOps.getClaimStatusHistory;
  getPendingAppeals = claimOps.getPendingAppeals;
  getAllClaimsWithDetails = claimOps.getAllClaimsWithDetails;

  // Notification methods
  getNotification = notificationOps.getNotification;
  getUserNotifications = notificationOps.getUserNotifications;
  createNotification = notificationOps.createNotification;
  markNotificationAsRead = notificationOps.markNotificationAsRead;
  markAllNotificationsAsRead = notificationOps.markAllNotificationsAsRead;

  // Push Subscription methods
  createPushSubscription = notificationOps.createPushSubscription;
  getUserPushSubscriptions = notificationOps.getUserPushSubscriptions;
  deletePushSubscription = notificationOps.deletePushSubscription;

  // Payment methods
  getPayment = paymentOps.getPayment;
  getPaymentByTransactionRef = paymentOps.getPaymentByTransactionRef;
  getUserPayments = paymentOps.getUserPayments;
  createPayment = paymentOps.createPayment;
  updatePayment = paymentOps.updatePayment;
  getItemPayments = paymentOps.getItemPayments;
  getReportPayments = paymentOps.getReportPayments;

  // Admin payment methods
  getAllPayments = paymentOps.getAllPayments;
  getPaymentsWithFilters = paymentOps.getPaymentsWithFilters;

  // Payment method storage
  getUserPaymentMethods = paymentOps.getUserPaymentMethods;
  createPaymentMethod = paymentOps.createPaymentMethod;
  updatePaymentMethod = paymentOps.updatePaymentMethod;
  deletePaymentMethod = paymentOps.deletePaymentMethod;
  setDefaultPaymentMethod = paymentOps.setDefaultPaymentMethod;

  // Payment packages
  getPaymentPackage = paymentOps.getPaymentPackage;
  getPaymentPackageByType = paymentOps.getPaymentPackageByType;
  getDefaultPackageByType = paymentOps.getDefaultPackageByType;
  createPaymentPackage = paymentOps.createPaymentPackage;
  updatePaymentPackage = paymentOps.updatePaymentPackage;
  deletePaymentPackage = paymentOps.deletePaymentPackage;

  // Verification methods
  createVerificationRequest = verificationOps.createVerificationRequest;
  getVerificationRequest = verificationOps.getVerificationRequest;
  getPendingVerificationRequests = verificationOps.getPendingVerificationRequests;
  updateVerificationRequestStatus = verificationOps.updateVerificationRequestStatus;
  setDefaultPaymentPackage = paymentOps.setDefaultPaymentPackage;
  getAllPaymentPackages = paymentOps.getAllPaymentPackages;

  // Chat methods
  getChat = chatOps.getChat;
  getChatForClaim = chatOps.getChatForClaim;
  getUserChats = chatOps.getUserChats;
  createChat = chatOps.createChat;
  getMessages = chatOps.getMessages;
  createMessage = chatOps.createMessage;
  markMessagesAsRead = chatOps.markMessagesAsRead;
}

export const storage = new DatabaseStorage();
