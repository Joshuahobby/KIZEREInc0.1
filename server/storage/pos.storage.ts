import { db } from "../db";
import {
  retailers, Retailer, InsertRetailer,
  posProducts, PosProduct, InsertPosProduct,
  ownershipLedger, OwnershipLedgerEntry, InsertOwnershipLedger,
  posSecurityAlerts, PosSecurityAlert, InsertPosSecurityAlert,
  publicVerifyLogs, PublicVerifyLog, InsertPublicVerifyLog,
  platformSettings, PlatformSetting,
  ownershipCertificates, OwnershipCertificate, InsertOwnershipCertificate,
  verificationPurchases, VerificationPurchase, InsertVerificationPurchase,
  items, users, retailerCustomerSettings
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

export async function getPosProductBySerialWithRetailer(
  serialNumber: string
): Promise<(PosProduct & { retailerName: string | null }) | undefined> {
  const [product] = await db
    .select()
    .from(posProducts)
    .where(eq(posProducts.serialNumber, serialNumber))
    .limit(1);
  if (!product) return undefined;
  const [retailer] = await db
    .select({ name: retailers.name })
    .from(retailers)
    .where(eq(retailers.id, product.retailerId))
    .limit(1);
  return { ...product, retailerName: retailer?.name ?? null };
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
): Promise<{ data: (PosProduct & { ownerName: string; ownerNationalId: string | null })[]; total: number; page: number; limit: number; totalPages: number }> {
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
    .select({
      id: posProducts.id,
      sku: posProducts.sku,
      serialNumber: posProducts.serialNumber,
      name: posProducts.name,
      brand: posProducts.brand,
      model: posProducts.model,
      category: posProducts.category,
      retailerId: posProducts.retailerId,
      currentOwnerId: posProducts.currentOwnerId,
      registrationDate: posProducts.registrationDate,
      status: posProducts.status,
      metadata: posProducts.metadata,
      kizereId: posProducts.kizereId,
      ownerName: users.fullName,
      ownerNationalId: users.nationalId,
    })
    .from(posProducts)
    .innerJoin(users, eq(posProducts.currentOwnerId, users.id))
    .where(whereClause)
    .orderBy(desc(posProducts.registrationDate))
    .limit(limit)
    .offset(offset);

  return { 
    data: data as any[], 
    total: Number(total), 
    page, 
    limit, 
    totalPages: Math.ceil(Number(total) / limit) 
  };
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

  return { 
    data: data as OwnershipLedgerEntry[], 
    total: Number(total), 
    page, 
    limit, 
    totalPages: Math.ceil(Number(total) / limit) 
  };
}

export async function getRetailerTransactionsPaginated(
  retailerId: number,
  params: { page: number; limit: number }
): Promise<{ data: (OwnershipLedgerEntry & { productName: string | null; serialNumber: string | null; ownerName: string | null; transactionType: string })[]; total: number; page: number; limit: number; totalPages: number }> {
  const { page, limit } = params;
  const offset = (page - 1) * limit;

  const retailer = await getRetailer(retailerId);
  const retailerUserId = retailer?.userId ?? -1;

  const [countResult] = await db.select({ count: count() }).from(ownershipLedger).where(eq(ownershipLedger.registeredBy, retailerId));
  const total = countResult?.count ?? 0;

  const data = await db
    .select({
      id: ownershipLedger.id,
      productId: ownershipLedger.productId,
      fromUserId: ownershipLedger.fromUserId,
      toUserId: ownershipLedger.toUserId,
      registeredBy: ownershipLedger.registeredBy,
      event: ownershipLedger.event,
      notes: ownershipLedger.notes,
      timestamp: ownershipLedger.timestamp,
      productName: posProducts.name,
      serialNumber: posProducts.serialNumber,
      ownerName: users.fullName,
    })
    .from(ownershipLedger)
    .leftJoin(posProducts, eq(ownershipLedger.productId, posProducts.id))
    .leftJoin(users, eq(ownershipLedger.toUserId, users.id))
    .where(eq(ownershipLedger.registeredBy, retailerId))
    .orderBy(desc(ownershipLedger.timestamp))
    .limit(limit)
    .offset(offset);

  const formattedData = data.map(item => {
    // Distinguish "stock_in" (retailer registered item into own inventory)
    // from "sale" (product registered/transferred to a customer)
    let transactionType = item.event;
    if (item.event === "sale" && item.toUserId === retailerUserId) {
      transactionType = "stock_in";
    }
    return { ...item, id: Number(item.id), transactionType };
  });

  return {
    data: formattedData as (OwnershipLedgerEntry & { productName: string | null; serialNumber: string | null; ownerName: string | null; transactionType: string })[],
    total: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit)
  };
}

