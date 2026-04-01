import { db } from "../db";
import {
  users, retailers, posProducts, ownershipLedger,
  InsertUser, InsertPosProduct, InsertOwnershipLedger,
  Retailer, PosProduct, OwnershipLedgerEntry
} from "@shared/schema";
import { eq, and, desc, count, sql, gte, lte } from "drizzle-orm";
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
  // Try to find existing user by nationalId
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.nationalId, nationalId))
    .limit(1);

  if (existing) {
    logger.info("Customer found by NID", { userId: existing.id, nationalId });
    return { user: existing, isNew: false };
  }

  // Create stub account
  const username = `kz_${nationalId.slice(-6)}_${Date.now().toString(36)}`;
  const tempPassword = crypto.randomBytes(16).toString("hex");
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  const placeholderEmail = email || `${username}@pos.kizere.local`;

  const [newUser] = await db
    .insert(users)
    .values({
      username,
      password: hashedPassword,
      fullName,
      nationalId,
      phoneNumber: phone || null,
      email: placeholderEmail,
      role: "Subscriber",
      status: "active",
      verificationStatus: "unverified",
    })
    .returning();

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
  // Check for duplicate serial
  const [dupeCheck] = await db
    .select()
    .from(posProducts)
    .where(eq(posProducts.serialNumber, input.serialNumber))
    .limit(1);

  if (dupeCheck) {
    throw Object.assign(
      new Error(`Product with serial number ${input.serialNumber} already exists`),
      { status: 409 }
    );
  }

  // Insert product
  const [product] = await db
    .insert(posProducts)
    .values({
      serialNumber: input.serialNumber,
      name: input.name,
      category: input.category || "Other",
      sku: input.sku || null,
      retailerId: input.retailerId,
      currentOwnerId: input.ownerId,
      status: "registered",
      metadata: input.metadata || null,
    })
    .returning();

  // Create first ledger entry (initial sale)
  const [ledgerEntry] = await db
    .insert(ownershipLedger)
    .values({
      productId: product.id,
      fromUserId: null, // initial sale — no previous owner
      toUserId: input.ownerId,
      registeredBy: input.retailerId,
      event: "sale",
      notes: `Initial product registration at POS`,
    })
    .returning();

  logger.info("Product registered via POS", {
    productId: product.id,
    serial: input.serialNumber,
    ownerId: input.ownerId,
    retailerId: input.retailerId,
  });

  // Notify customer asynchronously (fire-and-forget)
  const retailer = await db.query.retailers.findFirst({ where: eq(retailers.id, input.retailerId) });
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
  const [product] = await db
    .select()
    .from(posProducts)
    .where(eq(posProducts.id, input.productId))
    .limit(1);

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
  const [updatedProduct] = await db
    .update(posProducts)
    .set({
      currentOwnerId: input.newOwnerId,
      status: "transferred",
    })
    .where(eq(posProducts.id, input.productId))
    .returning();

  // Create ledger entry
  const [ledgerEntry] = await db
    .insert(ownershipLedger)
    .values({
      productId: input.productId,
      fromUserId: previousOwnerId,
      toUserId: input.newOwnerId,
      registeredBy: input.retailerId,
      event: "transfer",
      notes: input.notes || "Ownership transfer at POS",
    })
    .returning();

  logger.info("Ownership transferred", {
    productId: input.productId,
    from: previousOwnerId,
    to: input.newOwnerId,
    retailerId: input.retailerId,
  });

  // Notify customer asynchronously (fire-and-forget)
  const retailer = await db.query.retailers.findFirst({ where: eq(retailers.id, input.retailerId) });
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
  const [linkedUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, data.userId))
    .limit(1);

  if (!linkedUser) {
    throw Object.assign(
      new Error(`User with ID ${data.userId} does not exist. Please select a valid user.`),
      { status: 400 }
    );
  }

  // Check if user is already linked to another retailer
  const [existingRetailer] = await db
    .select()
    .from(retailers)
    .where(eq(retailers.userId, data.userId))
    .limit(1);

  if (existingRetailer) {
    throw Object.assign(
      new Error(`User ${linkedUser.fullName} (ID ${data.userId}) is already linked to retailer "${existingRetailer.name}".`),
      { status: 409 }
    );
  }

  const apiKey = generateApiKey();

  const [retailer] = await db
    .insert(retailers)
    .values({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      address: data.address || null,
      userId: data.userId,
      subscriptionPlan: data.subscriptionPlan || "basic",
      logoUrl: data.logoUrl || null,
      metadata: data.metadata || null,
      apiKey,
      status: "active",
    })
    .returning();

  // Update the linked user's role to "Retailer" (unless they are Admin)
  if (linkedUser.role !== "Admin") {
    await db
      .update(users)
      .set({ role: "Retailer" })
      .where(eq(users.id, data.userId));

    logger.info("User role updated to Retailer", { userId: data.userId, previousRole: linkedUser.role });
  }

  logger.info("Retailer created", { retailerId: retailer.id, name: data.name, linkedUserId: data.userId });

  return retailer;
}

