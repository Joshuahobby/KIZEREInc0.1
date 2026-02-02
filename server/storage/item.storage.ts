import { db } from "../db";
import { eq, like, and, or, desc, asc, sql } from "drizzle-orm";
import { items, type Item, type InsertItem, reports, users } from "@shared/schema";

export async function getItem(id: number): Promise<Item | undefined> {
  const [item] = await db.select().from(items).where(eq(items.id, id));
  return item;
}

export async function getUserItems(userId: number): Promise<Item[]> {
  return await db.select().from(items).where(eq(items.userId, userId));
}

export async function createItem(item: InsertItem): Promise<Item> {
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

export async function updateItem(id: number, itemData: Partial<Item>): Promise<Item | undefined> {
  const [updatedItem] = await db
    .update(items)
    .set({ ...itemData, updatedAt: new Date() })
    .where(eq(items.id, id))
    .returning();
  return updatedItem;
}

export async function deleteItem(id: number): Promise<boolean> {
  const result = await db.delete(items).where(eq(items.id, id)).returning({ id: items.id });
  return result.length > 0;
}

export async function searchItems(query: string, filters?: { category?: string; status?: string; location?: string }): Promise<Item[]> {
  let conditions = [];
  if (query) {
    conditions.push(or(like(items.name, `%${query}%`), like(items.description || '', `%${query}%`), like(items.uniqueIdentifier, `%${query}%`)));
  }
  if (filters) {
    if (filters.category) conditions.push(eq(items.category, filters.category));
    if (filters.status) conditions.push(eq(items.status, filters.status));
    if (filters.location) conditions.push(like(items.location || '', `%${filters.location}%`));
  }
  if (conditions.length > 0) return await db.select().from(items).where(and(...conditions));
  return await db.select().from(items);
}

export async function getAllItems(): Promise<Item[]> {
  return await db.select().from(items);
}

export async function getPaginatedItems(options: {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  category?: string;
  status?: string;
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
  const { page, limit, sortBy, sortOrder, search, category, status, ownerName, serialNumber, location, minValue, maxValue, registeredAfter, registeredBefore, hasReports, reportType } = options;
  const offset = (page - 1) * limit;
  const conditions = [];
  
  if (search) conditions.push(or(like(items.name, `%${search}%`), like(items.description || '', `%${search}%`), like(items.uniqueIdentifier, `%${search}%`)));
  if (category) conditions.push(eq(items.category, category));
  if (status) conditions.push(eq(items.status, status));
  if (serialNumber) conditions.push(sql`${items.details}->>'serialNumber' ILIKE ${`%${serialNumber}%`}`);
  if (location) conditions.push(like(items.location || '', `%${location}%`));
  if (minValue !== undefined) conditions.push(sql`(${items.details}->>'estimatedValue')::float >= ${minValue}`);
  if (maxValue !== undefined) conditions.push(sql`(${items.details}->>'estimatedValue')::float <= ${maxValue}`);
  if (registeredAfter) conditions.push(sql`${items.registeredAt} >= ${registeredAfter}`);
  if (registeredBefore) conditions.push(sql`${items.registeredAt} <= ${registeredBefore}`);
  
  if (ownerName) {
    const usersWithName = await db.select({ id: users.id }).from(users).where(or(like(users.fullName, `%${ownerName}%`), like(users.username, `%${ownerName}%`)));
    if (usersWithName.length > 0) {
      conditions.push(sql`${items.userId} IN (${usersWithName.map(u => u.id).join(', ')})`);
    } else {
      conditions.push(sql`1 = 0`);
    }
  }
  
  if (hasReports) {
    const reportConditions = [sql`${reports.itemId} IS NOT NULL`];
    if (reportType && reportType !== 'any') {
      reportConditions.push(eq(reports.type, reportType));
    }
    const itemsWithReports = await db.select({ id: reports.itemId }).from(reports).where(and(...reportConditions));
    if (itemsWithReports.length > 0) {
      conditions.push(sql`${items.id} IN (${itemsWithReports.map(i => i.id).join(', ')})`);
    } else {
      conditions.push(sql`1 = 0`);
    }
  }
  
  const countResult = await db.select({ count: sql`count(*)::int` }).from(items).where(conditions.length ? and(...conditions) : undefined);
  const total = Number(countResult[0].count);
  const totalPages = Math.ceil(total / limit);
  
  let query: any = db.select().from(items).where(conditions.length ? and(...conditions) : undefined).limit(limit).offset(offset);
  
  const column = items[sortBy as keyof typeof items];
  if (column) {
    query = sortOrder === 'asc' ? query.orderBy(asc(column as any)) : query.orderBy(desc(column as any));
  } else {
    query = query.orderBy(desc(items.registeredAt));
  }
  
  const result = await query;
  return { items: result, total, page, totalPages };
}

export async function getItemReports(itemId: number): Promise<any[]> {
  return await db.select().from(reports).where(eq(reports.itemId, itemId));
}

export async function getItemByUniqueIdentifier(identifier: string): Promise<Item | undefined> {
  const [item] = await db.select().from(items).where(eq(items.uniqueIdentifier, identifier));
  return item;
}
