/**
 * Security middleware configuration
 * Centralizes security-related middleware for consistent application
 */
import helmet from 'helmet';
import xssClean from 'xss-clean';
import rateLimit from 'express-rate-limit';
import { Express, Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';
import { createLogger } from '../utils/logger';

const logger = createLogger('SecurityMiddleware');

// Rate limiter configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per window
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
  max: 100, // Max 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' }
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
  // Apply Helmet to secure HTTP headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://lh3.googleusercontent.com", "https://*.firebasestorage.googleapis.com"],
        connectSrc: ["'self'", 
          "https://*.googleapis.com", 
          "https://*.firebaseio.com",
          "https://*.firebaseapp.com",
          "wss://*.firebaseio.com"
        ]
      }
    },
    // Disable HSTS in development
    hsts: process.env.NODE_ENV === 'production'
  }));
  
  // Prevent XSS attacks
  app.use(xssClean());
  
  // Apply rate limiting to authentication routes
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/google', authLimiter);
  
  // Apply general API rate limiting
  app.use('/api', apiLimiter);
  
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

export { authLimiter, apiLimiter };