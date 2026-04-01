import { db } from "../db";
import { 
  retailers, posProducts, ownershipLedger, users,
  Retailer, InsertRetailer, PosProduct, InsertPosProduct, 
  OwnershipLedgerEntry, InsertOwnershipLedger 
} from "@shared/schema";
import { eq, desc, count, and, gte, lte, or, ilike, sql } from "drizzle-orm";

export async function getRetailer(id: number): Promise<Retailer | undefined> {
  const [retailer] = await db.select().from(retailers).where(eq(retailers.id, id)).limit(1);
  return retailer;
}

export async function getRetailerByUserId(userId: number): Promise<Retailer | undefined> {
  const [retailer] = await db.select().from(retailers).where(eq(retailers.userId, userId)).limit(1);
  return retailer;
}

export async function getRetailerByApiKey(apiKey: string): Promise<Retailer | undefined> {
  const [retailer] = await db.select().from(retailers).where(eq(retailers.apiKey, apiKey)).limit(1);
  return retailer;
}

export async function getRetailers(statusFilter?: string): Promise<Retailer[]> {
  if (statusFilter) {
    return await db.select().from(retailers).where(eq(retailers.status, statusFilter));
  }
  return await db.select().from(retailers);
}

export async function createRetailer(retailerData: InsertRetailer & { apiKey: string }): Promise<Retailer> {
  const [retailer] = await db.insert(retailers).values(retailerData as any).returning();
  return retailer;
}

export async function updateRetailer(id: number, data: Partial<Retailer>): Promise<Retailer | undefined> {
  const [updated] = await db.update(retailers).set({ ...data, updatedAt: new Date() }).where(eq(retailers.id, id)).returning();
  return updated;
}

export async function getPosProduct(id: number): Promise<PosProduct | undefined> {
  const [product] = await db.select().from(posProducts).where(eq(posProducts.id, id)).limit(1);
  return product;
}

export async function getPosProductByIdAndRetailer(id: number, retailerId?: number): Promise<PosProduct | undefined> {
  const conditions = [eq(posProducts.id, id)];
  if (retailerId !== undefined) {
    conditions.push(eq(posProducts.retailerId, retailerId));
  }
  const [product] = await db.select().from(posProducts).where(and(...conditions)).limit(1);
  return product;
}

export async function getPosProductBySerial(serialNumber: string): Promise<PosProduct | undefined> {
  const [product] = await db.select().from(posProducts).where(eq(posProducts.serialNumber, serialNumber)).limit(1);
  return product;
}

export async function getRetailerProducts(retailerId: number): Promise<PosProduct[]> {
  return await db.select().from(posProducts).where(eq(posProducts.retailerId, retailerId)).orderBy(desc(posProducts.registrationDate));
}

export async function getOwnerProducts(ownerId: number): Promise<PosProduct[]> {
  return await db.select().from(posProducts).where(eq(posProducts.currentOwnerId, ownerId)).orderBy(desc(posProducts.registrationDate));
}

export async function createPosProduct(productData: InsertPosProduct): Promise<PosProduct> {
  const [product] = await db.insert(posProducts).values(productData).returning();
  return product;
}

export async function updatePosProduct(id: number, data: Partial<PosProduct>): Promise<PosProduct | undefined> {
  const [updated] = await db.update(posProducts).set(data).where(eq(posProducts.id, id)).returning();
  return updated;
}

export async function countRetailerProducts(retailerId: number): Promise<number> {
  const [{ value }] = await db.select({ value: count() }).from(posProducts).where(eq(posProducts.retailerId, retailerId));
  return value;
}

export async function createOwnershipLedgerEntry(entryData: InsertOwnershipLedger): Promise<OwnershipLedgerEntry> {
  const [entry] = await db.insert(ownershipLedger).values(entryData).returning();
  return entry;
}

export async function getProductHistory(productId: number): Promise<OwnershipLedgerEntry[]> {
  return await db.select().from(ownershipLedger).where(eq(ownershipLedger.productId, productId)).orderBy(desc(ownershipLedger.timestamp));
}

