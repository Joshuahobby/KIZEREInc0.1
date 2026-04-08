import { storage } from "../storage";
import {
  users, retailers, posProducts, ownershipLedger,
  InsertUser, InsertPosProduct, InsertOwnershipLedger,
  Retailer, PosProduct, OwnershipLedgerEntry,
  SUBSCRIPTION_LIMITS, RetailerSubscriptionPlan
} from "@shared/schema";
import { createLogger } from "../utils/logger";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { db } from "../db";
import { eq, and, gte, lte } from "drizzle-orm";

import { notifyPosCustomer } from "./pos-notification.service";
import { emitSecurityAlert } from "../websocket";
import { AuthorizationError, ValidationError, NotFoundError, DatabaseError } from "../utils/error-handler";
import { CommissionService } from "./commission.service";

const logger = createLogger("PosService");

// ─── Customer lookup / instant creation ───

interface CheckOrCreateResult {
  user: typeof users.$inferSelect;
  isNew: boolean;
}

export async function checkOrCreateCustomer(
  nationalId: string,
  fullName: string,
  phone?: string,
  email?: string
): Promise<CheckOrCreateResult> {
  const existing = await storage.getUserByNationalId(nationalId);

  if (existing) {
    logger.info("Customer found by NID", { userId: existing.id, nationalId });
    return { user: existing, isNew: false };
  }

  if (email) {
    const existingWithEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingWithEmail.length > 0) {
      throw new ValidationError("An account with this email address already exists. Please use a different email or leave it empty.");
    }
  }

  const username = `kz_${nationalId.slice(-6)}_${Date.now().toString(36)}`;
  const tempPassword = crypto.randomBytes(16).toString("hex");
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  const placeholderEmail = email || `${username}@pos.kizere.local`;

  const newUser = await storage.createUser({
    username,
    password: hashedPassword,
    fullName,
    nationalId,
    phoneNumber: phone || undefined,
    email: placeholderEmail,
    role: "Subscriber",
    status: "active",
    verificationStatus: "unverified",
    preferences: {} as any,
  });

  logger.info("New customer created via POS", {
    userId: newUser.id,
    nationalId,
    username,
  });

  return { user: newUser, isNew: true };
}

// ─── Product registration & transfer ───

export async function registerProduct(input: any) {
  const retailer = await storage.getRetailer(input.retailerId);
  if (!retailer) throw new Error("Retailer not found");

  const currentProductCount = await storage.countRetailerProducts(input.retailerId);
  const plan = (retailer.subscriptionPlan || "basic") as RetailerSubscriptionPlan;
  const maxProducts = SUBSCRIPTION_LIMITS[plan].maxProducts;

  if (currentProductCount >= maxProducts) {
    throw Object.assign(
      new Error(`Subscription limit reached. Your ${plan} plan allows up to ${maxProducts} products.`),
      { status: 403 }
    );
  }

  const customerDetail = await storage.getRetailerCustomerDetail(input.retailerId, input.ownerId);
  if (customerDetail?.isBlocked) {
    throw new AuthorizationError(`This customer has been blocked by your store.`);
  }

  const dupeCheck = await storage.getPosProductBySerial(input.serialNumber);
  if (dupeCheck) {
    if (dupeCheck.retailerId === input.retailerId && dupeCheck.currentOwnerId === retailer.userId) {
      return transferOwnership({
        productId: dupeCheck.id,
        retailerId: input.retailerId,
        newOwnerId: input.ownerId,
        notes: "Point of Sale transfer from inventory"
      });
    }
    throw Object.assign(new Error(`Product with serial number ${input.serialNumber} already exists`), { status: 409 });
  }

  const stolenStatus = await storage.getGlobalStolenStatus(input.serialNumber);
  if (stolenStatus.isStolen) {
    const itemName = stolenStatus.itemData?.name || input.name;
    emitSecurityAlert(retailer.userId, {
      type: "stolen_item_detected",
      serialNumber: input.serialNumber,
      itemName,
      source: stolenStatus.source || "registry",
      timestamp: new Date().toISOString()
    });

    await logSecurityAlert({
      retailerId: input.retailerId,
      serialNumber: input.serialNumber,
      productName: itemName,
      alertType: stolenStatus.source === 'pos' ? 'local_blocked' : 'global_stolen',
      details: `Attempted registration of item reported stolen.`,
    }).catch(err => logger.error("Failed to persist security alert", { err }));

    throw new AuthorizationError(`SECURITY ALERT: This item has been flagged as stolen.`);
  }

  const product = await storage.createPosProduct({
    ...input,
    status: "registered",
  });

  const ledgerEntry = await storage.createOwnershipLedgerEntry({
    productId: product.id,
    toUserId: input.ownerId,
    registeredBy: input.retailerId,
    event: "sale",
    notes: input.notes || `Initial product registration at POS`,
    purchaseAgreement: input.purchaseAgreement,
    legalDocUrl: input.legalDocUrl,
    metadata: input.metadata,
  });

  notifyPosCustomer("registration", {
    userId: input.ownerId,
    productId: product.id,
    productName: input.name,
    serialNumber: input.serialNumber,
    category: input.category || "Other",
    retailerName: retailer.name,
  }).catch(err => logger.error("POS notification failed", { err }));

  // Record commission silently — never blocks the registration response
  if (input.transactionValue && input.transactionValue > 0) {
    CommissionService.recordCommission(ledgerEntry.id, input.retailerId, input.transactionValue)
      .catch(err => logger.error("Commission recording failed", { err }));
  }

  return { product, ledgerEntry };
}

