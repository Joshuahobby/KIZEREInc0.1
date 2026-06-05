import { db } from "../db";
import { eq, like, and, or, desc, asc, sql, inArray } from "drizzle-orm";
import {
  users, type User, type InsertUser,
  userActivityLogs, type UserActivityLog, type InsertUserActivityLog,
  statusChanges, type InsertStatusChange, type StatusChange,
  type AccountStatus, type VerificationStatus,
  items, reports, claims, chats, messages, notifications,
  payments, payouts, paymentMethods, adminActionLogs,
  verificationRequests, userWarnings, moderationReports,
  claimAppeals, claimStatusLogs, auditLogs, consentRecords, 
  pushSubscriptions, verificationCodes, roles, paymentPackages, blogPosts
} from "@shared/schema";
import { createStatusChange } from "./admin.storage";

export async function getUser(id: number): Promise<User | undefined> {
  const results = await db.select().from(users).where(eq(users.id, id));
  return results[0];
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const results = await db.select().from(users).where(eq(users.username, username));
  return results[0];
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const results = await db.select().from(users).where(eq(users.email, email));
  return results[0];
}

export async function getUserByNationalId(nationalId: string): Promise<User | undefined> {
  const results = await db.select().from(users).where(eq(users.nationalId, nationalId));
  return results[0];
}

export async function createUser(insertUser: InsertUser): Promise<User> {
  const results = await db.insert(users).values([insertUser] as any).returning();
  return results[0]!;
}

export async function updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
  const results = await db
    .update(users)
    .set(userData as any)
    .where(eq(users.id, id))
    .returning();
  return results[0];
}

export async function getAllUsers(): Promise<User[]> {
  return await db.select().from(users);
}

