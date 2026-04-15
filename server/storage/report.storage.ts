import { db } from "../db";
import { eq, like, and, or, desc, asc, sql, inArray } from "drizzle-orm";
import {
  reports, type Report, type InsertReport, users, items, type User, type Item, payments, type Payment, type InsertPayment,
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

  if (!report.userId) {
    throw new Error("User ID is required to create a report");
  }

  const [newReport] = await db.insert(reports).values({
    ...report,
    userId: report.userId,
    bountyAmount: report.bountyAmount ? report.bountyAmount.toString() : undefined,
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
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [counts] = await db.select({
    total:          sql<number>`count(*)`.mapWith(Number),
    lost:           sql<number>`count(*) filter (where type = 'lost')`.mapWith(Number),
    found:          sql<number>`count(*) filter (where type = 'found')`.mapWith(Number),
    open:           sql<number>`count(*) filter (where status = 'Open')`.mapWith(Number),
    inProgress:     sql<number>`count(*) filter (where status = 'In_Progress')`.mapWith(Number),
    resolved:       sql<number>`count(*) filter (where status = 'Resolved')`.mapWith(Number),
    closed:         sql<number>`count(*) filter (where status = 'Closed')`.mapWith(Number),
    thisWeek:       sql<number>`count(*) filter (where reported_at >= ${oneWeekAgo})`.mapWith(Number),
    thisMonth:      sql<number>`count(*) filter (where reported_at >= ${oneMonthAgo})`.mapWith(Number),
  }).from(reports);

  return {
    totalReports:      counts.total,
    lostReports:       counts.lost,
    foundReports:      counts.found,
    openReports:       counts.open,
    inProgressReports: counts.inProgress,
    resolvedReports:   counts.resolved,
    closedReports:     counts.closed,
    reportsThisWeek:   counts.thisWeek,
    reportsThisMonth:  counts.thisMonth,
  };
}

export async function getReportsWithFilters(options: {
  page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc';
  search?: string; type?: string; status?: string; category?: string;
  dateRange?: { start: Date; end: Date } | null;
  dateFilter?: string;
  userId?: number; itemId?: number; location?: string; uniqueIdentifier?: string;
  paymentStatus?: string;
  requestingUserId?: number;
}): Promise<{ reports: Report[]; total: number; page: number; totalPages: number }> {
  const { 
    page, limit, sortBy = 'reportedAt', sortOrder = 'desc', 
    search, type, status, category, dateRange, dateFilter, 
    userId, itemId, location, uniqueIdentifier, paymentStatus, 
    requestingUserId 
  } = options;
  const offset = (page - 1) * limit;
  const conditions = [];

  // Basic filters
  if (type) conditions.push(eq(reports.type, type));

  // Status filter (support single or comma-separated list)
  if (status) {
    const statuses = status.split(',').map(s => s.trim());
    if (statuses.length > 1) {
      conditions.push(inArray(reports.status, statuses));
    } else {
      conditions.push(eq(reports.status, statuses[0]));
    }
  }

  // Category filter (support single or comma-separated list)
  if (category && category !== 'All Categories') {
    const categories = category.split(',').map(c => c.trim());
    if (categories.length > 1) {
      conditions.push(inArray(reports.category, categories));
    } else {
      conditions.push(eq(reports.category, categories[0]));
    }
  }

  if (dateRange) conditions.push(and(sql`${reports.date} >= ${dateRange.start}`, sql`${reports.date} <= ${dateRange.end}`));

  if (dateFilter) {
    const now = new Date();
    if (dateFilter === '24h') conditions.push(sql`${reports.reportedAt} >= ${new Date(now.getTime() - 24 * 60 * 60 * 1000)}`);
    if (dateFilter === '7d') conditions.push(sql`${reports.reportedAt} >= ${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)}`);
    if (dateFilter === '30d') conditions.push(sql`${reports.reportedAt} >= ${new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)}`);
  }

  if (userId) conditions.push(eq(reports.userId, userId));
  if (itemId) conditions.push(eq(reports.itemId, itemId));
  if (location && location !== 'All Locations') conditions.push(like(reports.location, `%${location}%`));
  if (uniqueIdentifier) conditions.push(eq(reports.uniqueIdentifier, uniqueIdentifier));

  // Payment Status & Visibility Logic
  if (paymentStatus === 'successful') {
    // If specifically asking for successful payments (public view)
    if (requestingUserId) {
      // Show reports that are either paid OR belong to the requesting user
      conditions.push(or(
        eq(reports.paymentStatus, 'successful'),
        eq(reports.userId, requestingUserId)
      ));
    } else {
      // Only show paid reports (anonymous view)
      conditions.push(eq(reports.paymentStatus, 'successful'));
    }
  } else if (paymentStatus) {
    conditions.push(eq(reports.paymentStatus, paymentStatus));
  }

  // Search logic (multi-keyword OR matching)
  if (search) {
    const searchLower = search.toLowerCase().trim();
    const keywords = searchLower.split(/\s+/).filter(k => k.length > 1);

    if (keywords.length > 0) {
      keywords.forEach(keyword => {
        const pattern = `%${keyword}%`;
        conditions.push(or(
          like(sql`lower(${reports.title})`, pattern),
          like(sql`lower(${reports.description})`, pattern),
          like(sql`lower(${reports.location})`, pattern)
        ));
      });
    }
  }

  const countResult = await db.select({ count: sql<number>`count(*)` }).from(reports).where(conditions.length ? and(...conditions) : undefined);
  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  // Build main query
  // We list columns explicitly to avoid issues with spreading table objects as selection objects
  // and to ensure better compatibility with various Drizzle versions.
  const querySelection = {
    id: reports.id,
    userId: reports.userId,
    itemId: reports.itemId,
    type: reports.type,
    category: reports.category,
    title: reports.title,
    description: reports.description,
    location: reports.location,
    date: reports.date,
    status: reports.status,
    contactInfo: reports.contactInfo,
    receiptNumber: reports.receiptNumber,
    imageUrls: reports.imageUrls,
    expirationDate: reports.expirationDate,
    gracePeriodEnd: reports.gracePeriodEnd,
    paymentStatus: reports.paymentStatus,
    uniqueIdentifier: reports.uniqueIdentifier,
    custodyLocation: reports.custodyLocation,
    challengeQuestion: reports.challengeQuestion,
    ocrText: reports.ocrText,
    reportedAt: reports.reportedAt,
    claimCount: sql<number>`(SELECT count(*) FROM ${claims} WHERE ${claims.reportId} = ${reports.id})`.mapWith(Number),
    isFeatured: reports.isFeatured,
    featuredAt: reports.featuredAt
  } as any;

  // Add relevance score if searching
  if (search) {
    const searchLower = search.toLowerCase().trim();
    const keywords = searchLower.split(/\s+/).filter(k => k.length > 1);

    querySelection.relevance = sql<number>`
      (CASE 
        WHEN lower(${reports.title}) LIKE ${'%' + searchLower + '%'} THEN 10 
        ELSE 0 
      END) +
      (CASE 
        WHEN lower(${reports.uniqueIdentifier}) LIKE ${'%' + searchLower + '%'} THEN 15 
        ELSE 0 
      END) +
      (CASE 
        WHEN lower(${reports.description}) LIKE ${'%' + searchLower + '%'} THEN 5 
        ELSE 0 
      END)
    `;

    // Add keyword-based scoring
    if (keywords.length > 0) {
      keywords.forEach(k => {
        const pattern = '%' + k + '%';
        querySelection.relevance = sql`${querySelection.relevance} + 
          (CASE WHEN lower(${reports.title}) LIKE ${pattern} THEN 2 ELSE 0 END) +
          (CASE WHEN lower(${reports.description}) LIKE ${pattern} THEN 1 ELSE 0 END)`;
      });
    }
  }

  let query: any = db.select(querySelection)
    .from(reports);

  if (conditions.length) {
    query = query.where(and(...conditions));
  }

  // Sorting
  const sortColumn = (sortBy && sortBy in reports) ? reports[sortBy as keyof typeof reports] : reports.reportedAt;

  if (search) {
    // If searching, prioritize relevance first, then the requested sort
    query = query.orderBy(desc(querySelection.relevance), sortOrder === 'asc' ? asc(sortColumn as any) : desc(sortColumn as any));
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