export async function transferOwnership(input: any) {
  const product = await storage.getPosProduct(input.productId);
  if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
  if (product.status === "stolen") throw new AuthorizationError(`Cannot transfer stolen item.`);
  
  const stolenStatus = await storage.getGlobalStolenStatus(product.serialNumber);
  if (stolenStatus.isStolen) {
    const retailer = await storage.getRetailer(input.retailerId);
    if (retailer) {
      emitSecurityAlert(retailer.userId, {
        type: "stolen_item_detected",
        serialNumber: product.serialNumber,
        itemName: product.name,
        source: stolenStatus.source || "registry",
        timestamp: new Date().toISOString()
      });
      await logSecurityAlert({
        retailerId: input.retailerId,
        serialNumber: product.serialNumber,
        productName: product.name,
        alertType: 'global_stolen',
        details: `Attempted transfer of stolen item.`,
      });
    }
    throw new AuthorizationError(`SECURITY ALERT: Item flagged as stolen.`);
  }

  const customerDetail = await storage.getRetailerCustomerDetail(input.retailerId, input.newOwnerId);
  if (customerDetail?.isBlocked) {
    throw new AuthorizationError(`The recipient customer is blocked.`);
  }

  const previousOwnerId = product.currentOwnerId;
  const updatedProduct = await storage.updatePosProduct(input.productId, {
    currentOwnerId: input.newOwnerId,
    status: "transferred",
  });

  if (!updatedProduct) throw new Error("Failed to update product");

  const ledgerEntry = await storage.createOwnershipLedgerEntry({
    productId: input.productId,
    fromUserId: previousOwnerId,
    toUserId: input.newOwnerId,
    registeredBy: input.retailerId,
    event: "transfer",
    notes: input.notes || "Ownership transfer at POS",
    metadata: input.metadata,
  });

  const retailer = await storage.getRetailer(input.retailerId);
  if (retailer) {
    notifyPosCustomer("transfer", {
      userId: input.newOwnerId,
      productId: updatedProduct.id,
      productName: updatedProduct.name,
      serialNumber: updatedProduct.serialNumber,
      category: updatedProduct.category,
      retailerName: retailer.name,
    }).catch(err => logger.error("POS notification failed", { err }));
  }

  return { product: updatedProduct, ledgerEntry };
}

