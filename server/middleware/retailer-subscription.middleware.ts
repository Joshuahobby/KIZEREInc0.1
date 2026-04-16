import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { createLogger } from "../utils/logger";
import { SUBSCRIPTION_LIMITS, RetailerSubscriptionPlan } from "@shared/schema";
import { RetailerSubscriptionService } from "../services/retailer-subscription.service";

const logger = createLogger("RetailerSubscription");

/**
 * Dynamic rate limiter based on the retailer's subscription plan.
 * Must be placed after posAuthMiddleware which sets req.retailer.
 */
export const posRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  standardHeaders: true,
  legacyHeaders: false,
  limit: async (req: Request) => {
    const retailer = (req as any).retailer;
    if (!retailer) {
      // If no retailer is found (e.g., error in auth), apply a strict default limit
      return 10;
    }
    const plan = (retailer.subscriptionPlan || "basic") as RetailerSubscriptionPlan;
    return SUBSCRIPTION_LIMITS[plan].apiRequestsPerHour;
  },
  keyGenerator: (req: Request) => {
    const retailer = (req as any).retailer;
    return retailer ? `retailer_${retailer.id}` : req.ip || "unknown";
  },
  handler: (req: Request, res: Response) => {
    const retailer = (req as any).retailer;
    logger.warn("POS rate limit exceeded", {
      retailerId: retailer?.id,
      plan: retailer?.subscriptionPlan,
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      success: false,
      message: "API rate limit exceeded for your subscription plan. Please upgrade for higher limits.",
    });
  },
});

/**
 * Middleware factory to check if the retailer's subscription includes a specific feature.
 * Must be placed after posAuthMiddleware.
 */
export function requireFeature(featureName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const retailer = (req as any).retailer;
    if (!retailer) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const plan = (retailer.subscriptionPlan || "basic") as RetailerSubscriptionPlan;
    const allowedFeatures = SUBSCRIPTION_LIMITS[plan].features;

    if (!allowedFeatures.includes(featureName)) {
      logger.warn("Feature access denied due to subscription limits", {
        retailerId: retailer.id,
        plan,
        feature: featureName,
        path: req.path,
      });
      return res.status(403).json({
        success: false,
        message: `Your current subscription plan (${plan}) does not include access to the '${featureName}' feature. Please upgrade your plan.`,
      });
    }

    next();
  };
}

/**
 * Middleware that blocks non-basic retailers whose subscription has expired.
 * basic plan: always passes (no subscription billing required).
 * standard/premium/enterprise: requires subscriptionExpiresAt > now.
 * Must be placed after posAuthMiddleware which sets req.retailer.
 */
export function requireActiveSubscription(req: Request, res: Response, next: NextFunction) {
  const retailer = (req as any).retailer;
  if (!retailer) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!RetailerSubscriptionService.isSubscriptionActive(retailer)) {
    logger.warn("Subscription expired — access denied", {
      retailerId: retailer.id,
      plan: retailer.subscriptionPlan,
      subscriptionExpiresAt: retailer.subscriptionExpiresAt,
    });
    return res.status(402).json({
      success: false,
      message: `Your ${retailer.subscriptionPlan} subscription has expired. Please renew to continue using KIZERE POS.`,
      code: "SUBSCRIPTION_EXPIRED",
    });
  }

  next();
}
