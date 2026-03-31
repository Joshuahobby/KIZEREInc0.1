import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { retailers } from "@shared/schema";
import { eq } from "drizzle-orm";
import { createLogger } from "../utils/logger";

const logger = createLogger("RetailerAuth");

/**
 * Middleware to authenticate retailer API requests via X-API-Key header.
 * Attaches the retailer record to `req.retailer` for downstream handlers.
 */
export async function requireRetailerApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers["x-api-key"] as string | undefined;

  if (!apiKey) {
    logger.warn("Missing X-API-Key header", { path: req.path, ip: req.ip });
    return res.status(401).json({ message: "API key is required" });
  }

  try {
    const [retailer] = await db
      .select()
      .from(retailers)
      .where(eq(retailers.apiKey, apiKey))
      .limit(1);

    if (!retailer) {
      logger.warn("Invalid API key attempted", { path: req.path, ip: req.ip });
      return res.status(401).json({ message: "Invalid API key" });
    }

    if (retailer.status !== "active") {
      logger.warn("Suspended retailer attempted access", {
        retailerId: retailer.id,
        status: retailer.status,
      });
      return res.status(403).json({
        message: "Retailer account is not active",
        status: retailer.status,
      });
    }

    // Attach retailer to request for downstream usage
    (req as any).retailer = retailer;
    next();
  } catch (error: any) {
    logger.error("Retailer auth middleware error", { error: error.message });
    return res.status(500).json({ message: "Internal server error" });
  }
}
