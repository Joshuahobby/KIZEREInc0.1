import { Router } from "express";
import { storage } from "../storage";
import { insertReportSchema } from "@shared/schema";
import { z } from "zod";
import { createLogger } from "../utils/logger";
import { ReportMatchingService } from "../services/report-matching.service";

const logger = createLogger('ReportRoutes');
const router = Router();

// Reports API
router.get("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const reports = await storage.getUserReports(userId);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reports" });
  }
});

router.post("/", async (req, res) => {
  try {
    const validatedData = insertReportSchema.parse({
      ...req.body,
      userId: req.user!.id
    });
    
    const newReport = await storage.createReport(validatedData);
    

    // Explicitly run matching in the background
    try {
      ReportMatchingService.findMatches(newReport).catch(err => {
        logger.error('Background matching failed for report', { reportId: newReport.id, error: err.message });
      });
    } catch (matchError) {
      logger.error('Failed to initiate matching', { error: matchError });
    }
    
    res.status(201).json(newReport);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Failed to create report" });
  }
});


router.get("/matches/:id", async (req, res) => {
  res.status(501).json({ message: "Matches retrieval not yet implemented in modular routes" });
});

export default router;
