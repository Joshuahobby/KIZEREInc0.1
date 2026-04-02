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

import { notifyPosCustomer } from "./pos-notification.service";

const logger = createLogger("PosService");

// ─── Customer lookup / instant creation ───

interface CheckOrCreateResult {
  user: typeof users.$inferSelect;
  isNew: boolean;
}

/**
 * Looks up a customer by nationalId. If not found, creates a stub account instantly.
 */
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

  // Create stub account
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

// ─── Product registration ───

interface RegisterProductInput {
  serialNumber: string;
  name: string;
  category?: string;
  sku?: string;
  retailerId: number;
  ownerId: number;
  metadata?: Record<string, any>;
}

interface RegisterProductResult {
  product: PosProduct;
  ledgerEntry: OwnershipLedgerEntry;
}

/**
 * Registers a new product to its owner and creates the initial ownership ledger entry.
 */
export async function registerProduct(
  input: RegisterProductInput
): Promise<RegisterProductResult> {
  // 1. Get retailer and check subscription limits
  const retailer = await storage.getRetailer(input.retailerId);

  if (!retailer) {
    throw new Error("Retailer not found");
  }

  const currentProductCount = await storage.countRetailerProducts(input.retailerId);

  const plan = (retailer.subscriptionPlan || "basic") as RetailerSubscriptionPlan;
  const maxProducts = SUBSCRIPTION_LIMITS[plan].maxProducts;

  if (currentProductCount >= maxProducts) {
    throw Object.assign(
      new Error(`Subscription limit reached. Your ${plan} plan allows up to ${maxProducts} products.`),
      { status: 403 }
    );
  }

  // 2. Check for duplicate serial
  const dupeCheck = await storage.getPosProductBySerial(input.serialNumber);

  if (dupeCheck) {
    // If it's already in the retailer's inventory (registered to themselves), 
    // treat this POS registration as a Point-of-Sale transfer/checkout.
    if (dupeCheck.retailerId === input.retailerId && dupeCheck.currentOwnerId === retailer.userId) {
      return transferOwnership({
        productId: dupeCheck.id,
        retailerId: input.retailerId,
        newOwnerId: input.ownerId,
        notes: "Point of Sale transfer from inventory"
      });
    }

    throw Object.assign(
      new Error(`Product with serial number ${input.serialNumber} already exists`),
      { status: 409 }
    );
  }

  // Insert product
  const product = await storage.createPosProduct({
    serialNumber: input.serialNumber,
    name: input.name,
    category: input.category || "Other",
    sku: input.sku || undefined,
    retailerId: input.retailerId,
    currentOwnerId: input.ownerId,
    status: "registered",
    metadata: input.metadata,
  });

  // Create first ledger entry (initial sale)
  const ledgerEntry = await storage.createOwnershipLedgerEntry({
    productId: product.id,
    fromUserId: undefined, // initial sale — no previous owner
    toUserId: input.ownerId,
    registeredBy: input.retailerId,
    event: "sale",
    notes: `Initial product registration at POS`,
  });

  logger.info("Product registered via POS", {
    productId: product.id,
    serial: input.serialNumber,
    ownerId: input.ownerId,
    retailerId: input.retailerId,
  });

  // Notify customer asynchronously (fire-and-forget)
  if (retailer) {
    notifyPosCustomer("registration", {
      userId: input.ownerId,
      productId: product.id,
      productName: input.name,
      serialNumber: input.serialNumber,
      category: input.category || "Other",
      retailerName: retailer.name,
    }).catch(err => logger.error("POS notification failed", { err }));
  }

  return { product, ledgerEntry };
}

// ─── Ownership transfer ───

interface TransferInput {
  productId: number;
  newOwnerId: number;
  retailerId: number;
  notes?: string;
}

/**
 * Transfers ownership of a product to a new owner and logs to the ledger.
 */
