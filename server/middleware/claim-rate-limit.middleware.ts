/**
 * Claim-specific rate limiting middleware
 * Phase 1.4: Prevent claim spam and abuse
 */

import rateLimit from 'express-rate-limit';
import { createLogger } from '../utils/logger';
import { Request, Response } from 'express';

const logger = createLogger('ClaimRateLimit');

/**
 * Rate limiter for claim submissions
 * Limits users to 5 claims per hour
 */
export const claimSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // Max 5 claims per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id?.toString() || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Claim rate limit exceeded', {
      userId: req.user?.id,
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      status: 'error',
      message: 'You have submitted too many claims. Please wait before submitting another.',
      retryAfter: 60 // minutes
    });
  }
});

/**
 * Rate limiter for claim verification actions
 * Prevents brute-force verification attempts
 */
export const claimVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 verification actions per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.user?.id?.toString() || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Claim verification rate limit exceeded', {
      userId: req.user?.id,
      ip: req.ip
    });
    res.status(429).json({
      status: 'error',
      message: 'Too many verification attempts. Please wait before trying again.',
      retryAfter: 15
    });
  }
});

/**
 * Rate limiter for report creation
 * Prevents spam report submissions
 */
export const reportSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // Max 10 reports per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.user?.id?.toString() || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Report submission rate limit exceeded', {
      userId: req.user?.id,
      ip: req.ip
    });
    res.status(429).json({
      status: 'error',
      message: 'You have submitted too many reports. Please wait before submitting another.',
      retryAfter: 60
    });
  }
});

export default {
  claimSubmissionLimiter,
  claimVerificationLimiter,
  reportSubmissionLimiter
};
