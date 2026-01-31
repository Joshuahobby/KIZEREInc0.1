import { db } from "../db";
import { eq, like, and, or, desc, asc, sql } from "drizzle-orm";
import { reports, type Report, type InsertReport, users, items, type User, type Item } from "@shared/schema";

export async function getReport(id: number): Promise<Report | undefined> {
  const [report] = await db.select().from(reports).where(eq(reports.id, id));
  return report;
}

export async function getUserReports(userId: number): Promise<Report[]> {
  return await db.select().from(reports).where(eq(reports.userId, userId));
}

export async function createReport(report: InsertReport): Promise<Report> {
  const [newReport] = await db.insert(reports).values(report).returning();
  return newReport;
}

export async function updateReport(id: number, reportData: Partial<Report>): Promise<Report | undefined> {
  const [updatedReport] = await db.update(reports).set(reportData).where(eq(reports.id, id)).returning();
  return updatedReport;
}

export async function getLostReports(): Promise<Report[]> {
  return await db.select().from(reports).where(eq(reports.type, 'lost'));
}

export async function getFoundReports(): Promise<Report[]> {
  return await db.select().from(reports).where(eq(reports.type, 'found'));
}

export async function getAllReports(): Promise<Report[]> {
  return await db.select().from(reports).orderBy(desc(reports.reportedAt));
}

export async function getReportStats(): Promise<any> {
  const allReports = await getAllReports();
  const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneMonthAgo = new Date(); oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  return {
    totalReports: allReports.length,
    lostReports: allReports.filter(r => r.type === 'lost').length,
    foundReports: allReports.filter(r => r.type === 'found').length,
    openReports: allReports.filter(r => r.status === 'Open').length,
    inProgressReports: allReports.filter(r => r.status === 'In_Progress').length,
    resolvedReports: allReports.filter(r => r.status === 'Resolved').length,
    closedReports: allReports.filter(r => r.status === 'Closed').length,
    reportsThisWeek: allReports.filter(r => new Date(r.reportedAt) >= oneWeekAgo).length,
    reportsThisMonth: allReports.filter(r => new Date(r.reportedAt) >= oneMonthAgo).length
  };
}

export async function getReportsWithFilters(options: {
  page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc';
  search?: string; type?: string; status?: string; dateRange?: { start: Date; end: Date } | null;
  userId?: number; itemId?: number; location?: string;
}): Promise<{ reports: Report[]; total: number; page: number; totalPages: number }> {
  const { page, limit, sortBy = 'reportedAt', sortOrder = 'desc', search, type, status, dateRange, userId, itemId, location } = options;
  const offset = (page - 1) * limit;
  const conditions = [];
  
  if (search) conditions.push(or(like(reports.title, `%${search}%`), like(reports.description, `%${search}%`)));
  if (type) conditions.push(eq(reports.type, type));
  if (status) conditions.push(eq(reports.status, status));
  if (dateRange) conditions.push(and(sql`${reports.date} >= ${dateRange.start}`, sql`${reports.date} <= ${dateRange.end}`));
  if (userId) conditions.push(eq(reports.userId, userId));
  if (itemId) conditions.push(eq(reports.itemId, itemId));
  if (location) conditions.push(like(reports.location, `%${location}%`));
  
  const countResult = await db.select({ count: sql`count(*)::int` }).from(reports).where(conditions.length ? and(...conditions) : undefined);
  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);
  
  let query: any = db.select().from(reports).where(conditions.length ? and(...conditions) : undefined).limit(limit).offset(offset);
  const column = reports[sortBy as keyof typeof reports];
  if (column) {
    query = sortOrder === 'asc' ? query.orderBy(asc(column as any)) : query.orderBy(desc(column as any));
  } else {
    query = query.orderBy(desc(reports.reportedAt));
  }
  
  const result = await query;
  return { reports: result, total, page, totalPages };
}

export async function getReportWithRelatedData(id: number): Promise<any> {
  const report = await getReport(id);
  if (!report) return { report: undefined };
  const [user] = await db.select().from(users).where(eq(users.id, report.userId));
  let item = undefined;
  if (report.itemId) [item] = await db.select().from(items).where(eq(items.id, report.itemId));
  return { report, user, item };
}

export async function generateReportCSV(): Promise<string> {
  const allReports = await getAllReports();
  const headers = ['ID', 'Type', 'Title', 'Description', 'Location', 'Date', 'Status', 'User ID', 'Item ID', 'Contact Info', 'Reported At'];
  const rows = allReports.map(r => [
    r.id, r.type, `"${r.title.replace(/"/g, '""')}"`, `"${r.description.replace(/"/g, '""')}"`,
    `"${r.location.replace(/"/g, '""')}"`, new Date(r.date).toISOString().split('T')[0],
    r.status, r.userId, r.itemId || '', r.contactInfo ? `"${r.contactInfo.replace(/"/g, '""')}"` : '',
    new Date(r.reportedAt).toISOString()
  ]);
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}
