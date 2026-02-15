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
    const { q, status, category, location, dateFilter, startDate, endDate } = req.query;
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


    // 1. Search Registered items
    // If status filter contains 'Registered' or no status filter is provided or 'all' is provided
    if (statusFilters.length === 0 || statusFilters.includes('all') || statusFilters.some(s => ['Registered'].includes(s))) {
      const itemConditions = [];

      if (keywords.length > 0) {
        keywords.forEach(keyword => {
          const pattern = `%${keyword}%`;
          itemConditions.push(or(
            like(sql`lower(${items.name})`, pattern),
            like(sql`lower(${items.description})`, pattern),
            like(sql`lower(${items.uniqueIdentifier})`, pattern),
            like(sql`lower(${items.ocrText})`, pattern)
          ));
        });
      }

      if (categoryFilters.length > 0 && !categoryFilters.includes('any')) {
        // Use manual OR logic for multiple categories if inArray implies strict single column check against list (works fine usually)
        // But for clarity let's just use sql in
        const cats = categoryFilters.map(c => `'${c}'`).join(',');
        if (cats) {
          itemConditions.push(sql`${items.category} IN (${sql.raw(cats)})`);
        }
      }

      if (location) {
        itemConditions.push(like(items.location, `%${location as string}%`));
      }

      const dateConditions = getDateRangeConditions(items.registeredAt);
      itemConditions.push(...dateConditions);

      const registeredItems = await db.select().from(items).where(itemConditions.length ? and(...itemConditions) : undefined);

      results.push(...registeredItems.map(item => {
        let score = 0;
        if (queryStr) {
          if (item.name.toLowerCase().includes(queryStr)) score += 10;
          if (item.uniqueIdentifier?.toLowerCase().includes(queryStr)) score += 15;
          keywords.forEach(k => {
            if (item.name.toLowerCase().includes(k)) score += 2;
            if (item.description?.toLowerCase().includes(k)) score += 1;
            if (item.ocrText?.toLowerCase().includes(k)) score += 3;
          });
        }
        return {
          id: item.id,
          title: item.name, // Unify title
          description: item.description,
          category: item.category,
          status: 'Registered',
          location: item.location,
          date: item.registeredAt, // Unify date
          imageUrls: item.imageUrls,
          type: 'registered',
          score
        };
      }));
    }

    // 2. Search Lost/Found reports
    // If status filter contains 'Lost', 'Found', 'Open', 'Resolved' etc, or no status filter
    const reportStatusFilters = statusFilters.filter(s => !['Registered', 'all'].includes(s));

    // Logic: 
    // If status includes 'lost' -> search reports with type='lost'
    // If status includes 'found' -> search reports with type='found'
    // If status includes 'Open', 'Resolved' -> filtering by report status
    // If NO status filter -> search all reports

    const searchLost = statusFilters.length === 0 || statusFilters.includes('all') || statusFilters.includes('lost');
    const searchFound = statusFilters.length === 0 || statusFilters.includes('all') || statusFilters.includes('found');


    if (searchLost || searchFound) {
      const reportConditions = [];

      // Filter by Type (lost vs found)
      const types = [];
      if (searchLost) types.push('lost');
      if (searchFound) types.push('found');

      if (types.length > 0) {
        reportConditions.push(sql`${reports.type} IN (${sql.raw(types.map(t => `'${t}'`).join(','))})`);
      }

      // Filter by Status (Open, Resolved, etc) IF specifically requested
      // For now, let's assume if they search "Lost", they mean type=lost. 
      // If they search "Open", they mean status=Open.
      // The UI sends "lost", "found", "registered" as "searchType" which maps to our `status` param here.
      // However, the `SearchFilters` component sends ACTUAL statuses like "Open", "Resolved" too?
      // Let's check `SearchFilters.tsx`.
      // It has `statuses = ["Open", "In_Progress", "Resolved", "Closed"]`
      // And it sends `status: status.join(',')`
      // AND it sends `type: type`.
      // Wait, `SearchFilters` sends `type` separate from `status`.
      // My previous analysis of `search.tsx` was based on the OLD simple filter. The NEW `SearchFilters` sends `type` AND `status`.
      // `server/routes/search.routes.ts` receives `q, status, category, location, dateFilter`... AND `type`?
      // Let's ensure we read `type` from query. `req.query` has `type`.

      // RE-READ: `req.query` in line 13 destructures: `q, status, category, location, dateFilter`. It MISSES `type`.
      // I should add `type` to destructuring.
    }

    // Let's restart the logic block to correctly use `type` AND `status` inputs.
    // The `SearchFilters` sends: `q`, `type` (all, lost, found), `status` (Open, Closed...), `category`, `location`, `startDate`, `endDate`.

    const { type: typeFilter } = req.query; // Capture type from query

    // 2. Search Lost/Found reports
    // Conditions:
    // - If typeFilter is 'all', 'lost', or 'found' -> relevant reports.
    // - If typeFilter is 'registered' -> checked above (but we need to ensure we don't duplicate logic).

    const shouldSearchReports = !typeFilter || typeFilter === 'all' || typeFilter === 'lost' || typeFilter === 'found';

    if (shouldSearchReports) {
      const reportConditions = [];

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
        return {
          id: report.id,
          title: report.title,
          description: report.description,
          category: report.category,
          status: report.status, // Return actual status (Open, Resolved)
          location: report.location,
          date: report.reportedAt,
          imageUrls: report.imageUrls,
          type: report.type, // 'lost' or 'found'
          score
        };
      }));
    }

    // Sort by score if query exists, otherwise by date
    if (queryStr) {
      results.sort((a, b) => b.score - a.score);
    } else {
      results.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
    }

    res.json(results);
  } catch (error) {
    logger.error('Search failed', { error });
    res.status(500).json({ message: "Search failed", detail: (error as Error).message });
  }
});

export default router;
