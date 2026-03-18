import { Router } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { items, reports } from "@shared/schema";
import { and, eq, like, or, sql, desc } from "drizzle-orm";
import { createLogger } from "../utils/logger";

const logger = createLogger('SearchRoutes');
const router = Router();

router.get("/", async (req, res) => {
  try {
    const { q, status, category, location, dateFilter, startDate, endDate, type: typeFilter, sortBy } = req.query;
    const queryStr = (q as string || '').toLowerCase().trim();
    const keywords = queryStr.split(/\s+/).filter(k => k.length > 1);

    // Parse status and category filters (support multi-select)
    const statusFilters = status ? (status as string).split(',').filter(s => s) : [];
    const categoryFilters = category ? (category as string).split(',').filter(c => c) : [];

    let results: any[] = [];

    // Helper for date filter
    const getStartOfDay = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const getEndOfDay = (date: Date) => {
      const d = new Date(date);
      d.setHours(23, 59, 59, 999);
      return d;
    };

    const getDateRangeConditions = (column: any) => {
      const conditions = [];
      const now = new Date();

      if (startDate) {
        conditions.push(sql`${column} >= ${getStartOfDay(new Date(startDate as string))}`);
      }
      if (endDate) {
        conditions.push(sql`${column} <= ${getEndOfDay(new Date(endDate as string))}`);
      }

      if (dateFilter) {
        if (dateFilter === 'today') {
          conditions.push(sql`${column} >= ${getStartOfDay(now)}`);
        } else if (dateFilter === 'week') {
          conditions.push(sql`${column} >= ${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)}`);
        } else if (dateFilter === 'month') {
          conditions.push(sql`${column} >= ${new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)}`);
        } else if (dateFilter === 'year') {
          conditions.push(sql`${column} >= ${new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)}`);
        }
      }
      return conditions;
    };

    // Use typeFilter from search query

    // Only search Lost/Found reports (do not search registered items in global search)
    const shouldSearchReports = !typeFilter || typeFilter === 'all' || typeFilter === 'lost' || typeFilter === 'found';

    if (shouldSearchReports) {
      const reportConditions = [];

      // Only show fully paid items
      reportConditions.push(eq(reports.paymentStatus, 'successful'));

      if (typeFilter && typeFilter !== 'all') {
        reportConditions.push(eq(reports.type, typeFilter as string));
      }

      if (keywords.length > 0) {
        keywords.forEach(keyword => {
          const pattern = `%${keyword}%`;
          reportConditions.push(or(
            like(sql`lower(${reports.title})`, pattern),
            like(sql`lower(${reports.description})`, pattern),
            like(sql`lower(${reports.uniqueIdentifier})`, pattern),
            like(sql`lower(${reports.ocrText})`, pattern)
          ));
        });
      }

      if (categoryFilters.length > 0 && !categoryFilters.includes('any')) {
        const cats = categoryFilters.map(c => `'${c}'`).join(',');
        if (cats) {
          reportConditions.push(sql`${reports.category} IN (${sql.raw(cats)})`);
        }
      }

      if (statusFilters.length > 0) {
        const stats = statusFilters.map(s => `'${s}'`).join(',');
        if (stats) {
          reportConditions.push(sql`${reports.status} IN (${sql.raw(stats)})`);
        }
      } else {
        // Default to Open if no legacy status provided? No, search everything if filters are empty usually.
        // But usually we only want 'Open' reports for matching. For global search, maybe all?
        // Let's default to no filter (all statuses) unless specified.
      }

      if (location) {
        reportConditions.push(like(reports.location, `%${location as string}%`));
      }

      const dateConditions = getDateRangeConditions(reports.reportedAt);
      reportConditions.push(...dateConditions);
 
      const reportResults = await db.select().from(reports).where(reportConditions.length ? and(...reportConditions) : undefined);
 
      results.push(...reportResults.map(report => {
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

        const isExactMatch = report.uniqueIdentifier === queryStr && queryStr.length > 3;
        
        // Privacy logic: Discoverability in the public hub should be restrictive
        // Hide location and title unless it's a generic identification
        // Truncate description for general view
        const displayDescription = report.description && report.description.length > 120 
          ? report.description.substring(0, 120) + "..." 
          : report.description;

        return {
          id: report.id,
          title: isExactMatch ? report.title : `[Item in ${report.category}]`, 
          description: displayDescription,
          category: report.category,
          status: report.status,
          location: isExactMatch ? report.location : `[Region: ${report.location.split(',').pop()?.trim() || 'Central'}]`,
          date: report.reportedAt,
          imageUrls: report.imageUrls,
          type: report.type,
          isFeatured: report.isFeatured,
          isExactMatch,
          score: report.isFeatured ? score + 100 : score
        };
      }));
    }

    // Sort: Featured first, then by specified sorting method
    results.sort((a, b) => {
      // 1. Featured items always appear first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      
      // 2. Custom sorting logic
      if (sortBy === 'oldest') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'relevance' || (queryStr && !sortBy)) {
        return b.score - a.score;
      }
      // Default: newest
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    res.json(results);
  } catch (error) {
    logger.error('Search failed', { error });
    res.status(500).json({ message: "Search failed", detail: (error as Error).message });
  }
});

export default router;
