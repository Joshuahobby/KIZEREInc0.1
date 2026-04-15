import { Router } from "express";
import { db } from "../db";
import { reports } from "@shared/schema";
import { and, eq, like, or, sql, inArray, notInArray } from "drizzle-orm";
import { createLogger } from "../utils/logger";

const logger = createLogger('SearchRoutes');
const router = Router();

/** Escape LIKE special chars so user input is treated as a literal substring. */
function escapeLike(str: string): string {
  return str.replace(/[\\%_]/g, c => `\\${c}`);
}

router.get("/", async (req, res) => {
  try {
    const {
      q, status, category, location, dateFilter,
      startDate, endDate, type: typeFilter, sortBy,
      page: pageParam, limit: limitParam
    } = req.query;

    const queryStr = (q as string || '').toLowerCase().trim();
    const keywords = queryStr.split(/\s+/).filter(k => k.length > 1);

    // Pagination
    const page = Math.max(1, parseInt(pageParam as string || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(limitParam as string || '20', 10)));
    const offset = (page - 1) * limit;

    // Parse multi-select filters
    const statusFilters = status ? (status as string).split(',').filter(s => s) : [];
    const categoryFilters = category ? (category as string).split(',').filter(c => c) : [];

    const getStartOfDay = (date: Date) => {
      const d = new Date(date); d.setHours(0, 0, 0, 0); return d;
    };
    const getEndOfDay = (date: Date) => {
      const d = new Date(date); d.setHours(23, 59, 59, 999); return d;
    };

    const getDateRangeConditions = (column: any) => {
      const conditions: any[] = [];
      const now = new Date();
      if (startDate) conditions.push(sql`${column} >= ${getStartOfDay(new Date(startDate as string))}`);
      if (endDate) conditions.push(sql`${column} <= ${getEndOfDay(new Date(endDate as string))}`);
      if (dateFilter === 'today') conditions.push(sql`${column} >= ${getStartOfDay(now)}`);
      else if (dateFilter === 'week') conditions.push(sql`${column} >= ${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)}`);
      else if (dateFilter === 'month') conditions.push(sql`${column} >= ${new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)}`);
      else if (dateFilter === 'year') conditions.push(sql`${column} >= ${new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)}`);
      return conditions;
    };

    const shouldSearchReports = !typeFilter || typeFilter === 'all' || typeFilter === 'lost' || typeFilter === 'found';

    if (!shouldSearchReports) {
      return res.json({ results: [], total: 0, page, totalPages: 0 });
    }

    const reportConditions: any[] = [];

    // Only show fully paid reports
    reportConditions.push(eq(reports.paymentStatus, 'successful'));

    if (typeFilter && typeFilter !== 'all') {
      reportConditions.push(eq(reports.type, typeFilter as string));
    }

    if (keywords.length > 0) {
      keywords.forEach(keyword => {
        const pattern = `%${escapeLike(keyword)}%`;
        reportConditions.push(or(
          like(sql`lower(${reports.title})`, pattern),
          like(sql`lower(${reports.description})`, pattern),
          like(sql`lower(${reports.uniqueIdentifier})`, pattern),
          like(sql`lower(${reports.ocrText})`, pattern)
        ));
      });
    }

    if (categoryFilters.length > 0 && !categoryFilters.includes('any')) {
      reportConditions.push(inArray(reports.category, categoryFilters));
    }

    if (statusFilters.length > 0) {
      reportConditions.push(inArray(reports.status, statusFilters));
    } else {
      // Exclude terminal statuses by default so stale reports don't pollute results
      reportConditions.push(notInArray(reports.status, ['Expired', 'Closed']));
    }

    if (location) {
      reportConditions.push(like(reports.location, `%${escapeLike(location as string)}%`));
    }

    reportConditions.push(...getDateRangeConditions(reports.reportedAt));

    const whereClause = and(...reportConditions);

    // Count total matching rows for pagination metadata
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)`.mapWith(Number) })
      .from(reports)
      .where(whereClause);

    const totalPages = Math.ceil(total / limit);

    const rawReports = await db
      .select()
      .from(reports)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    const results = rawReports.map(report => {
      let score = 0;
      if (queryStr) {
        if (report.title.toLowerCase().includes(queryStr)) score += 10;
        if (report.uniqueIdentifier?.toLowerCase().includes(queryStr)) score += 15;
        keywords.forEach(k => {
          if (report.title.toLowerCase().includes(k)) score += 2;
          if (report.description?.toLowerCase().includes(k)) score += 1;
          if (report.ocrText?.toLowerCase().includes(k)) score += 3;
        });
      }

      // Both sides lowercased so "IMEI123" == "imei123" resolves correctly
      const isExactMatch = !!report.uniqueIdentifier &&
        report.uniqueIdentifier.toLowerCase() === queryStr &&
        queryStr.length > 3;

      const displayDescription = report.description && report.description.length > 120
        ? report.description.substring(0, 120) + "..."
        : report.description;

      // Safe null guard: report.location is NOT NULL in schema but guard defensively
      const regionLabel = report.location
        ? (report.location.split(',').pop()?.trim() || 'Central')
        : 'Central';

      return {
        id: report.id,
        title: isExactMatch ? report.title : `[Item in ${report.category}]`,
        description: displayDescription,
        category: report.category,
        status: report.status,
        location: isExactMatch ? report.location : `[Region: ${regionLabel}]`,
        date: report.reportedAt,
        imageUrls: report.imageUrls,
        type: report.type,
        isFeatured: report.isFeatured,
        isExactMatch,
        score: report.isFeatured ? score + 100 : score
      };
    });

    // Sort: featured first, then by the requested method
    results.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'relevance' || (queryStr && !sortBy)) return b.score - a.score;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    res.json({ results, total, page, totalPages });
  } catch (error) {
    logger.error('Search failed', { error });
    res.status(500).json({ message: "Search failed", detail: (error as Error).message });
  }
});

export default router;