/**
 * Get all retailers with optional status filter.
 */
export async function getRetailers(statusFilter?: string) {
  const query = db.select().from(retailers);

  if (statusFilter) {
    return query.where(eq(retailers.status, statusFilter));
  }

  return query;
}

/**
 * Get a single retailer by ID.
 */
export async function getRetailerById(id: number) {
  const [retailer] = await db
    .select()
    .from(retailers)
    .where(eq(retailers.id, id))
    .limit(1);
  return retailer;
}

/**
 * Get a retailer by linked user ID.
 */
export async function getRetailerByUserId(userId: number) {
  const [retailer] = await db
    .select()
    .from(retailers)
    .where(eq(retailers.userId, userId))
    .limit(1);
  return retailer;
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
  const [updated] = await db
    .update(retailers)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(retailers.id, id))
    .returning();

  return updated;
}

/**
 * Regenerate API key for a retailer.
 */
export async function regenerateApiKey(id: number) {
  const newKey = generateApiKey();

  const [updated] = await db
    .update(retailers)
    .set({ apiKey: newKey, updatedAt: new Date() })
    .where(eq(retailers.id, id))
    .returning();

  return updated;
}

/**
 * Get product ownership history from ledger.
 */
export async function getProductHistory(productId: number) {
  return db
    .select()
    .from(ownershipLedger)
    .where(eq(ownershipLedger.productId, productId))
    .orderBy(desc(ownershipLedger.timestamp));
}

/**
 * Get all POS products for a particular retailer.
 */
export async function getRetailerProducts(retailerId: number) {
  return db
    .select()
    .from(posProducts)
    .where(eq(posProducts.retailerId, retailerId))
    .orderBy(desc(posProducts.registrationDate));
}

/**
 * Get all POS products for a particular owner.
 */
