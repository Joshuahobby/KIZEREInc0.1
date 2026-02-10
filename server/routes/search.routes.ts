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
    const { q, status, category, location, dateFilter } = req.query;
    const queryStr = (q as string || '').toLowerCase().trim();
    const keywords = queryStr.split(/\s+/).filter(k => k.length > 1);

    let results: any[] = [];

    // Helper for date filter
    const getDateThreshold = (filter: string) => {
      const now = new Date();
      if (filter === '24h') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      if (filter === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (filter === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return null;
    };

    const dateThreshold = dateFilter ? getDateThreshold(dateFilter as string) : null;

    // 1. Search Registered items
    if (!status || status === 'all' || status === 'Registered') {
      const itemConditions = [];
      if (keywords.length > 0) {
        keywords.forEach(keyword => {
          const pattern = `%${keyword}%`;
          itemConditions.push(or(
            like(sql`lower(${items.name})`, pattern),
            like(sql`lower(${items.description})`, pattern),
            like(sql`lower(${items.uniqueIdentifier})`, pattern)
          ));
        });
      }
      if (category && category !== 'any' && category !== 'All Categories') {
        itemConditions.push(eq(items.category, category as string));
      }
      if (location && location !== 'All Locations') {
        itemConditions.push(like(items.location, `%${location as string}%`));
      }

      const registeredItems = await db.select().from(items).where(itemConditions.length ? and(...itemConditions) : undefined);
      results.push(...registeredItems.map(item => {
        let score = 0;
        if (queryStr) {
          if (item.name.toLowerCase().includes(queryStr)) score += 10;
          if (item.uniqueIdentifier?.toLowerCase().includes(queryStr)) score += 15;
          keywords.forEach(k => {
            if (item.name.toLowerCase().includes(k)) score += 2;
            if (item.description?.toLowerCase().includes(k)) score += 1;
          });
        }
        return { ...item, type: 'registered', score };
      }));
    }

    // 2. Search Lost/Found reports
    if (!status || status === 'all' || status === 'Lost' || status === 'Found') {
      const reportConditions = [];
      if (status && status !== 'all' && status !== 'Registered') {
        reportConditions.push(eq(reports.type, (status as string).toLowerCase()));
      }
      if (keywords.length > 0) {
        keywords.forEach(keyword => {
          const pattern = `%${keyword}%`;
          reportConditions.push(or(
            like(sql`lower(${reports.title})`, pattern),
            like(sql`lower(${reports.description})`, pattern),
            like(sql`lower(${reports.uniqueIdentifier})`, pattern)
          ));
        });
      }
      if (category && category !== 'any' && category !== 'All Categories') {
        reportConditions.push(eq(reports.category, category as string));
      }
      if (location && location !== 'All Locations') {
        reportConditions.push(like(reports.location, `%${location as string}%`));
      }
      if (dateThreshold) {
        reportConditions.push(sql`${reports.reportedAt} >= ${dateThreshold}`);
      }

      const reportResults = await db.select().from(reports).where(reportConditions.length ? and(...reportConditions) : undefined);
      results.push(...reportResults.map(report => {
        let score = 0;
        if (queryStr) {
          if (report.title.toLowerCase().includes(queryStr)) score += 10;
          if (report.uniqueIdentifier?.toLowerCase().includes(queryStr)) score += 15;
          keywords.forEach(k => {
            if (report.title.toLowerCase().includes(k)) score += 2;
            if (report.description?.toLowerCase().includes(k)) score += 1;
          });
        }
        return {
          id: report.id,
          name: report.title,
          description: report.description,
          category: report.category,
          status: report.type === 'lost' ? 'Lost' : 'Found',
          location: report.location,
          registeredAt: report.reportedAt,
          imageUrls: report.imageUrls,
          type: report.type,
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
