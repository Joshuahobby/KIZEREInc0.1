import { db } from "../db";
import { eq, like, and, or, desc, sql } from "drizzle-orm";
import { coupons, type Coupon, type InsertCoupon } from "@shared/schema";

export async function getCoupon(id: number): Promise<Coupon | undefined> {
  const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id));
  return coupon;
}

export async function getCouponByCode(code: string): Promise<Coupon | undefined> {
  const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code));
  return coupon;
}

export async function getAllCoupons(): Promise<Coupon[]> {
  return await db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

export async function getCouponsWithFilters(options: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  type?: string;
}): Promise<{ coupons: Coupon[]; total: number }> {
  try {
    const { page, pageSize, search, status, type } = options;
  const conditions: any[] = [];
  
  if (status) conditions.push(eq(coupons.status, status));
  if (type) conditions.push(eq(coupons.applicableType, type));
  if (search) {
    conditions.push(or(
      like(coupons.code, `%${search}%`),
      like(coupons.description, `%${search}%`)
    ));
  }
  
  let query = db.select().from(coupons);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  // Get total count first
  let countQuery = db.select({ count: sql<number>`count(*)` }).from(coupons);
  if (conditions.length > 0) {
    countQuery = countQuery.where(and(...conditions)) as any;
  }
  const countResult = await countQuery;
    
  const total = Number(countResult[0]?.count || 0);

  const results = await query
    .orderBy(desc(coupons.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  
    return { coupons: results, total };
  } catch (error) {
    console.error('Error in getCouponsWithFilters:', error);
    throw error;
  }
}

export async function createCoupon(coupon: InsertCoupon): Promise<Coupon> {
  const [newCoupon] = await db.insert(coupons).values({
    ...coupon,
    discountValue: coupon.discountValue.toString() as any,
    minPurchase: coupon.minPurchase?.toString() as any,
    maxDiscount: coupon.maxDiscount?.toString() as any
  }).returning();
  return newCoupon;
}

export async function updateCoupon(id: number, couponData: Partial<InsertCoupon>): Promise<Coupon | undefined> {
  const data: any = { ...couponData, updatedAt: new Date() };
  
  // Convert numeric fields to strings if present
  if (data.discountValue !== undefined) data.discountValue = data.discountValue.toString();
  if (data.minPurchase !== undefined) data.minPurchase = data.minPurchase.toString();
  if (data.maxDiscount !== undefined) data.maxDiscount = data.maxDiscount?.toString() || null;

  const [updatedCoupon] = await db
    .update(coupons)
    .set(data)
    .where(eq(coupons.id, id))
    .returning();
  return updatedCoupon;
}

export async function incrementCouponUsage(id: number): Promise<void> {
  await db
    .update(coupons)
    .set({ usageCount: sql`${coupons.usageCount} + 1` })
    .where(eq(coupons.id, id));
}

export async function deleteCoupon(id: number): Promise<boolean> {
  const result = await db.delete(coupons).where(eq(coupons.id, id)).returning({ id: coupons.id });
  return result.length > 0;
}
