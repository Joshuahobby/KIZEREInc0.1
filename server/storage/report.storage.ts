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

export async function findPotentialMatches(reportId: number): Promise<any[]> {
  const sourceReport = await getReport(reportId);
  if (!sourceReport) return [];

  const oppositeType = sourceReport.type === 'lost' ? 'found' : 'lost';
  const category = sourceReport.category;

  // Get reports of opposite type in the same category
  const candidates = await db.select()
    .from(reports)
    .where(and(
      eq(reports.type, oppositeType),
      eq(reports.category, category),
      eq(reports.status, 'Open')
    ));

  // Simple keyword matching for relevance
  const keywords = sourceReport.title.toLowerCase().split(/\s+/).filter(k => k.length > 3);

  const matches = candidates.map(c => {
    let score = 0;

    // Exact Unique Identifier match
    if (sourceReport.uniqueIdentifier && c.uniqueIdentifier &&
      sourceReport.uniqueIdentifier.trim().toLowerCase() === c.uniqueIdentifier.trim().toLowerCase()) {
      score += 95;
    }

    // Exact Item ID match
    if (sourceReport.itemId && c.itemId && sourceReport.itemId === c.itemId) {
      score += 90;
    }

    const cTitle = c.title.toLowerCase();
    const cDesc = (c.description || "").toLowerCase();

    keywords.forEach(kw => {
      if (cTitle.includes(kw)) score += 5;
      if (cDesc.includes(kw)) score += 2;
    });

    return { ...c, matchScore: Math.min(100, score) };
  });

  return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
}
