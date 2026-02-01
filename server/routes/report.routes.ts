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
    const { type, search, status, category, page, limit } = req.query;
    const userId = req.user!.id;
    
    // If it's a general search (type or search provided) or a specific filter
    // Admin/Moderator might see all, but for now we filter by user unless it's a "hub" view
    // The Hub (lost-found) usually passes type or search.
    
    const result = await storage.getReportsWithFilters({
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 50,
      type: type as string,
      search: search as string,
      status: status as string,
      category: category as string,
      userId: (type || search) ? undefined : userId // Only filter by user if not searching the hub
    });
    
    res.json(result.reports);
  } catch (error) {
    console.error("DEBUG: /api/reports error:", error);
    logger.error('Failed to fetch reports', { error: error });
    res.status(500).json({ message: "Failed to fetch reports", detail: (error as Error).message });
  }
});

router.post("/", async (req, res) => {
  try {
    const validatedData = insertReportSchema.parse({
      ...req.body,
      userId: req.user!.id
    });
    
    // Enforce image upload limits
    const { getUploadLimit } = await import("../config/payment.config");
    const limit = getUploadLimit(req.user);
    if (validatedData.imageUrls && validatedData.imageUrls.length > limit) {
      return res.status(400).json({ 
        message: `Image upload limit exceeded. Your current limit is ${limit} images.` 
      });
    }

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
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }
    const matches = await storage.findPotentialMatches(id);
    res.json(matches);
  } catch (error) {
    logger.error('Failed to fetch matched reports', { error: error });
    res.status(500).json({ message: "Failed to fetch matches" });
  }
});

export default router;

// Route to get a single report by ID
router.get("/:id", async (req, res) => {
  try {
    if (req.params.id === 'new') {
      return res.status(400).json({ message: "Invalid report ID: 'new' is a reserved keyword" });
    }
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
