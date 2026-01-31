import { db } from "../db";
import { eq, like, and, or, desc, asc, sql } from "drizzle-orm";
import { 
  users, type User, type InsertUser, 
  userActivityLogs, type UserActivityLog, type InsertUserActivityLog,
  statusChanges, type InsertStatusChange, type StatusChange,
  type AccountStatus, type VerificationStatus
} from "@shared/schema";
import { createStatusChange } from "./admin.storage";

export async function getUser(id: number): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function createUser(insertUser: InsertUser): Promise<User> {
  const [user] = await db.insert(users).values(insertUser).returning();
  return user;
}

export async function updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
  const [updatedUser] = await db
    .update(users)
    .set(userData)
    .where(eq(users.id, id))
    .returning();
  return updatedUser;
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
  
  const column = users[sortBy as keyof typeof users];
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