export async function getRetailerCustomersPaginated(
  retailerId: number,
  params: { page: number; limit: number }
): Promise<{ data: { id: number; fullName: string | null; nationalId: string | null; phone: string | null; email: string | null; totalItems: number; lastActivity: Date | null; isBlocked: boolean }[]; total: number; page: number; limit: number; totalPages: number }> {
  const { page, limit } = params;
  const offset = (page - 1) * limit;
  const retailer = await getRetailer(retailerId);
  const retailerUserId = retailer?.userId || -1;

  const countQuery = sql`
    SELECT COUNT(DISTINCT u.id) as count
    FROM ${users} u
    LEFT JOIN ${ownershipLedger} ol ON u.id = ol.to_user_id AND ol.registered_by = ${retailerId}
    LEFT JOIN ${retailerCustomerSettings} rcs ON u.id = rcs.customer_id AND rcs.retailer_id = ${retailerId}
    WHERE u.id != ${retailerUserId}
      AND (ol.registered_by = ${retailerId} OR rcs.retailer_id = ${retailerId})
  `;
  const { rows: countRows } = await db.execute(countQuery);
  const total = countRows[0] ? Number(countRows[0].count) : 0;

  const dataQuery = sql`
    SELECT
      u.id,
      u.full_name as "fullName",
      u.national_id as "nationalId",
      u.phone_number as "phone",
      u.email,
      COUNT(ol.id) as "totalItems",
      MAX(ol.timestamp) as "lastActivity",
      COALESCE(rcs.is_blocked, false) as "isBlocked"
    FROM ${users} u
    LEFT JOIN ${ownershipLedger} ol ON u.id = ol.to_user_id AND ol.registered_by = ${retailerId}
    LEFT JOIN ${retailerCustomerSettings} rcs ON u.id = rcs.customer_id AND rcs.retailer_id = ${retailerId}
    WHERE u.id != ${retailerUserId}
      AND (ol.registered_by = ${retailerId} OR rcs.retailer_id = ${retailerId})
    GROUP BY u.id, u.full_name, u.national_id, u.phone_number, u.email, rcs.is_blocked
    ORDER BY MAX(ol.timestamp) DESC NULLS LAST
    LIMIT ${limit} OFFSET ${offset}
  `;
  const { rows } = await db.execute(dataQuery);
  const data = (rows as any[]).map(r => ({
    id: Number(r.id),
    fullName: String(r.fullName || ""),
    nationalId: String(r.nationalId || ""),
    phone: String(r.phone || ""),
    email: String(r.email || ""),
    totalItems: Number(r.totalItems),
    lastActivity: r.lastActivity ? new Date(r.lastActivity) : null,
    isBlocked: Boolean(r.isBlocked),
  }));

  return { 
    data: data as any[], 
    total: Number(total), 
    page, 
    limit, 
    totalPages: Math.ceil(Number(total) / limit) 
  };
}

