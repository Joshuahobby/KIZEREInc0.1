/**
 * Security middleware configuration
 * Centralizes security-related middleware for consistent application
 */
import crypto from 'crypto';
import helmet from 'helmet';
import xssClean from 'xss-clean';
import rateLimit from 'express-rate-limit';
import { Express, Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';
import hpp from 'hpp';
import cors from 'cors';
import { doubleCsrf } from "csrf-csrf";
import { createLogger } from '../utils/logger';
import { config, isProd } from '../config';

const logger = createLogger('SecurityMiddleware');

// CSRF Protection Configuration
const {
  generateCsrfToken,
  invalidCsrfTokenError,
  validateRequest,
  doubleCsrfProtection
} = doubleCsrf({
  getSecret: () => {
    if (!config.SESSION_SECRET && isProd) {
      logger.error('CRITICAL: SESSION_SECRET is missing in production! CSRF tokens will not persist across restarts.');
    }
    return config.SESSION_SECRET || (isProd ? crypto.randomBytes(32).toString('hex') : 'dev-csrf-secret-not-for-production-use!');
  },
  cookieName: "kizere.x-csrf-token",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getSessionIdentifier: (req: Request) => {
    // We intentionally ignore the session ID in the identifier to make CSRF tokens
    // more resilient to session rotation (e.g. after login), while still 
    // relying on the signed secret cookie for security.
    return 'constant';
  },
  getCsrfTokenFromRequest: (req: Request) => req.headers["x-csrf-token"] as string,
});

export { generateCsrfToken as generateToken, invalidCsrfTokenError, validateRequest, doubleCsrfProtection };

// Rate limiter configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 100, // Increased for dev/testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again later' },
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      headers: req.headers['user-agent']
    });
    res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil(15 * 60 / 60) // in minutes
    });
  }
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: process.env.NODE_ENV === 'production' ? 300 : 1000, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' }
});

// Stricter limiter for resource-intensive uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 uploads per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Upload limit exceeded, please try again later' }
});

// HTML sanitization for user-generated content
const allowedHtmlTags = {
  defaults: ['b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'p', 'br'],
  strict: [] // No tags allowed for highly sensitive fields
};

/**
 * Sanitize HTML content with configurable options
 * @param content Content to sanitize
 * @param mode Sanitization strictness level
 * @returns Sanitized content
 */
export function sanitizeContent(content: string, mode: 'strict' | 'default' = 'default'): string {
  if (!content) return content;

  return sanitizeHtml(content, {
    allowedTags: mode === 'strict' ? allowedHtmlTags.strict : allowedHtmlTags.defaults,
    allowedAttributes: mode === 'strict' ? {} : {
      'a': ['href', 'target', 'rel']
    },
    allowedSchemes: ['http', 'https', 'mailto']
  });
}

/**
 * Apply all security middleware to Express app
 * @param app Express application
 */
export function setupSecurityMiddleware(app: Express) {
  // CORS configuration
  const configuredOrigin = config.FRONTEND_URL || "http://localhost:5000";
  app.use(cors({
    origin: function (origin, callback) {
      // In development, allow all local origins
      const isDevelopment = process.env.NODE_ENV !== 'production';

      if (!origin || isDevelopment || origin === configuredOrigin || origin.endsWith('.vercel.app') || origin.endsWith('kizere.rw')) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked origin', {
          origin,
          configuredOrigin,
          isProd
        });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
  }));

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "blob:",
          "https://cdn.jsdelivr.net",
          "https://apis.google.com",
          "https://*.firebaseapp.com",
          "https://*.gstatic.com",
          "https://accounts.google.com",
          "https://replit.com",
          "https://*.replit.com",
          ...(process.env.NODE_ENV !== 'production' ? ["'unsafe-inline'", "'unsafe-eval'"] : [])
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Tailwind CSS / dynamic styles — CSS injection is not an XSS vector
          "https://fonts.googleapis.com",
          "https://*.firebaseapp.com",
          "https://accounts.google.com",
          "https://replit.com",
          "https://*.replit.com"
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://lh3.googleusercontent.com", "https://*.firebasestorage.googleapis.com", "https://*.firebaseapp.com", "https://accounts.google.com", "https://replit.com", "https://images.unsplash.com", "https://placehold.co", "https://*.tile.openstreetmap.org"],
        connectSrc: ["'self'",
          "blob:",
          "data:",
          "https://cdn.jsdelivr.net",
          "https://tessdata.projectnaptha.com",
          "https://res.cloudinary.com",
          "https://*.googleapis.com",
          "https://*.firebaseio.com",
          "https://*.firebaseapp.com",
          "wss://*.firebaseio.com",
          "https://accounts.google.com",
          "https://identitytoolkit.googleapis.com",
          "https://replit.com",
          "https://*.replit.com",
          "wss://*.replit.com",
          "https://apis.google.com",
          "https://lh3.googleusercontent.com",
          "https://placehold.co",
          "ws://localhost:5001",
          "wss://localhost:5001"
        ],
        frameSrc: ["'self'", "https://*.firebaseapp.com", "https://accounts.google.com", "https://replit.com", "https://*.replit.com"],
        workerSrc: ["'self'", "blob:", "https://cdn.jsdelivr.net"],
        formAction: ["'self'", "https://accounts.google.com"],
        childSrc: ["'self'", "blob:", "https://*.firebaseapp.com", "https://accounts.google.com", "https://replit.com"]
      }
    },
    // Disable HSTS in development
    hsts: isProd,
    // Allow Replit iframe embedding
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // Prevent XSS attacks
  app.use(xssClean());

  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  // CSRF Protection
  // 1. Endpoint to get the token
  app.get("/api/csrf-token", (req: Request, res: Response) => {
    // Ensure session is initialized to stay consistent with CSRF validation
    if (req.session) {
      // Add a property to ensure session is modified and thus saved
      (req.session as any).csrf_initialized = Date.now();

      req.session.save((err) => {
        if (err) {
          logger.error("CSRF: Failed to save session during token generation", { error: err.message });
          return res.status(500).json({ error: "Session save failed" });
        }

        const token = generateCsrfToken(req, res);
        logger.info("CSRF: Token generated successfully", {
          sessionId: req.session.id,
          path: req.path
        });
        res.json({ csrfToken: token });
      });
    } else {
      logger.error("CSRF: No session available in token endpoint");
      res.status(500).json({ error: "No session available" });
    }
  });

  // 2. Middleware to protect all other state-changing routes
  app.use((req, res, next) => {
    // Skip CSRF for specific routes if needed (e.g. webhooks, public endpoints)
    const ignoredPaths = [
      "/api/payments/webhook", 
      "/api/chat/webhook", 
      "/api/webhooks/resend", 
      "/api/auth/google", 
      "/api/recruitment",
      "/api/upload"
    ];
    if (ignoredPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method.toUpperCase())) {
      logger.info("CSRF: Validating request", {
        path: req.path,
        method: req.method,
        hasSession: !!req.session,
        sessionId: req.session?.id,
        hasToken: !!req.headers["x-csrf-token"],
        contentType: req.headers["content-type"]
      });
    }

    doubleCsrfProtection(req, res, (err) => {
      if (err && err.code === 'EBADCSRFTOKEN') {
        logger.error("CSRF: Validation failed", {
          path: req.path,
          sessionId: req.session?.id,
          tokenInHeader: !!req.headers["x-csrf-token"]
        });
      }
      next(err);
    });
  });

  // Apply rate limiting to authentication routes
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/google', authLimiter);

  // Apply general API rate limiting
  app.use('/api', apiLimiter);

  // Apply stricter limit to uploads
  app.use('/api/upload', uploadLimiter);

  // Custom middleware for input data sanitization
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      const sanitizedBody = deepSanitize(req.body);
      req.body = sanitizedBody;
    }
    next();
  });

  logger.info('Security middleware configured successfully');
}