export async function processReturn(input: {
  productId: number;
  retailerId: number;
  reason: string;
  notes?: string;
  metadata?: any;
}) {
  const product = await storage.getPosProduct(input.productId);
  if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
  if (product.retailerId !== input.retailerId) throw new AuthorizationError("Not authorized for this product");
  if (product.status === "stolen") throw new AuthorizationError("Cannot return a stolen item.");
  
  const retailer = await storage.getRetailer(input.retailerId);
  if (!retailer) throw new Error("Retailer not found");

  const retailerUserId = retailer.userId as number;
  const previousOwnerId = product.currentOwnerId;

  const updatedProduct = await storage.updatePosProduct(input.productId, {
    currentOwnerId: retailerUserId,
    status: "registered",
  });

  if (!updatedProduct) throw new Error("Failed to update product");

  const ledgerEntry = await storage.createOwnershipLedgerEntry({
    productId: input.productId,
    fromUserId: previousOwnerId,
    toUserId: retailerUserId,
    registeredBy: input.retailerId,
    event: "transfer",
    notes: `Product Returned. Reason: ${input.reason}. ${input.notes || ""}`,
    metadata: input.metadata,
  });

  return { product: updatedProduct, ledgerEntry };
}

// ─── Shift Summary ───

export async function getShiftSummary(retailerId: number, shiftDate?: Date) {
  const target = shiftDate || new Date();
  const startOfDay = new Date(target);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(target);
  endOfDay.setHours(23, 59, 59, 999);

  const ledgerEntries = await db
    .select({
      id: ownershipLedger.id,
      event: ownershipLedger.event,
      notes: ownershipLedger.notes,
      timestamp: ownershipLedger.timestamp,
      productId: ownershipLedger.productId,
    })
    .from(ownershipLedger)
    .where(
      and(
        eq(ownershipLedger.registeredBy, retailerId),
        gte(ownershipLedger.timestamp, startOfDay),
        lte(ownershipLedger.timestamp, endOfDay)
      )
    );

  // Get product details for each entry
  const productIds = [...new Set(ledgerEntries.map(e => e.productId))];
  const productDetails: Record<number, { name: string; category: string }> = {};
  for (const pid of productIds) {
    const p = await storage.getPosProduct(pid);
    if (p) productDetails[pid] = { name: p.name, category: p.category };
  }

  // Group by event
  const registrations = ledgerEntries.filter(e => e.event === "sale");
  const transfers = ledgerEntries.filter(e => e.event === "transfer");
  const returns = ledgerEntries.filter(e => e.notes?.startsWith("Product Returned"));
  const stolenReports = ledgerEntries.filter(e => e.event === "stolen_report");

  // Group registrations by category
  const byCategory: Record<string, number> = {};
  for (const entry of registrations) {
    const cat = productDetails[entry.productId]?.category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }

  return {
    date: startOfDay.toISOString(),
    totalRegistrations: registrations.length,
    totalTransfers: transfers.length,
    totalReturns: returns.length,
    totalStolenReports: stolenReports.length,
    totalTransactions: ledgerEntries.length,
    registrationsByCategory: Object.entries(byCategory).map(([category, count]) => ({ category, count })),
    recentEntries: ledgerEntries.slice(-10).reverse().map(e => ({
      ...e,
      productName: productDetails[e.productId]?.name || "Unknown",
      productCategory: productDetails[e.productId]?.category || "Other",
    })),
  };
}

// ─── Retailer CRM & Analytics ───

export async function getRetailerCustomerDetail(retailerId: number, customerId: number) {
  return storage.getRetailerCustomerDetail(retailerId, customerId);
}

export async function getOrCreateRetailerCustomerSettings(retailerId: number, customerId: number) {
  return storage.getOrCreateRetailerCustomerSettings(retailerId, customerId);
}

export async function updateCustomerSettings(retailerId: number, customerId: number, updates: any) {
  return storage.updateRetailerCustomerSettings(retailerId, customerId, updates);
}

export async function getRetailerStats(retailerId: number, startDate?: Date, endDate?: Date) {
  return storage.getRetailerStats(retailerId, startDate, endDate);
}

export async function getPosAnalytics(startDate?: Date, endDate?: Date) {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();
  return storage.getPosAnalytics(start, end);
}

// ─── Retailer CRUD (Admin) ───

export async function createRetailer(data: any) {
  const apiKey = `kzr_${crypto.randomBytes(32).toString("hex")}`;
  const retailer = await storage.createRetailer({ ...data, apiKey, status: "active" });
  await storage.updateUserRole(data.userId, "Retailer");
  return retailer;
}

export async function getRetailers(statusFilter?: string) {
  return storage.getRetailers(statusFilter);
}