export async function getOwnerProducts(ownerId: number) {
  return db
    .select()
    .from(posProducts)
    .where(eq(posProducts.currentOwnerId, ownerId))
    .orderBy(desc(posProducts.registrationDate));
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

  // Total Registrations within range
  const [regCount] = await db
    .select({ count: count() })
    .from(posProducts)
    .where(and(
      gte(posProducts.registrationDate, start),
      lte(posProducts.registrationDate, end)
    ));
  const totalRegistrations = regCount?.count ?? 0;

  // Total Transfers within range
  const [transCount] = await db
    .select({ count: count() })
    .from(ownershipLedger)
    .where(and(
      eq(ownershipLedger.event, "transfer"),
      gte(ownershipLedger.timestamp, start),
      lte(ownershipLedger.timestamp, end)
    ));
  const totalTransfers = transCount?.count ?? 0;

  // Active Retailers (with at least one registration in range)
  const [activeRetCount] = await db
    .select({ count: sql<number>`count(distinct ${posProducts.retailerId})` })
    .from(posProducts)
    .where(and(
      gte(posProducts.registrationDate, start),
      lte(posProducts.registrationDate, end)
    ));
  const activeRetailers = activeRetCount?.count ?? 0;

  // Category Breakdown
  const categoryBreakdown = await db
    .select({ category: posProducts.category, count: count() })
    .from(posProducts)
    .where(and(
      gte(posProducts.registrationDate, start),
      lte(posProducts.registrationDate, end)
    ))
    .groupBy(posProducts.category)
    .orderBy(desc(count()));

  // Top Retailers by volume
  const topRetailers = await db
    .select({ name: retailers.name, count: count() })
    .from(posProducts)
    .innerJoin(retailers, eq(posProducts.retailerId, retailers.id))
    .where(and(
      gte(posProducts.registrationDate, start),
      lte(posProducts.registrationDate, end)
    ))
    .groupBy(retailers.name)
    .orderBy(desc(count()))
    .limit(10);

  // Registrations over time (Daily)
  const registrationsOverTime = await db
    .select({
      date: sql<string>`date_trunc('day', ${posProducts.registrationDate})::date::text`,
      count: count(),
    })
    .from(posProducts)
    .where(and(
      gte(posProducts.registrationDate, start),
      lte(posProducts.registrationDate, end)
    ))
    .groupBy(sql`date_trunc('day', ${posProducts.registrationDate})`)
    .orderBy(sql`date_trunc('day', ${posProducts.registrationDate})`);

  // Transfers over time (Daily)
  const transfersOverTime = await db
    .select({
      date: sql<string>`date_trunc('day', ${ownershipLedger.timestamp})::date::text`,
      count: count(),
    })
    .from(ownershipLedger)
    .where(and(
      eq(ownershipLedger.event, "transfer"),
      gte(ownershipLedger.timestamp, start),
      lte(ownershipLedger.timestamp, end)
    ))
    .groupBy(sql`date_trunc('day', ${ownershipLedger.timestamp})`)
    .orderBy(sql`date_trunc('day', ${ownershipLedger.timestamp})`);

  return {
    registrationsOverTime,
    transfersOverTime,
    topRetailers,
    categoryBreakdown,
    totalRegistrations,
    totalTransfers,
    activeRetailers,
  };
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
export async function getRetailerStats(retailerId: number): Promise<RetailerStats> {
  // Total products registered by this retailer
  const [productCountResult] = await db
    .select({ count: count() })
    .from(posProducts)
    .where(eq(posProducts.retailerId, retailerId));
  const totalProducts = productCountResult?.count ?? 0;

  // Total transfers facilitated by this retailer
  const [transferCountResult] = await db
    .select({ count: count() })
    .from(ownershipLedger)
    .where(and(
      eq(ownershipLedger.registeredBy, retailerId),
      eq(ownershipLedger.event, "transfer")
    ));
  const totalTransfers = transferCountResult?.count ?? 0;

  // Unique customers (distinct currentOwnerId across retailer's products)
  const [customerCountResult] = await db
    .select({ count: sql<number>`count(distinct ${posProducts.currentOwnerId})` })
    .from(posProducts)
    .where(eq(posProducts.retailerId, retailerId));
  const totalCustomers = customerCountResult?.count ?? 0;

  // Products grouped by category
  const productsByCategory = await db
    .select({
      category: posProducts.category,
      count: count(),
    })
    .from(posProducts)
    .where(eq(posProducts.retailerId, retailerId))
    .groupBy(posProducts.category)
    .orderBy(desc(count()));

  // Products grouped by status
  const productsByStatus = await db
    .select({
      status: posProducts.status,
      count: count(),
    })
    .from(posProducts)
    .where(eq(posProducts.retailerId, retailerId))
    .groupBy(posProducts.status)
    .orderBy(desc(count()));

  // Recent activity (last 10 ledger entries for this retailer)
  const recentActivity = await db
    .select({
      id: ownershipLedger.id,
      event: ownershipLedger.event,
      productId: ownershipLedger.productId,
      toUserId: ownershipLedger.toUserId,
      notes: ownershipLedger.notes,
      timestamp: ownershipLedger.timestamp,
    })
    .from(ownershipLedger)
    .where(eq(ownershipLedger.registeredBy, retailerId))
    .orderBy(desc(ownershipLedger.timestamp))
    .limit(10);

  return {
    totalProducts,
    totalTransfers,
    totalCustomers,
    productsByCategory,
    productsByStatus,
    recentActivity,
  };
}