export async function getOrCreateRetailerCustomerSettings(retailerId: number, customerId: number) {
  const [existing] = await db
    .select()
    .from(retailerCustomerSettings)
    .where(and(
      eq(retailerCustomerSettings.retailerId, retailerId),
      eq(retailerCustomerSettings.customerId, customerId)
    ))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(retailerCustomerSettings)
    .values({
      retailerId,
      customerId,
      isBlocked: false,
    })
    .returning();

  return created;
}

export async function getRetailerCustomerDetail(retailerId: number, customerId: number) {
  const [customer] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      phone: users.phoneNumber,
      nationalId: users.nationalId,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, customerId))
    .limit(1);

  if (!customer) return null;

  const settings = await getOrCreateRetailerCustomerSettings(retailerId, customerId);

  const history = await db
    .select({
      id: ownershipLedger.id,
      event: ownershipLedger.event,
      notes: ownershipLedger.notes,
      purchaseAgreement: ownershipLedger.purchaseAgreement,
      legalDocUrl: ownershipLedger.legalDocUrl,
      timestamp: ownershipLedger.timestamp,
      productName: posProducts.name,
      serialNumber: posProducts.serialNumber,
    })
    .from(ownershipLedger)
    .leftJoin(posProducts, eq(ownershipLedger.productId, posProducts.id))
    .where(and(
      eq(ownershipLedger.registeredBy, retailerId),
      eq(ownershipLedger.toUserId, customerId)
    ))
    .orderBy(desc(ownershipLedger.timestamp));

  return {
    ...customer,
    isBlocked: settings?.isBlocked ?? false,
    internalNotes: settings?.internalNotes ?? "",
    history,
  };
}