export async function getRetailerById(id: number) {
  return storage.getRetailer(id);
}

export async function getRetailerByUserId(userId: number) {
  return storage.getRetailerByUserId(userId);
}

export async function updateRetailer(id: number, data: any) {
  return storage.updateRetailer(id, data);
}

export async function regenerateApiKey(id: number) {
  const newKey = `kzr_${crypto.randomBytes(32).toString("hex")}`;
  return storage.updateRetailer(id, { apiKey: newKey });
}

// ─── Product management & search ───

export async function getProductHistory(productId: number) {
  return storage.getProductHistory(productId);
}

export async function getRetailerProducts(retailerId: number) {
  return storage.getRetailerProducts(retailerId);
}

export async function getOwnerProducts(ownerId: number) {
  return storage.getOwnerProducts(ownerId);
}

export async function searchRetailerProducts(retailerId: number, params: any) {
  return storage.searchRetailerProducts(retailerId, params);
}

export async function getProductHistoryPaginated(productId: number, params: any) {
  return storage.getProductHistoryPaginated(productId, params);
}

export async function getRetailerTransactionsPaginated(retailerId: number, params: any) {
  return storage.getRetailerTransactionsPaginated(retailerId, params);
}

export async function getRetailerCustomersPaginated(retailerId: number, params: any) {
  return storage.getRetailerCustomersPaginated(retailerId, params);
}

export async function getProductById(productId: number, retailerId?: number) {
  return storage.getPosProductByIdAndRetailer(productId, retailerId);
}

export async function archiveProduct(productId: number, retailerId: number) {
  const product = await getProductById(productId, retailerId);
  if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
  const updated = await storage.updatePosProduct(productId, { status: "archived" });
  await storage.createOwnershipLedgerEntry({
    productId,
    fromUserId: product.currentOwnerId,
    toUserId: product.currentOwnerId,
    registeredBy: retailerId,
    event: "sale",
    notes: "Product archived by retailer",
  });
  return updated;
}

export async function recoverProduct(productId: number, retailerId: number, notes?: string) {
  const product = await getProductById(productId, retailerId);
  if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
  const updated = await storage.updatePosProduct(productId, { status: "registered" });
  await storage.createOwnershipLedgerEntry({
    productId,
    toUserId: product.currentOwnerId,
    registeredBy: retailerId,
    event: "recovery",
    notes: notes || "Product recovered",
  });
  return updated;
}

export async function reportProductStolen(productId: number, retailerId: number, notes?: string) {
  const product = await getProductById(productId, retailerId);
  if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
  const updated = await storage.updatePosProduct(productId, { status: "stolen" });
  await storage.createOwnershipLedgerEntry({
    productId,
    toUserId: product.currentOwnerId,
    registeredBy: retailerId,
    event: "stolen_report",
    notes: notes || "Product reported as stolen",
  });
  return updated;
}

export async function checkDuplicateSerial(serialNumber: string) {
  const existing = await storage.getPosProductBySerial(serialNumber);
  return !!existing;
}

export async function bulkRegisterProducts(retailerId: number, items: any[]) {
  const results: { successCount: number; skipped: string[]; errors: string[] } = { 
    successCount: 0, 
    skipped: [], 
    errors: [] 
  };
  const retailer = await storage.getRetailer(retailerId);
  if (!retailer) throw new Error("Retailer not found");
  const retailerUserId = retailer.userId as number;
  for (const item of items) {
    try {
      await registerProduct({ ...item, retailerId, ownerId: retailerUserId });
      results.successCount++;
    } catch (error: any) {
      if (error.status === 409) results.skipped.push(item.serialNumber);
      else results.errors.push(`${item.serialNumber}: ${error.message}`);
    }
  }
  return results;
}

// ─── Security Alerts ───

export async function logSecurityAlert(data: any) {
  return storage.createPosSecurityAlert({
    ...data,
    productId: 0,
    timestamp: new Date(),
  });
}

export async function getRetailerSecurityAlerts(retailerId: number) {
  return storage.getRetailerSecurityAlerts(retailerId);
}

export function isPosStubAccount(email?: string | null): boolean {
  return email?.endsWith("@pos.kizere.local") ?? false;
}
