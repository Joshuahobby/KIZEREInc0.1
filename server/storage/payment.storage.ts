import { db } from "../db";
import { eq, like, and, or, desc, not, sql } from "drizzle-orm";
import { 
  payments, type Payment, type InsertPayment, 
  paymentMethods, type PaymentMethod, type InsertPaymentMethod,
  paymentPackages, type PaymentPackage, type InsertPaymentPackage,
  type PaymentType, users
} from "@shared/schema";

// Payments
export async function getPayment(id: number): Promise<Payment | undefined> {
  const [payment] = await db.select().from(payments).where(eq(payments.id, id));
  return payment;
}

export async function getPaymentByTransactionRef(transactionRef: string): Promise<Payment | undefined> {
  const [payment] = await db.select().from(payments).where(eq(payments.transactionRef, transactionRef));
  return payment;
}

export async function getUserPayments(userId: number): Promise<Payment[]> {
  return await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
}

export async function createPayment(payment: InsertPayment): Promise<Payment> {
  const [newPayment] = await db.insert(payments).values(payment).returning();
  return newPayment;
}

export async function updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment | undefined> {
  const [updatedPayment] = await db.update(payments).set(paymentData).where(eq(payments.id, id)).returning();
  return updatedPayment;
}

export async function getItemPayments(itemId: number): Promise<Payment[]> {
  return await db.select().from(payments).where(eq(payments.itemId, itemId)).orderBy(desc(payments.createdAt));
}

export async function getReportPayments(reportId: number): Promise<Payment[]> {
  return await db.select().from(payments).where(eq(payments.reportId, reportId)).orderBy(desc(payments.createdAt));
}

export async function getAllPayments(): Promise<Payment[]> {
  return await db.select().from(payments).orderBy(desc(payments.createdAt));
}

export async function getPaymentsWithFilters(options: {
  page: number; pageSize: number; search?: string; status?: string; type?: string;
  dateFilter?: { start: Date; end: Date } | null;
}): Promise<{ payments: Payment[]; total: number }> {
  const { page, pageSize, search, status, type, dateFilter } = options;
  const conditions: any[] = [];
  
  if (status) conditions.push(eq(payments.status, status));
  if (type) conditions.push(eq(payments.type, type));
  if (dateFilter) conditions.push(and(sql`${payments.createdAt} >= ${dateFilter.start}`, sql`${payments.createdAt} <= ${dateFilter.end}`));
  if (search) conditions.push(or(like(payments.transactionRef, `%${search}%`), like(payments.transactionId || '', `%${search}%`)));
  
  let query: any = db.select().from(payments);
  if (conditions.length > 0) query = query.where(and(...conditions));
  
  const allPayments = await query;
  const results = await query.orderBy(desc(payments.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  
  return { payments: results, total: allPayments.length };
}

// Payment Methods
export async function getUserPaymentMethods(userId: number): Promise<PaymentMethod[]> {
  return await db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId)).orderBy(desc(paymentMethods.createdAt));
}

export async function createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod> {
  const [newPaymentMethod] = await db.insert(paymentMethods).values(paymentMethod).returning();
  return newPaymentMethod;
}

export async function updatePaymentMethod(id: number, paymentMethodData: Partial<PaymentMethod>): Promise<PaymentMethod | undefined> {
  const [updatedPaymentMethod] = await db.update(paymentMethods).set(paymentMethodData).where(eq(paymentMethods.id, id)).returning();
  return updatedPaymentMethod;
}

export async function deletePaymentMethod(id: number): Promise<boolean> {
  const result = await db.delete(paymentMethods).where(eq(paymentMethods.id, id)).returning({ id: paymentMethods.id });
  return result.length > 0;
}

export async function setDefaultPaymentMethod(userId: number, paymentMethodId: number): Promise<void> {
  await db.update(paymentMethods).set({ isDefault: false }).where(eq(paymentMethods.userId, userId));
  await db.update(paymentMethods).set({ isDefault: true }).where(and(eq(paymentMethods.id, paymentMethodId), eq(paymentMethods.userId, userId)));
}

// Packages
export async function getPaymentPackage(id: number): Promise<PaymentPackage | undefined> {
  const [p] = await db.select().from(paymentPackages).where(eq(paymentPackages.id, id));
  return p;
}

export async function getPaymentPackageByType(type: PaymentType, onlyActive: boolean = true): Promise<PaymentPackage[]> {
  const conditions = [eq(paymentPackages.type, type)];
  if (onlyActive) conditions.push(eq(paymentPackages.status, 'active'));
  
  return await db.select()
    .from(paymentPackages)
    .where(and(...conditions))
    .orderBy(desc(paymentPackages.isDefault));
}

export async function getDefaultPackageByType(type: PaymentType): Promise<PaymentPackage | undefined> {
  const [p] = await db.select().from(paymentPackages).where(and(eq(paymentPackages.type, type), eq(paymentPackages.isDefault, true), eq(paymentPackages.status, 'active')));
  return p;
}

export async function createPaymentPackage(paymentPackage: InsertPaymentPackage): Promise<PaymentPackage> {
  const existing = await getPaymentPackageByType(paymentPackage.type, false);
  if (existing.length === 0) paymentPackage.isDefault = true;
  if (paymentPackage.isDefault) {
    await db.update(paymentPackages).set({ isDefault: false }).where(eq(paymentPackages.type, paymentPackage.type));
  }
  const [p] = await db.insert(paymentPackages).values({ ...paymentPackage, amount: paymentPackage.amount.toString() as any }).returning();
  return p;
}

export async function updatePaymentPackage(id: number, packageData: Partial<PaymentPackage>): Promise<PaymentPackage | undefined> {
  const p = await getPaymentPackage(id);
  if (!p) return undefined;
  if (packageData.isDefault) {
    await db.update(paymentPackages).set({ isDefault: false }).where(and(eq(paymentPackages.type, p.type), not(eq(paymentPackages.id, id))));
  }
  const [updated] = await db.update(paymentPackages).set({ ...packageData, updatedAt: new Date() }).where(eq(paymentPackages.id, id)).returning();
  return updated;
}

export async function deletePaymentPackage(id: number): Promise<boolean> {
  const result = await db.delete(paymentPackages).where(eq(paymentPackages.id, id)).returning({ id: paymentPackages.id });
  return result.length > 0;
}

export async function getAllPaymentPackages(includeInactive: boolean = false): Promise<PaymentPackage[]> {
  let query: any = db.select().from(paymentPackages);
  if (!includeInactive) query = query.where(eq(paymentPackages.status, 'active'));
  return await query.orderBy(desc(paymentPackages.type), desc(paymentPackages.isDefault));
}

export async function setDefaultPaymentPackage(id: number): Promise<PaymentPackage | undefined> {
  const p = await getPaymentPackage(id);
  if (!p) return undefined;
  
  await db.update(paymentPackages).set({ isDefault: false }).where(eq(paymentPackages.type, p.type));
  return updatePaymentPackage(id, { isDefault: true });
}