export async function updateRetailerCustomerSettings(
  retailerId: number, 
  customerId: number, 
  updates: { isBlocked?: boolean; internalNotes?: string }
) {
  const [updated] = await db
    .insert(retailerCustomerSettings)
    .values({
      retailerId,
      customerId,
      isBlocked: updates.isBlocked ?? false,
      internalNotes: updates.internalNotes ?? "",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [retailerCustomerSettings.retailerId, retailerCustomerSettings.customerId],
      set: {
        ...updates,
        updatedAt: new Date(),
      },
    })
    .returning();
  
  return updated;
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

export async function getRetailerStats(retailerId: number, startDate?: Date, endDate?: Date) {
  const retailer = await getRetailer(retailerId);
  const retailerUserId = retailer?.userId || -1;

  const productFilters: any[] = [eq(posProducts.retailerId, retailerId)];
  if (startDate) productFilters.push(gte(posProducts.registrationDate, startDate));
  if (endDate) productFilters.push(lte(posProducts.registrationDate, endDate));

  const ledgerFilters: any[] = [
    eq(ownershipLedger.registeredBy, retailerId),
    sql`${ownershipLedger.toUserId} != ${retailerUserId}`
  ];
  if (startDate) ledgerFilters.push(gte(ownershipLedger.timestamp, startDate));
  if (endDate) ledgerFilters.push(lte(ownershipLedger.timestamp, endDate));

  const [productCountResult] = await db
    .select({ count: count() })
    .from(posProducts)
    .where(and(...productFilters));
  const totalProducts = productCountResult?.count ?? 0;

  const [transferCountResult] = await db
    .select({ count: count() })
    .from(ownershipLedger)
    .where(and(...ledgerFilters, eq(ownershipLedger.event, "transfer")));
  const totalTransfers = transferCountResult?.count ?? 0;

  const [customerCountResult] = await db
    .select({ count: sql<number>`count(distinct ${posProducts.currentOwnerId})` })
    .from(posProducts)
    .where(and(...productFilters, sql`${posProducts.currentOwnerId} != ${retailerUserId}`));
  const totalCustomers = customerCountResult?.count ?? 0;

  const productsByCategory = await db
    .select({ category: posProducts.category, count: count() })
    .from(posProducts)
    .where(and(...productFilters))
    .groupBy(posProducts.category)
    .orderBy(desc(count()));

  const productsByStatus = await db
    .select({ status: posProducts.status, count: count() })
    .from(posProducts)
    .where(and(...productFilters))
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
    .where(and(...ledgerFilters))
    .orderBy(desc(ownershipLedger.timestamp))
    .limit(10);

  const reportDays = 14;
  const trendStart = startDate || new Date(Date.now() - reportDays * 24 * 60 * 60 * 1000);
  const trendEnd = endDate || new Date();

  const registrationsOverTime = await db
    .select({
      date: sql<string>`date_trunc('day', ${posProducts.registrationDate})::date::text`,
      count: count(),
    })
    .from(posProducts)
    .where(and(
      eq(posProducts.retailerId, retailerId),
      gte(posProducts.registrationDate, trendStart),
      lte(posProducts.registrationDate, trendEnd)
    ))
    .groupBy(sql`date_trunc('day', ${posProducts.registrationDate})`)
    .orderBy(sql`date_trunc('day', ${posProducts.registrationDate})`);

  const transfersOverTime = await db
    .select({
      date: sql<string>`date_trunc('day', ${ownershipLedger.timestamp})::date::text`,
      count: count(),
    })
    .from(ownershipLedger)
    .where(and(
      eq(ownershipLedger.registeredBy, retailerId),
      eq(ownershipLedger.event, "transfer"),
      sql`${ownershipLedger.toUserId} != ${retailerUserId}`,
      gte(ownershipLedger.timestamp, trendStart),
      lte(ownershipLedger.timestamp, trendEnd)
    ))
    .groupBy(sql`date_trunc('day', ${ownershipLedger.timestamp})`)
    .orderBy(sql`date_trunc('day', ${ownershipLedger.timestamp})`);

  const securityAlerts = await db
    .select({
      id: ownershipLedger.id,
      productId: ownershipLedger.productId,
      productName: posProducts.name,
      serialNumber: posProducts.serialNumber,
      event: ownershipLedger.event,
      notes: ownershipLedger.notes,
      timestamp: ownershipLedger.timestamp,
      reportedBy: users.fullName,
    })
    .from(ownershipLedger)
    .innerJoin(posProducts, eq(ownershipLedger.productId, posProducts.id))
    .innerJoin(users, eq(ownershipLedger.toUserId, users.id))
    .where(and(
      eq(ownershipLedger.registeredBy, retailerId),
      eq(ownershipLedger.event, "stolen_report")
    ))
    .orderBy(desc(ownershipLedger.timestamp))
    .limit(5);

  return {
    totalProducts,
    totalTransfers,
    totalCustomers,
    productsByCategory,
    productsByStatus,
    recentActivity,
    trends: {
      registrations: registrationsOverTime,
      transfers: transfersOverTime,
    },
    securityAlerts,
  };
}

export async function getGlobalStolenStatus(serialNumber: string): Promise<{ 
  isStolen: boolean; 
  source: "pos" | "registry" | null;
  itemData?: any;
}> {
  const [posProduct] = await db
    .select()
    .from(posProducts)
    .where(and(eq(posProducts.serialNumber, serialNumber), eq(posProducts.status, "stolen")))
    .limit(1);

  if (posProduct) {
    return { isStolen: true, source: "pos", itemData: posProduct };
  }

  const [registryItem] = await db
    .select()
    .from(items)
    .where(and(eq(items.uniqueIdentifier, serialNumber), eq(items.status, "Lost")))
    .limit(1);

  if (registryItem) {
    return { isStolen: true, source: "registry", itemData: registryItem };
  }

  return { isStolen: false, source: null };
}

export async function createPosSecurityAlert(alertData: InsertPosSecurityAlert): Promise<PosSecurityAlert> {
  const [alert] = await db.insert(posSecurityAlerts).values(alertData).returning();
  return alert;
}

export async function getRetailerSecurityAlerts(retailerId: number): Promise<PosSecurityAlert[]> {
  return await db.select().from(posSecurityAlerts).where(eq(posSecurityAlerts.retailerId, retailerId)).orderBy(desc(posSecurityAlerts.timestamp));
}

export async function createPublicVerifyLog(data: InsertPublicVerifyLog): Promise<PublicVerifyLog> {
  const [log] = await db.insert(publicVerifyLogs).values(data).returning();
  return log;
}

export async function getPublicVerifyLogs(options: {
  page: number;
  limit: number;
  identifier?: string;
}): Promise<{ logs: PublicVerifyLog[]; total: number }> {
  const { page, limit, identifier } = options;
  const offset = (page - 1) * limit;

  const where = identifier ? eq(publicVerifyLogs.identifier, identifier) : undefined;

  const [countResult] = await db
    .select({ count: count() })
    .from(publicVerifyLogs)
    .where(where);

  const total = Number(countResult?.count ?? 0);

  const logs = await db
    .select()
    .from(publicVerifyLogs)
    .where(where)
    .orderBy(desc(publicVerifyLogs.lookedUpAt))
    .limit(limit)
    .offset(offset);

  return { logs, total };
}

// ─── Platform Settings ───

export async function getPlatformSetting(key: string): Promise<PlatformSetting | undefined> {
  const [row] = await db.select().from(platformSettings).where(eq(platformSettings.key, key)).limit(1);
  return row;
}

export async function getAllPlatformSettings(): Promise<PlatformSetting[]> {
  return db.select().from(platformSettings).orderBy(platformSettings.key);
}

export async function upsertPlatformSetting(
  key: string,
  value: string,
  description: string | undefined,
  updatedBy: number
): Promise<PlatformSetting> {
  const [row] = await db
    .insert(platformSettings)
    .values({ key, value, description, updatedBy, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: platformSettings.key,
      set: { value, description, updatedBy, updatedAt: new Date() },
    })
    .returning();
  return row;
}

// ─── Ownership Certificates ───

export async function createOwnershipCertificate(data: InsertOwnershipCertificate): Promise<OwnershipCertificate> {
  const [cert] = await db.insert(ownershipCertificates).values(data).returning();
  return cert;
}

export async function getOwnershipCertificateByCode(code: string): Promise<OwnershipCertificate | undefined> {
  const [cert] = await db
    .select()
    .from(ownershipCertificates)
    .where(eq(ownershipCertificates.certificateCode, code))
    .limit(1);
  return cert;
}

export async function getOwnershipCertificatesByItem(itemId: number): Promise<OwnershipCertificate[]> {
  return db
    .select()
    .from(ownershipCertificates)
    .where(eq(ownershipCertificates.itemId, itemId))
    .orderBy(desc(ownershipCertificates.issuedAt));
}

export async function getOwnershipCertificatesByUser(userId: number): Promise<OwnershipCertificate[]> {
  return db
    .select()
    .from(ownershipCertificates)
    .where(eq(ownershipCertificates.userId, userId))
    .orderBy(desc(ownershipCertificates.issuedAt));
}

// ─── Verification Purchases ───

export async function createVerificationPurchase(data: InsertVerificationPurchase): Promise<VerificationPurchase> {
  const [row] = await db.insert(verificationPurchases).values(data).returning();
  return row;
}

export async function getActiveVerificationPurchase(
  userId: number,
  identifier: string
): Promise<VerificationPurchase | undefined> {
  const now = new Date();
  const [row] = await db
    .select()
    .from(verificationPurchases)
    .where(
      and(
        eq(verificationPurchases.userId, userId),
        eq(verificationPurchases.identifier, identifier),
        sql`${verificationPurchases.expiresAt} > ${now}`
      )
    )
    .orderBy(desc(verificationPurchases.createdAt))
    .limit(1);
  return row;
}

export async function getUserVerificationPurchases(userId: number): Promise<VerificationPurchase[]> {
  return db
    .select()
    .from(verificationPurchases)
    .where(eq(verificationPurchases.userId, userId))
    .orderBy(desc(verificationPurchases.createdAt));
}