export async function transferOwnership(input: TransferInput) {
  // Get current product
  const product = await storage.getPosProduct(input.productId);

  if (!product) {
    throw Object.assign(new Error("Product not found"), { status: 404 });
  }

  if (product.status === "stolen") {
    throw Object.assign(
      new Error("Cannot transfer a product that has been reported stolen"),
      { status: 400 }
    );
  }

  const previousOwnerId = product.currentOwnerId;

  // Update product ownership
  const updatedProduct = await storage.updatePosProduct(input.productId, {
    currentOwnerId: input.newOwnerId,
    status: "transferred",
  });

  if (!updatedProduct) {
    throw new Error("Failed to update product");
  }

  // Create ledger entry
  const ledgerEntry = await storage.createOwnershipLedgerEntry({
    productId: input.productId,
    fromUserId: previousOwnerId,
    toUserId: input.newOwnerId,
    registeredBy: input.retailerId,
    event: "transfer",
    notes: input.notes || "Ownership transfer at POS",
  });

  logger.info("Ownership transferred", {
    productId: input.productId,
    from: previousOwnerId,
    to: input.newOwnerId,
    retailerId: input.retailerId,
  });

  // Notify customer asynchronously (fire-and-forget)
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

// ─── Retailer CRUD (Admin use) ───

/**
 * Generate a unique API key for a retailer.
 */
export function generateApiKey(): string {
  return `kzr_${crypto.randomBytes(32).toString("hex")}`;
}

/**
 * Create a new retailer.
 * Validates the linked user exists and updates their role to "Retailer".
 */
export async function createRetailer(data: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  userId: number;
  subscriptionPlan?: string;
  logoUrl?: string;
  metadata?: Record<string, any>;
}) {
  // Validate the linked user exists
  const linkedUser = await storage.getUser(data.userId);

  if (!linkedUser) {
    throw Object.assign(
      new Error(`User with ID ${data.userId} does not exist. Please select a valid user.`),
      { status: 400 }
    );
  }

  // Check if user is already linked to another retailer
  const existingRetailer = await storage.getRetailerByUserId(data.userId);

  if (existingRetailer) {
    throw Object.assign(
      new Error(`User ${linkedUser.fullName} (ID ${data.userId}) is already linked to retailer "${existingRetailer.name}".`),
      { status: 409 }
    );
  }

  const apiKey = generateApiKey();

  const retailer = await storage.createRetailer({
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    userId: data.userId,
    subscriptionPlan: (data.subscriptionPlan as any) || "basic",
    logoUrl: data.logoUrl,
    metadata: data.metadata,
    apiKey,
    status: "active",
  });

  // Update the linked user's role to "Retailer" (unless they are Admin)
  if (linkedUser.role !== "Admin") {
    await storage.updateUserRole(data.userId, "Retailer");
    logger.info("User role updated to Retailer", { userId: data.userId, previousRole: linkedUser.role });
  }

  logger.info("Retailer created", { retailerId: retailer.id, name: data.name, linkedUserId: data.userId });

  return retailer;
}

/**
 * Get all retailers with optional status filter.
 */
export async function getRetailers(statusFilter?: string) {
  return storage.getRetailers(statusFilter);
}

/**
 * Get a single retailer by ID.
 */
export async function getRetailerById(id: number) {
  return storage.getRetailer(id);
}

/**
 * Get a retailer by linked user ID.
 */
export async function getRetailerByUserId(userId: number) {
  return storage.getRetailerByUserId(userId);
}

/**
 * Update retailer details.
 */
export async function updateRetailer(
  id: number,
  data: Partial<{
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    status: string;
    subscriptionPlan: string;
    logoUrl: string | null;
    metadata: Record<string, any> | null;
  }>
) {
  return storage.updateRetailer(id, data as any);
}

/**
 * Regenerate API key for a retailer.
 */
export async function regenerateApiKey(id: number) {
  const newKey = generateApiKey();
  return storage.updateRetailer(id, { apiKey: newKey });
}

/**
 * Get product ownership history from ledger.
 */
export async function getProductHistory(productId: number) {
  return storage.getProductHistory(productId);
}

/**
 * Get all POS products for a particular retailer.
 */
export async function getRetailerProducts(retailerId: number) {
  return storage.getRetailerProducts(retailerId);
}

/**
 * Get all POS products for a particular owner.
 */
export async function getOwnerProducts(ownerId: number) {
  return storage.getOwnerProducts(ownerId);
}

// ─── Retailer Dashboard Stats ───

export function isPosStubAccount(email?: string | null): boolean {
  return email?.endsWith("@pos.kizere.local") ?? false;
}