export async function searchRetailerProducts(
  retailerId: number,
  params: { page: number; limit: number; search?: string; category?: string; status?: string }
): Promise<{ data: PosProduct[]; total: number; page: number; limit: number; totalPages: number }> {
  const { page, limit, search, category, status } = params;
  const offset = (page - 1) * limit;

  const conditions = [eq(posProducts.retailerId, retailerId)];

  if (category) {
    conditions.push(eq(posProducts.category, category));
  }
  if (status) {
    conditions.push(eq(posProducts.status, status));
  }
  if (search) {
    conditions.push(
      or(
        ilike(posProducts.serialNumber, `%${search}%`),
        ilike(posProducts.name, `%${search}%`),
        ilike(posProducts.sku, `%${search}%`)
      )!
    );
  }

  const whereClause = and(...conditions);

  const [countResult] = await db.select({ count: count() }).from(posProducts).where(whereClause);
  const total = countResult?.count ?? 0;

  const data = await db
    .select()
    .from(posProducts)
    .where(whereClause)
    .orderBy(desc(posProducts.registrationDate))
    .limit(limit)
    .offset(offset);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getProductHistoryPaginated(
  productId: number,
  params: { page: number; limit: number }
): Promise<{ data: OwnershipLedgerEntry[]; total: number; page: number; limit: number; totalPages: number }> {
  const { page, limit } = params;
  const offset = (page - 1) * limit;

  const [countResult] = await db.select({ count: count() }).from(ownershipLedger).where(eq(ownershipLedger.productId, productId));
  const total = countResult?.count ?? 0;

  const data = await db
    .select()
    .from(ownershipLedger)
    .where(eq(ownershipLedger.productId, productId))
    .orderBy(desc(ownershipLedger.timestamp))
    .limit(limit)
    .offset(offset);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPosAnalytics(start: Date, end: Date) {
  const [regCount] = await db
    .select({ count: count() })
    .from(posProducts)
    .where(and(gte(posProducts.registrationDate, start), lte(posProducts.registrationDate, end)));
  const totalRegistrations = regCount?.count ?? 0;

  const [transCount] = await db
    .select({ count: count() })
    .from(ownershipLedger)
    .where(and(
      eq(ownershipLedger.event, "transfer"),
      gte(ownershipLedger.timestamp, start),
      lte(ownershipLedger.timestamp, end)
    ));
  const totalTransfers = transCount?.count ?? 0;

  const [activeRetCount] = await db
    .select({ count: sql<number>`count(distinct ${posProducts.retailerId})` })
    .from(posProducts)
    .where(and(gte(posProducts.registrationDate, start), lte(posProducts.registrationDate, end)));
  const activeRetailers = activeRetCount?.count ?? 0;

  const categoryBreakdown = await db
    .select({ category: posProducts.category, count: count() })
    .from(posProducts)
    .where(and(gte(posProducts.registrationDate, start), lte(posProducts.registrationDate, end)))
    .groupBy(posProducts.category)
    .orderBy(desc(count()));

  const topRetailers = await db
    .select({ name: retailers.name, count: count() })
    .from(posProducts)
    .innerJoin(retailers, eq(posProducts.retailerId, retailers.id))
    .where(and(gte(posProducts.registrationDate, start), lte(posProducts.registrationDate, end)))
    .groupBy(retailers.name)
    .orderBy(desc(count()))
    .limit(10);

  const registrationsOverTime = await db
    .select({
      date: sql<string>`date_trunc('day', ${posProducts.registrationDate})::date::text`,
      count: count(),
    })
    .from(posProducts)
    .where(and(gte(posProducts.registrationDate, start), lte(posProducts.registrationDate, end)))
    .groupBy(sql`date_trunc('day', ${posProducts.registrationDate})`)
    .orderBy(sql`date_trunc('day', ${posProducts.registrationDate})`);

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

export async function getRetailerStats(retailerId: number) {
  const [productCountResult] = await db
    .select({ count: count() })
    .from(posProducts)
    .where(eq(posProducts.retailerId, retailerId));
  const totalProducts = productCountResult?.count ?? 0;

  const [transferCountResult] = await db
    .select({ count: count() })
    .from(ownershipLedger)
    .where(and(eq(ownershipLedger.registeredBy, retailerId), eq(ownershipLedger.event, "transfer")));
  const totalTransfers = transferCountResult?.count ?? 0;

  const [customerCountResult] = await db
    .select({ count: sql<number>`count(distinct ${posProducts.currentOwnerId})` })
    .from(posProducts)
    .where(eq(posProducts.retailerId, retailerId));
  const totalCustomers = customerCountResult?.count ?? 0;

  const productsByCategory = await db
    .select({ category: posProducts.category, count: count() })
    .from(posProducts)
    .where(eq(posProducts.retailerId, retailerId))
    .groupBy(posProducts.category)
    .orderBy(desc(count()));

  const productsByStatus = await db
    .select({ status: posProducts.status, count: count() })
    .from(posProducts)
    .where(eq(posProducts.retailerId, retailerId))
    .groupBy(posProducts.status)
    .orderBy(desc(count()));

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