export async function getUsersWithFilters(options: {
  page: number;
  pageSize: number;
  search?: string;
  role?: string;
  status?: string;
  verificationStatus?: string;
  activityLevel?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ users: User[]; total: number }> {
  const {
    page,
    pageSize,
    search,
    role,
    status,
    verificationStatus,
    activityLevel,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const conditions: any[] = [];

  if (search) {
    conditions.push(
      or(
        like(users.fullName, `%${search}%`),
        like(users.username, `%${search}%`),
        like(users.email, `%${search}%`),
        like(users.phoneNumber || '', `%${search}%`)
      )
    );
  }

  if (role) conditions.push(eq(users.role, role));
  if (status) conditions.push(eq(users.status, status));
  if (verificationStatus) conditions.push(eq(users.verificationStatus, verificationStatus));
  if (activityLevel) conditions.push(eq(users.activityLevel, activityLevel));

  if (startDate && endDate) {
    conditions.push(and(sql`${users.createdAt} >= ${startDate}`, sql`${users.createdAt} <= ${endDate}`));
  } else if (startDate) {
    conditions.push(sql`${users.createdAt} >= ${startDate}`);
  } else if (endDate) {
    conditions.push(sql`${users.createdAt} <= ${endDate}`);
  }

  const totalQuery = conditions.length > 0
    ? db.select({ count: sql<number>`count(*)` }).from(users).where(and(...conditions))
    : db.select({ count: sql<number>`count(*)` }).from(users);

  const totalResult = await totalQuery;
  const count = totalResult[0]?.count || 0;

  const offset = (page - 1) * pageSize;
  let query: any = db.select().from(users);

  if (conditions.length > 0) query = query.where(and(...conditions));

  const ALLOWED_USER_SORT = new Set(['createdAt', 'lastLogin', 'username', 'fullName', 'email', 'role', 'status']);
  const column = ALLOWED_USER_SORT.has(sortBy) ? users[sortBy as keyof typeof users] : null;
  if (column) {
    query = sortOrder === 'asc' ? query.orderBy(asc(column as any)) : query.orderBy(desc(column as any));
  } else {
    query = query.orderBy(desc(users.createdAt));
  }

  const usersList = await query.limit(pageSize).offset(offset);

  return { users: usersList, total: Number(count) };
}

export async function exportUsers(format: 'csv' | 'excel', filters?: any): Promise<string> {
  let usersList: User[] = [];

  if (filters) {
    const { users: filteredUsers } = await getUsersWithFilters({
      page: 1,
      pageSize: 1000,
      ...filters
    });
    usersList = filteredUsers;
  } else {
    usersList = await getAllUsers();
  }

  if (format === 'csv' || format === 'excel') {
    const headers = ['ID', 'Full Name', 'Username', 'Email', 'Phone Number', 'Role', 'Status', 'Verification Status', 'Created At', 'Last Login'];
    const rows = usersList.map(user => [
      user.id.toString(),
      user.fullName,
      user.username,
      user.email,
      user.phoneNumber || '',
      user.role,
      user.status || 'active',
      user.verificationStatus || 'pending',
      user.createdAt.toISOString(),
      user.lastLogin ? user.lastLogin.toISOString() : ''
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
  }

  throw new Error('Unsupported export format');
}

export async function updateUserStatus(userId: number, status: AccountStatus, reason?: string, expirationDate?: Date): Promise<StatusChange> {
  const user = await getUser(userId);
  if (!user) throw new Error('User not found');

  const previousStatus = user.status || 'active';
  await updateUser(userId, { status, updatedAt: new Date() });

  const statusChange: InsertStatusChange = {
    userId,
    previousStatus,
    newStatus: status,
    reason: reason || null,
    changedBy: null,
    expirationDate: expirationDate || null,
    notes: null
  };

  return await createStatusChange(statusChange);
}

export async function updateUserRole(userId: number, role: string): Promise<User | undefined> {
  return await updateUser(userId, { role, updatedAt: new Date() });
}

export async function updateUserVerificationStatus(userId: number, status: VerificationStatus): Promise<User | undefined> {
  return await updateUser(userId, { verificationStatus: status, updatedAt: new Date() });
}

export async function countUserActivityLogs(userId: number): Promise<number> {
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(userActivityLogs)
    .where(eq(userActivityLogs.userId, userId));

  return Number(totalResult?.count || 0);
}

export async function getUserActivityLogs(userId: number, page: number, pageSize: number): Promise<UserActivityLog[]> {
  const offset = (page - 1) * pageSize;
  return await db
    .select()
    .from(userActivityLogs)
    .where(eq(userActivityLogs.userId, userId))
    .orderBy(desc(userActivityLogs.timestamp))
    .limit(pageSize)
    .offset(offset);
}

export async function createUserActivityLog(log: InsertUserActivityLog): Promise<UserActivityLog> {
  const [newLog] = await db.insert(userActivityLogs).values(log).returning();
  return newLog;
}

/**
 * Get users by role(s)
 * Used for notifying admins/moderators for appeals
 */
export async function getUsersByRole(roles: string[]): Promise<User[]> {
  if (roles.length === 0) return [];

  const conditions = roles.map(role => eq(users.role, role));
  return await db.select().from(users).where(or(...conditions));
}

/**
 * Update user reputation and return counts
 */
export async function updateUserReputation(userId: number, pointsDelta: number, itemsReturnedDelta: number): Promise<User | undefined> {
  const [updatedUser] = await db
    .update(users)
    .set({
      reputationScore: sql`${users.reputationScore} + ${pointsDelta}`,
      itemsReturnedCount: sql`${users.itemsReturnedCount} + ${itemsReturnedDelta}`,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))
    .returning();

  // Promotion logic: Become "Trusted" at 200 points + 3 returns
  if (updatedUser && !updatedUser.isTrusted && updatedUser.reputationScore! >= 200 && updatedUser.itemsReturnedCount! >= 3) {
    const [trustedUser] = await db
      .update(users)
      .set({ isTrusted: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return trustedUser;
  }

  return updatedUser;
}

/**
 * Delete a user by ID
 * Handles all foreign key dependencies to prevent 500 errors (Orbit Deletion Strategy)
 */
export async function deleteUser(id: number): Promise<boolean> {
  try {
    return await db.transaction(async (tx) => {
      // 0. Define User Content Sets
      const userItemIds = tx.select({ id: items.id }).from(items).where(eq(items.userId, id));
      const userReportIds = tx.select({ id: reports.id }).from(reports).where(eq(reports.userId, id));
      const userClaimIds = tx.select({ id: claims.id }).from(claims).where(eq(claims.userId, id));
      
      // 1. Clear references to user's content (Orbit Level 1)
      
      // Messages in chats related to user's content OR where user is sender
      const affectedChatIds = tx
        .select({ id: chats.id })
        .from(chats)
        .where(
          or(
            inArray(chats.reportId, userReportIds),
            inArray(chats.claimId, userClaimIds),
            eq(chats.finderId, id),
            eq(chats.claimantId, id)
          )
        );
        
      await tx.delete(messages).where(
        or(
          eq(messages.senderId, id),
          inArray(messages.chatId, affectedChatIds)
        )
      );
      
      await tx.delete(chats).where(
        or(
          inArray(chats.reportId, userReportIds),
          inArray(chats.claimId, userClaimIds),
          eq(chats.finderId, id),
          eq(chats.claimantId, id)
        )
      );
      
      // Clear claims from OTHER users pointing to these reports
      await tx.delete(claimStatusLogs).where(
        or(
          eq(claimStatusLogs.changedBy, id),
          inArray(claimStatusLogs.claimId, userClaimIds),
          sql`${claimStatusLogs.claimId} IN (SELECT id FROM ${claims} WHERE report_id IN (SELECT id FROM ${reports} WHERE user_id = ${id}))`
        )
      );
      
      await tx.delete(claimAppeals).where(
        or(
          eq(claimAppeals.userId, id),
          eq(claimAppeals.resolvedBy, id),
          inArray(claimAppeals.claimId, userClaimIds),
          sql`${claimAppeals.claimId} IN (SELECT id FROM ${claims} WHERE report_id IN (SELECT id FROM ${reports} WHERE user_id = ${id}))`
        )
      );

      // Delete ALL claims on User A's reports (by any user)
      await tx.delete(claims).where(inArray(claims.reportId, userReportIds));

      // 2. Clear moderation reports pointing to user content
      // Nullify reviewer/resolver instead of deleting the report to preserve moderation history
      await tx.update(moderationReports).set({ resolvedBy: null }).where(eq(moderationReports.resolvedBy, id));
      await tx.update(moderationReports).set({ reviewedBy: null }).where(eq(moderationReports.reviewedBy, id));
      
      // Delete reports linked to the user's content
      await tx.delete(moderationReports).where(
        or(
          inArray(moderationReports.reportId, userReportIds),
          inArray(moderationReports.itemId, userItemIds),
          inArray(moderationReports.claimId, userClaimIds)
        )
      );

      // 3. Clear payouts and payments tied to user content
      await tx.delete(payouts).where(
        or(
          eq(payouts.userId, id),
          inArray(payouts.reportId, userReportIds)
        )
      );
      
      // Nullify references in payments/notifications that point to user content (preserves history)
      await tx.update(notifications).set({ relatedReportId: null, relatedItemId: null })
        .where(or(inArray(notifications.relatedReportId, userReportIds), inArray(notifications.relatedItemId, userItemIds)));
        
      await tx.update(payments).set({ reportId: null, itemId: null })
        .where(or(inArray(payments.reportId, userReportIds), inArray(payments.itemId, userItemIds)));

      // 4. Clear user's OWN primary records
      await tx.delete(claims).where(eq(claims.userId, id));
      await tx.delete(reports).where(eq(reports.userId, id));
      await tx.delete(items).where(eq(items.userId, id));

      // 5. Clear user profile related records
      await tx.delete(notifications).where(eq(notifications.userId, id));
      await tx.delete(payments).where(eq(payments.userId, id));
      await tx.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, id));
      await tx.delete(consentRecords).where(eq(consentRecords.userId, id));
      await tx.delete(paymentMethods).where(eq(paymentMethods.userId, id));
      await tx.delete(verificationRequests).where(eq(verificationRequests.userId, id));
      await tx.delete(verificationCodes).where(eq(verificationCodes.userId, id));
      await tx.delete(userActivityLogs).where(eq(userActivityLogs.userId, id));
      await tx.delete(statusChanges).where(eq(statusChanges.userId, id));
      await tx.delete(userWarnings).where(eq(userWarnings.userId, id));

      // 6. Audit Trail
      await tx.update(auditLogs).set({ userId: null }).where(eq(auditLogs.userId, id));
      
      // Admin Action Logs: delete if user was the actor (FK not null), nullify if user was the target
      await tx.delete(adminActionLogs).where(eq(adminActionLogs.adminId, id));
      await tx.update(adminActionLogs).set({ targetUserId: null }).where(eq(adminActionLogs.targetUserId, id));
      
      await tx.update(blogPosts).set({ authorId: null }).where(eq(blogPosts.authorId, id));
      await tx.update(verificationRequests).set({ reviewedBy: null }).where(eq(verificationRequests.reviewedBy, id));
      await tx.update(statusChanges).set({ changedBy: null }).where(eq(statusChanges.changedBy, id));
      await tx.update(userWarnings).set({ issuedBy: null }).where(eq(userWarnings.issuedBy, id));
      await tx.update(roles).set({ createdBy: null }).where(eq(roles.createdBy, id));
      await tx.update(paymentPackages).set({ createdBy: null }).where(eq(paymentPackages.createdBy, id));
      
      // Handle claim status logs (changedBy is NOT NULL, so we must delete)
      await tx.delete(claimStatusLogs).where(eq(claimStatusLogs.changedBy, id));

      // 7. Finally, delete the user themselves
      const result = await tx.delete(users).where(eq(users.id, id)).returning();
      return result.length > 0;
    });
  } catch (error) {
    console.error("Critical error in deleteUser transaction:", error);
    throw error;
  }
}