/**
 * Validates if the request IP is from PawaPay's infrastructure
 */
export function validatePawaPayIP(req: Request, res: Response, next: NextFunction) {
  // Always allow for local development if MOCK_PAYMENTS is true
  if (config.MOCK_PAYMENTS || !isProd) {
    return next();
  }

  const clientIP = req.ip || req.socket.remoteAddress || '';

  // PawaPay Production IPs
  const productionIPs = [
    '52.19.141.144',
    '52.209.117.150',
    '52.209.155.158',
    '52.214.15.30',
    '52.51.109.213',
    '54.171.181.162',
    '54.217.152.181'
  ];

  // PawaPay Sandbox IPs
  const sandboxIPs = [
    '44.201.127.186',
    '52.202.164.21',
    '54.161.80.252'
  ];

  const allowedIPs = [...productionIPs, ...sandboxIPs];

  if (allowedIPs.includes(clientIP)) {
    return next();
  }

  logger.warn('PawaPay Webhook: Restricted IP attempt', { ip: clientIP });
  res.status(403).json({ error: 'Forbidden: IP not in whitelist' });
}

/**
 * Deep sanitize an object's string properties
 * @param obj Object to sanitize
 * @returns Sanitized object
 */
function deepSanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item));
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize string values
    if (typeof value === 'string') {
      const sensitiveFields = ['password', 'token', 'secret', 'key'];
      const strictFields = ['title', 'name'];

      // Don't sanitize sensitive fields
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        result[key] = value;
      }
      // Use strict sanitization for certain fields
      else if (strictFields.some(field => key.toLowerCase().includes(field))) {
        result[key] = sanitizeContent(value, 'strict');
      }
      // Default sanitization for other fields
      else {
        result[key] = sanitizeContent(value);
      }
    }
    // Recursively sanitize nested objects
    else if (value && typeof value === 'object') {
      result[key] = deepSanitize(value);
    }
    // Keep non-string values as-is
    else {
      result[key] = value;
    }
  }

  return result;
}

export { authLimiter, apiLimiter, uploadLimiter };