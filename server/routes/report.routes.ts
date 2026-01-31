import { Router } from "express";
import { storage } from "../storage";
import { insertReportSchema } from "@shared/schema";
import { z } from "zod";
import { createLogger } from "../utils/logger";
import { ReportMatchingService } from "../services/report-matching.service";
import { sendReportConfirmationEmail } from "../services/email.service";

const logger = createLogger('ReportRoutes');
const router = Router();

// Reports API
router.get("/", async (req, res) => {
  try {
    const { type, search, status } = req.query;
    
    // If type or search is provided, it's likely a hub search
    if (type || search) {
      const result = await storage.getReportsWithFilters({
        page: 1,
        limit: 50,
        type: type as string,
        search: search as string,
        status: status as string || 'Open'
      });
      return res.json(result.reports);
    }

    // Default to user's reports
    const userId = req.user!.id;
    const reports = await storage.getUserReports(userId);
    res.json(reports);
  } catch (error) {
    logger.error('Failed to fetch reports', { error: error });
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
    
    // Send confirmation email
    const user = await storage.getUser(validatedData.userId);
    if (user?.email && newReport.receiptNumber) {
      sendReportConfirmationEmail(
        user.email,
        user.fullName || user.username,
        newReport.type as 'lost' | 'found',
        newReport.title,
        newReport.receiptNumber
      ).catch(err => logger.error('Failed to send report confirmation email', { error: err }));
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

// Route to get a single report by ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }
    
    const report = await storage.getReport(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    
    res.json(report);
  } catch (error) {
    logger.error('Failed to fetch report', { error: error });
    res.status(500).json({ message: "Failed to fetch report" });
  }
});
