import { db } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";
import { 
  adminActionLogs, type AdminActionLog, type InsertAdminActionLog,
  roles, type Role, type InsertRole,
  verificationRequests, type VerificationRequest, type InsertVerificationRequest,
  statusChanges, type StatusChange, type InsertStatusChange,
  userWarnings, type UserWarning, type InsertUserWarning
} from "@shared/schema";

// Admin action logs
export async function getRecentAdminActions(limit: number = 20): Promise<AdminActionLog[]> {
  return await db.select()
    .from(adminActionLogs)
    .orderBy(desc(adminActionLogs.timestamp))
    .limit(limit);
}

export async function getAdminActionLogs(filters?: {
  adminId?: number;
  targetUserId?: number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}): Promise<{ logs: AdminActionLog[]; total: number }> {
  const { adminId, targetUserId, action, startDate, endDate, page = 1, pageSize = 10 } = filters || {};
  const conditions: any[] = [];
  
  if (adminId) conditions.push(eq(adminActionLogs.adminId, adminId));
  if (targetUserId) conditions.push(eq(adminActionLogs.targetUserId, targetUserId));
  if (action) conditions.push(eq(adminActionLogs.action, action));
  
  if (startDate && endDate) {
    conditions.push(and(sql`${adminActionLogs.timestamp} >= ${startDate}`, sql`${adminActionLogs.timestamp} <= ${endDate}`));
  } else if (startDate) {
    conditions.push(sql`${adminActionLogs.timestamp} >= ${startDate}`);
  } else if (endDate) {
    conditions.push(sql`${adminActionLogs.timestamp} <= ${endDate}`);
  }
  
  const totalQuery = conditions.length > 0
    ? db.select({ count: sql<number>`count(*)` }).from(adminActionLogs).where(and(...conditions))
    : db.select({ count: sql<number>`count(*)` }).from(adminActionLogs);
  
  const totalResult = await totalQuery;
  const count = totalResult[0]?.count || 0;
  
  const offset = (page - 1) * pageSize;
  let query: any = db.select().from(adminActionLogs);
  if (conditions.length > 0) query = query.where(and(...conditions));
  
  const results = await query.orderBy(desc(adminActionLogs.timestamp)).limit(pageSize).offset(offset);
  
  return { logs: results, total: Number(count) };
}

export async function createAdminActionLog(log: InsertAdminActionLog): Promise<AdminActionLog> {
  const [newLog] = await db.insert(adminActionLogs).values(log).returning();
  return newLog;
}

// Role management
export async function getRole(id: number): Promise<Role | undefined> {
  const [role] = await db.select().from(roles).where(eq(roles.id, id));
  return role;
}

export async function getRoleByName(name: string): Promise<Role | undefined> {
  const [role] = await db.select().from(roles).where(eq(roles.name, name));
  return role;
}

export async function getAllRoles(): Promise<Role[]> {
  return await db.select().from(roles);
}

export async function createRole(role: InsertRole): Promise<Role> {
  const [newRole] = await db.insert(roles).values(role).returning();
  return newRole;
}

export async function updateRole(id: number, roleData: Partial<Role>): Promise<Role | undefined> {
  const [updatedRole] = await db.update(roles).set({ ...roleData, updatedAt: new Date() }).where(eq(roles.id, id)).returning();
  return updatedRole;
}

export async function deleteRole(id: number): Promise<boolean> {
  const result = await db.delete(roles).where(eq(roles.id, id)).returning({ id: roles.id });
  return result.length > 0;
}

// Verification requests
export async function getVerificationRequest(id: number): Promise<VerificationRequest | undefined> {
  const [request] = await db.select().from(verificationRequests).where(eq(verificationRequests.id, id));
  return request;
}

export async function getUserVerificationRequests(userId: number): Promise<VerificationRequest[]> {
  return await db.select().from(verificationRequests).where(eq(verificationRequests.userId, userId)).orderBy(desc(verificationRequests.submittedAt));
}

export async function getPendingVerificationRequests(page: number, pageSize: number): Promise<{ requests: VerificationRequest[]; total: number }> {
  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(verificationRequests).where(eq(verificationRequests.status, 'pending'));
  const count = totalResult[0]?.count || 0;
  
  const offset = (page - 1) * pageSize;
  const requests = await db.select().from(verificationRequests).where(eq(verificationRequests.status, 'pending')).orderBy(desc(verificationRequests.submittedAt)).limit(pageSize).offset(offset);
  
  return { requests, total: Number(count) };
}

export async function createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest> {
  const [newRequest] = await db.insert(verificationRequests).values({ ...request, documentUrls: request.documentUrls || [] }).returning();
  return newRequest;
}

export async function updateVerificationRequest(id: number, requestData: Partial<VerificationRequest>): Promise<VerificationRequest | undefined> {
  const [updatedRequest] = await db.update(verificationRequests).set(requestData).where(eq(verificationRequests.id, id)).returning();
  return updatedRequest;
}

// Status changes
export async function getUserStatusHistory(userId: number): Promise<StatusChange[]> {
  return await db.select().from(statusChanges).where(eq(statusChanges.userId, userId)).orderBy(desc(statusChanges.timestamp));
}

export async function createStatusChange(change: InsertStatusChange): Promise<StatusChange> {
  const [newChange] = await db.insert(statusChanges).values(change).returning();
  return newChange;
}

// User warnings
export async function getUserWarnings(userId: number): Promise<UserWarning[]> {
  return await db.select().from(userWarnings).where(eq(userWarnings.userId, userId)).orderBy(desc(userWarnings.issuedAt));
}

export async function createUserWarning(warning: InsertUserWarning): Promise<UserWarning> {
  const [newWarning] = await db.insert(userWarnings).values(warning).returning();
  return newWarning;
}

export async function acknowledgeWarning(id: number): Promise<UserWarning | undefined> {
  const [acknowledgedWarning] = await db.update(userWarnings).set({ acknowledgedAt: new Date() }).where(eq(userWarnings.id, id)).returning();
  return acknowledgedWarning;
}
