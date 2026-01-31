import { db, pool } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import MemoryStoreFactory from "memorystore";
import { IStorage } from "./storage/types";
import * as userOps from "./storage/user.storage";
import * as adminOps from "./storage/admin.storage";
import * as itemOps from "./storage/item.storage";
import * as reportOps from "./storage/report.storage";
import * as notificationOps from "./storage/notification.storage";
import * as paymentOps from "./storage/payment.storage";
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
    if (process.env.NODE_ENV === "production") {
      const PostgresSessionStore = connectPg(session);
      this.sessionStore = new PostgresSessionStore({ 
        pool, 
        createTableIfMissing: true 
      });
    } else {
      const MemoryStore = MemoryStoreFactory(session);
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000
      });
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
  
  // Verification requests
  getVerificationRequest = adminOps.getVerificationRequest;
  getUserVerificationRequests = adminOps.getUserVerificationRequests;
  getPendingVerificationRequests = adminOps.getPendingVerificationRequests;
  createVerificationRequest = adminOps.createVerificationRequest;
  updateVerificationRequest = adminOps.updateVerificationRequest;
  
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
  
  // Report methods
  getReport = reportOps.getReport;
  getUserReports = reportOps.getUserReports;
  createReport = reportOps.createReport;
  updateReport = reportOps.updateReport;
  getLostReports = reportOps.getLostReports;
  getFoundReports = reportOps.getFoundReports;
  
  // Notification methods
  getNotification = notificationOps.getNotification;
  getUserNotifications = notificationOps.getUserNotifications;
  createNotification = notificationOps.createNotification;
  markNotificationAsRead = notificationOps.markNotificationAsRead;

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
  setDefaultPaymentPackage = paymentOps.setDefaultPaymentPackage;
  getAllPaymentPackages = paymentOps.getAllPaymentPackages;
}

export const storage = new DatabaseStorage();
