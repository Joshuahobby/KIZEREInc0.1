import { db } from "../db";
import { eq, like, and, or, desc, asc, sql } from "drizzle-orm";
import { reports, type Report, type InsertReport, users, items, type User, type Item, payments, type Payment, type InsertPayment, 
  paymentMethods, type PaymentMethod, type InsertPaymentMethod,
  paymentPackages, type PaymentPackage, type InsertPaymentPackage,
  type PaymentType, claims
} from "@shared/schema";

export async function getReport(id: number): Promise<Report | undefined> {
  const [report] = await db.select().from(reports).where(eq(reports.id, id));
  return report;
}

export async function getUserReports(userId: number): Promise<Report[]> {
  return await db.select().from(reports).where(eq(reports.userId, userId));
}

export async function createReport(report: InsertReport): Promise<Report> {
  // Generate unique receipt number (e.g., FND-X1Y2Z or LST-A3B4C)
  const prefix = report.type === 'found' ? 'FND' : 'LST';
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  const receiptNumber = report.receiptNumber || `${prefix}-${randomStr}`;

  const [newReport] = await db.insert(reports).values({
    ...report,
    receiptNumber
  }).returning();
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
  
  // Basic filters
  if (type) conditions.push(eq(reports.type, type));
  if (status) conditions.push(eq(reports.status, status));
  if (dateRange) conditions.push(and(sql`${reports.date} >= ${dateRange.start}`, sql`${reports.date} <= ${dateRange.end}`));
  if (userId) conditions.push(eq(reports.userId, userId));
  if (itemId) conditions.push(eq(reports.itemId, itemId));
  if (location) conditions.push(like(reports.location, `%${location}%`));
  
  // Search logic
  if (search) {
    if (!location) { 
      // If we only have search text, use it for title/desc/location
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(or(
        like(sql`lower(${reports.title})`, searchLower), 
        like(sql`lower(${reports.description})`, searchLower),
        like(sql`lower(${reports.location})`, searchLower)
      ));
    }
  }

  const countResult = await db.select({ count: sql`count(*)::int` }).from(reports).where(conditions.length ? and(...conditions) : undefined);
  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);
  
  // Build main query
  let querySelection: any = {
    ...reports,
    claimCount: sql<number>`count(${claims.id})`.mapWith(Number)
  };

  // Add relevance score if searching
  if (search) {
    const searchLower = search.toLowerCase();
    querySelection.relevance = sql<number>`
      (CASE 
        WHEN lower(${reports.title}) LIKE ${'%' + searchLower + '%'} THEN 3 
        ELSE 0 
      END) +
      (CASE 
        WHEN lower(${reports.description}) LIKE ${'%' + searchLower + '%'} THEN 1 
        ELSE 0 
      END) +
      (CASE 
        WHEN lower(${reports.location}) LIKE ${'%' + searchLower + '%'} THEN 1 
        ELSE 0 
      END)
    `.as('relevance');
  }

  let query: any = db.select(querySelection)
    .from(reports)
    .leftJoin(claims, eq(reports.id, claims.reportId));

  if (conditions.length) {
    query = query.where(and(...conditions));
  }

  query = query.groupBy(reports.id);

  // Sorting
  const sortColumn = (sortBy && sortBy in reports) ? reports[sortBy as keyof typeof reports] : reports.reportedAt;
  
  if (search) {
    // If searching, prioritize relevance first, then the requested sort
    query = query.orderBy(desc(sql`relevance`), sortOrder === 'asc' ? asc(sortColumn as any) : desc(sortColumn as any));
  } else {
    query = sortOrder === 'asc' ? query.orderBy(asc(sortColumn as any)) : query.orderBy(desc(sortColumn as any));
  }
  
  const result = await query.limit(limit).offset(offset);
  
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