export interface PosAnalyticsData {
  registrationsOverTime: { date: string; count: number }[];
  transfersOverTime: { date: string; count: number }[];
  topRetailers: { name: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
  totalRegistrations: number;
  totalTransfers: number;
  activeRetailers: number;
}

export async function getPosAnalytics(startDate?: Date, endDate?: Date): Promise<PosAnalyticsData> {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
  const end = endDate || new Date();
  
  return storage.getPosAnalytics(start, end);
}

export interface RetailerStats {
  totalProducts: number;
  totalTransfers: number;
  totalCustomers: number;
  productsByCategory: { category: string; count: number }[];
  productsByStatus: { status: string; count: number }[];
  recentActivity: {
    id: number;
    event: string;
    productId: number;
    toUserId: number;
    notes: string | null;
    timestamp: Date;
  }[];
}

/**
 * Get aggregate stats for a retailer's dashboard.
 */
export async function getRetailerStats(retailerId: number, startDate?: Date, endDate?: Date): Promise<RetailerStats> {
  return storage.getRetailerStats(retailerId, startDate, endDate);
}

// ─── Product search, filter & pagination ───

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ProductSearchParams extends PaginationParams {
  search?: string;       // matches serial number, name, or SKU
  category?: string;
  status?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Search and filter retailer products with pagination.
 */
export async function searchRetailerProducts(
  retailerId: number,
  params: ProductSearchParams
): Promise<PaginatedResult<PosProduct>> {
  return storage.searchRetailerProducts(retailerId, params);
}

/**
 * Get paginated product history from the ownership ledger.
 */
export async function getProductHistoryPaginated(
  productId: number,
  params: PaginationParams
): Promise<PaginatedResult<OwnershipLedgerEntry>> {
  return storage.getProductHistoryPaginated(productId, params);
}

// ─── Product detail ───

/**
 * Get a single POS product by ID, optionally scoped to a retailer.
 */
export async function getProductById(
  productId: number,
  retailerId?: number
): Promise<PosProduct | undefined> {
  return storage.getPosProductByIdAndRetailer(productId, retailerId);
}

// ─── Product status transitions ───

/**
 * Archive a product. Only allowed for registered or transferred products.
 */
export async function archiveProduct(
  productId: number,
  retailerId: number
): Promise<PosProduct> {
  const product = await getProductById(productId, retailerId);
  if (!product) {
    throw Object.assign(new Error("Product not found"), { status: 404 });
  }

  if (product.status === "archived") {
    throw Object.assign(new Error("Product is already archived"), { status: 400 });
  }
  if (product.status === "stolen") {
    throw Object.assign(
      new Error("Cannot archive a product that has been reported stolen"),
      { status: 400 }
    );
  }

  const updated = await storage.updatePosProduct(productId, { status: "archived" });
  if (!updated) {
    throw new Error("Failed to update product");
  }

  // Log to ledger
  await storage.createOwnershipLedgerEntry({
    productId,
    fromUserId: product.currentOwnerId,
    toUserId: product.currentOwnerId,
    registeredBy: retailerId,
    event: "sale", // closest available event for archival
    notes: "Product archived by retailer",
  });

  logger.info("Product archived", { productId, retailerId });

  return updated;
}

/**
 * Report a product as stolen. Creates a stolen_report ledger entry.
 */
export async function reportProductStolen(
  productId: number,
  retailerId: number,
  notes?: string
): Promise<PosProduct> {
  const product = await getProductById(productId, retailerId);
  if (!product) {
    throw Object.assign(new Error("Product not found"), { status: 404 });
  }

  if (product.status === "stolen") {
    throw Object.assign(new Error("Product is already reported as stolen"), { status: 400 });
  }
  if (product.status === "archived") {
    throw Object.assign(new Error("Cannot report an archived product as stolen"), { status: 400 });
  }

  const updated = await storage.updatePosProduct(productId, { status: "stolen" });
  if (!updated) {
    throw new Error("Failed to update product");
  }

  await storage.createOwnershipLedgerEntry({
    productId,
    fromUserId: product.currentOwnerId,
    toUserId: product.currentOwnerId,
    registeredBy: retailerId,
    event: "stolen_report",
    notes: notes || "Product reported as stolen",
  });

  logger.warn("Product reported stolen", { productId, retailerId, ownerId: product.currentOwnerId });

  return updated;
}

/**
 * Recover a stolen product. Only allowed for products with status 'stolen'.
 */
export async function recoverProduct(
  productId: number,
  retailerId: number,
  notes?: string
): Promise<PosProduct> {
  const product = await getProductById(productId, retailerId);
  if (!product) {
    throw Object.assign(new Error("Product not found"), { status: 404 });
  }

  if (product.status !== "stolen") {
    throw Object.assign(
      new Error("Only stolen products can be recovered"),
      { status: 400 }
    );
  }

  const updated = await storage.updatePosProduct(productId, { status: "registered" });
  if (!updated) {
    throw new Error("Failed to update product");
  }

  await storage.createOwnershipLedgerEntry({
    productId,
    fromUserId: product.currentOwnerId,
    toUserId: product.currentOwnerId,
    registeredBy: retailerId,
    event: "recovery",
    notes: notes || "Product recovered",
  });

  logger.info("Product recovered", { productId, retailerId, ownerId: product.currentOwnerId });

  return updated;
}
