import { Router, Request, Response } from 'express';
import { db } from '../db';
import { moderationReports, insertModerationReportSchema } from '@shared/schema';
import { createLogger } from '../utils/logger';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();
const logger = createLogger('ModerationRoutes');

// POST /api/moderation/reports - Submit a new moderation report
router.post('/reports', async (req: Request, res: Response) => {
  try {
    const reportData = insertModerationReportSchema.parse(req.body);
    
    const [report] = await db.insert(moderationReports)
      .values({
        ...reportData,
        status: 'pending'
      })
      .returning();

    logger.info('New moderation report created', { reportId: report.id, reason: report.reason });
    
    res.status(201).json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    logger.error('Failed to create moderation report', { error });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/moderation/reports - Get all reports (Admin only)
// Note: Auth middleware should be applied in main routes registration
router.get('/reports', async (req: Request, res: Response) => {
  try {
    // Basic admin check (if not checked by middleware)
    if (req.user?.role !== 'Admin') {
       return res.status(403).json({ message: 'Forbidden' });
    }

    const allReports = await db.select()
      .from(moderationReports)
      .orderBy(desc(moderationReports.createdAt));

    res.json(allReports);
  } catch (error) {
    logger.error('Failed to fetch moderation reports', { error });
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
