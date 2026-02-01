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
    
    // Unified search logic
    // We'll search items and/or reports based on status
    
    const results: any[] = [];
    
    // 1. Search Registered items (if status is 'Registered' or 'all')
    if (!status || status === 'all' || status === 'Registered') {
      const itemConditions = [];
      if (q) {
        const searchLower = `%${(q as string).toLowerCase()}%`;
        itemConditions.push(or(
          like(sql`lower(${items.name})`, searchLower),
          like(sql`lower(${items.description})`, searchLower),
          like(sql`lower(${items.uniqueIdentifier})`, searchLower)
        ));
      }
      if (category && category !== 'any') {
        itemConditions.push(eq(items.category, category as string));
      }
      if (location) {
        itemConditions.push(like(items.location, `%${location as string}%`));
      }
      
      const registeredItems = await db.select().from(items).where(itemConditions.length ? and(...itemConditions) : undefined);
      results.push(...registeredItems.map(item => ({
        ...item,
        type: 'registered'
      })));
    }
    
    // 2. Search Lost/Found reports (if status is 'Lost', 'Found', or 'all')
    if (!status || status === 'all' || status === 'Lost' || status === 'Found') {
      const reportConditions = [];
      if (status && status !== 'all' && status !== 'Registered') {
        reportConditions.push(eq(reports.type, (status as string).toLowerCase()));
      }
      if (q) {
        const searchLower = `%${(q as string).toLowerCase()}%`;
        reportConditions.push(or(
          like(sql`lower(${reports.title})`, searchLower),
          like(sql`lower(${reports.description})`, searchLower),
          like(sql`lower(${reports.uniqueIdentifier})`, searchLower)
        ));
      }
      if (category && category !== 'any') {
        reportConditions.push(eq(reports.category, category as string));
      }
      if (location) {
        reportConditions.push(like(reports.location, `%${location as string}%`));
      }
      
      const reportResults = await db.select().from(reports).where(reportConditions.length ? and(...reportConditions) : undefined);
      results.push(...reportResults.map(report => ({
        id: report.id,
        name: report.title,
        description: report.description,
        category: report.category,
        status: report.type === 'lost' ? 'Lost' : 'Found',
        location: report.location,
        registeredAt: report.reportedAt, // Mapping reportedAt to registeredAt for unified display
        imageUrls: report.imageUrls,
        type: report.type
      })));
    }
    
    res.json(results);
  } catch (error) {
    logger.error('Search failed', { error });
    res.status(500).json({ message: "Search failed", detail: (error as Error).message });
  }
});

export default router;
