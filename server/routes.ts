import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { db } from "./db";
import { and, eq, like, or, sql, desc } from "drizzle-orm";
import {
  insertItemSchema,
  insertReportSchema,
  insertNotificationSchema,
  insertPaymentPackageSchema,
  userRoles,
  initiatePaymentSchema,
  items,
  blogPosts,
  reports,
  PaymentType,
  PaymentStatus,
  PaymentPackage,
  DEFAULT_USER_PREFERENCES
} from "@shared/schema";
import { getPaymentDescription } from "./config/payment.config";
import { createLogger } from "./utils/logger";
import { DEFAULT_CURRENCY } from "./config/payment.config";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear
} from "date-fns";
// Import service layer
import { UserService } from "./services/user.service";
import { PaymentService } from "./services/payment.service";
import { dashboardService, DashboardService } from "./services/dashboard.service";
import { hashPassword, comparePasswords } from "./utils/auth-crypto";
import { ReportMatchingService } from "./services/report-matching.service";
import { sendApplicationEmail } from "./services/email.service";
import {
  requireAuth,
  requireAdmin,
  requireAdminOrAgent
} from "./middleware/auth.middleware";



// Create logger for routes
const logger = createLogger('Routes');

// Authentication middleware is imported from centralized auth.middleware.ts


// Import domain routes
import adminRoutes from './routes/admin.routes';
import itemRoutes from './routes/item.routes';
import reportRoutes from './routes/report.routes';
import notificationRoutes from './routes/notification.routes';
import paymentRoutes from './routes/payment.routes';
import profileRoutes from './routes/profile.routes';
import claimRoutes from './routes/claim.routes';
import verificationRoutes from "./routes/verification.routes";
import uploadRoutes from './routes/upload.routes';
import moderationRoutes from './routes/moderation.routes';
import searchRoutes from './routes/search.routes';
import dashboardRoutes from './routes/dashboard.routes';
import adminJobsRoutes from './routes/admin-jobs.routes';
import chatRoutes from './routes/chat.routes';
import rolesRoutes from './routes/roles';
import auditRoutes from './routes/audit.routes';
import resendWebhookRoutes from './routes/resend.routes';
import couponRoutes from './routes/coupon.routes';
import consentRoutes from './routes/consent.routes';
import dataRightsRoutes from './routes/data-rights.routes';
import agentRoutes from './routes/agent.routes';
import posRoutes from './routes/pos.routes';
import consumerRoutes from './routes/consumer.routes';

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Register domain routes
  app.use('/api/agent', agentRoutes);
  app.use('/api/admin', requireAdminOrAgent, adminRoutes);
  app.use('/api/admin/jobs', requireAdmin, adminJobsRoutes);
  app.use('/api/admin/roles', requireAdmin, rolesRoutes);
  app.use('/api/admin/audit-logs', requireAdmin, auditRoutes);

  // POS routes (handles its own auth: API key for POS, session for admin)
  app.use('/api/pos', posRoutes);

  // Consumer routes (verify: public + auth; subscription: auth)
  app.use('/api/consumer', consumerRoutes);

  // Public/Semi-public routes
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /$
Allow: /about$
Allow: /contact$
Allow: /faq$
Allow: /how-it-works$
Allow: /privacy$
Allow: /terms$
Allow: /blog$

# Disallow all dynamic, items, and search paths to protect user data
Disallow: /search
Disallow: /items/
Disallow: /reports/
Disallow: /dashboard
Disallow: /admin
Disallow: /my-items
Disallow: /my-claims
Disallow: /profile
Disallow: /settings
Disallow: /api/

Sitemap: https://kizere.rw/sitemap.xml`);
  });

  app.get('/sitemap.xml', async (req, res) => {
    const baseUrl = 'https://kizere.rw';
    
    // Static public pages
    const staticPages = [
      '',
      '/about',
      '/contact',
      '/faq',
      '/how-it-works',
      '/how-to-use',
      '/privacy',
      '/terms',
      '/blog',
      '/use-cases',
      '/features'
    ];

    // Fetch blog posts for dynamic sitemap inclusion
    let dynamicPages: string[] = [];
    try {
      const blogs = await db.select({ slug: blogPosts.slug }).from(blogPosts).where(eq(blogPosts.status, 'published'));
      dynamicPages = blogs.map(b => `/blog/${b.slug}`);
    } catch (error) {
      console.error("Error fetching blogs for sitemap:", error);
    }

    const allPages = [...staticPages, ...dynamicPages];

    const xmlUrls = allPages.map(page => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : (page.startsWith('/blog/') ? '0.7' : '0.8')}</priority>
  </url>`).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  // Public Blog Routes
  app.get('/api/blogs', async (req, res) => {
    try {
      const posts = await db.select().from(blogPosts).where(eq(blogPosts.status, 'published')).orderBy(desc(blogPosts.publishedAt));
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get('/api/blogs/:slug', async (req, res) => {
    try {
      const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, req.params.slug));
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  // Public Search Endpoint (No Login Required)
  app.get('/api/public/items/search', async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ status: 'error', message: "Search query is required" });
      }

      const { users, posProducts } = await import('@shared/schema');

      // Mask phone: +250788123456 → +250***456
      const maskPhone = (phone: string | null) => {
        if (!phone) return 'Not provided';
        const cleaned = phone.replace(/\s+/g, '');
        if (cleaned.length <= 7) return cleaned.replace(/./g, '*');
        const start = cleaned.substring(0, 4);
        const end = cleaned.substring(cleaned.length - 3);
        return `${start}${'*'.repeat(cleaned.length - 7)}${end}`;
      };

      // 1. Check items registry (user-registered items) by uniqueIdentifier
      const [item] = await db.select({
        id: items.id,
        status: items.status,
        name: items.name,
        category: items.category,
        userId: items.userId
      })
      .from(items)
      .where(sql`LOWER(${items.uniqueIdentifier}) = LOWER(${query.trim()})`)
      .limit(1);

      if (item) {
        const [owner] = await db.select({
          fullName: users.fullName,
          phoneNumber: users.phoneNumber
        })
        .from(users)
        .where(eq(users.id, item.userId))
        .limit(1);

        if (owner) {
          return res.json({
            status: 'found',
            item: { status: item.status, name: item.name, category: item.category },
            owner: { name: owner.fullName, phone: maskPhone(owner.phoneNumber) }
          });
        }
      }

      // 2. Check POS products (retailer-sold items) by serialNumber or kizereId
      const [posItem] = await db.select({
        id: posProducts.id,
        status: posProducts.status,
        name: posProducts.name,
        category: posProducts.category,
        currentOwnerId: posProducts.currentOwnerId
      })
      .from(posProducts)
      .where(or(
        sql`LOWER(${posProducts.serialNumber}) = LOWER(${query.trim()})`,
        sql`LOWER(${posProducts.kizereId}) = LOWER(${query.trim()})`
      ))
      .limit(1);

      if (posItem) {
        const [owner] = await db.select({
          fullName: users.fullName,
          phoneNumber: users.phoneNumber
        })
        .from(users)
        .where(eq(users.id, posItem.currentOwnerId))
        .limit(1);

        if (owner) {
          return res.json({
            status: 'found',
            item: { status: posItem.status, name: posItem.name, category: posItem.category },
            owner: { name: owner.fullName, phone: maskPhone(owner.phoneNumber) }
          });
        }
      }

      return res.json({ status: 'not_found', message: 'This item is not protected by Kizere' });
    } catch (error) {
      logger.error('Error in public item search', { error });
      res.status(500).json({ status: 'error', message: "Failed to search for item" });
    }
  });

  // Authenticated routes
  app.use('/api/items', requireAuth, itemRoutes);
  app.use('/api/reports', requireAuth, reportRoutes);
  app.use('/api/notifications', requireAuth, notificationRoutes);
  // Payment routes — webhook + package pricing are public; everything else requires auth
  app.use('/api/payments', (req: any, res: any, next: any) => {
    if (req.method === 'POST' && req.path === '/webhook') return next();
    if (req.method === 'GET' && req.path.startsWith('/type/')) return next();
    if (req.method === 'GET' && (req.path === '/' || req.path === '/packages')) return next();
    requireAuth(req, res, next);
  }, paymentRoutes);
  app.use('/api/payment-packages', requireAuth, paymentRoutes);
  app.use('/api/claims', requireAuth, claimRoutes);
  app.use('/api/me', requireAuth, profileRoutes);
  app.use('/api/upload', requireAuth, uploadRoutes);
  app.use('/api/moderation', requireAuth, moderationRoutes);
  app.use('/api/coupons', requireAuth, couponRoutes);
  app.use('/api/search', requireAuth, searchRoutes);
  app.use('/api/dashboard', requireAuth, dashboardRoutes);
  app.use('/api/chats', requireAuth, chatRoutes);
  app.use('/api/webhooks/resend', resendWebhookRoutes);
  app.use('/api/consent', requireAuth, consentRoutes);
  app.use('/api/me', requireAuth, dataRightsRoutes);

  // Recruitment endpoint (with file upload support)
  const multer = (await import('multer')).default;
  const recruitUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (_req: any, file: any, cb: any) => {
      const allowed = ['.pdf', '.doc', '.docx'];
      const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
      cb(null, allowed.includes(ext));
    }
  });

  app.post("/api/recruitment/apply", recruitUpload.single('file'), async (req, res) => {
    try {
      const { name, email, phone, targetLanguage, sampleTranslation } = req.body;

      if (!name || !email || !targetLanguage || !sampleTranslation) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const file = (req as any).file;
      const success = await sendApplicationEmail(name, email, phone || '', targetLanguage, sampleTranslation, file);

      if (success) {
        res.json({ message: "Application submitted successfully" });
      } else {
        res.status(500).json({ message: "Failed to submit application. Please try again later." });
      }
    } catch (error: any) {
      logger.error('Error submitting application', { error: error.message });
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`SELECT 1`);
      res.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: "Health check failed", error: error.message });
    }
  });

  // Google Authentication Status endpoint
  app.get("/api/auth/google/status", (req, res) => {
    res.json({
      status: "Available",
      message: "Google authentication is configured and ready",
      authenticated: req.isAuthenticated(),
      user: req.isAuthenticated() ? req.user : null
    });
  });

  // Debug ENV presence (names only)
  app.get("/api/debug-env", requireAdmin, (req, res) => {
    res.json({
      DATABASE_URL: !!process.env.DATABASE_URL,
      SESSION_SECRET: !!process.env.SESSION_SECRET,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      VITE_FIREBASE_API_KEY: !!process.env.VITE_FIREBASE_API_KEY,
      FIREBASE_SERVICE_ACCOUNT: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      TIMESTAMP: new Date().toISOString()
    });
  });

  // Debug DB connection
  app.get("/api/debug-db", requireAdmin, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const result = await db.execute(sql`SELECT 1 as connected`);
      res.json({ status: "success", result, env: process.env.NODE_ENV });
    } catch (error: any) {
      logger.error('Debug DB failed', { error: error.message });
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  // Firebase Google Auth Callback (Keep as is if shared logic is complex)
  app.get("/api/auth/google-callback", async (req, res) => {
    try {
      const { AuthCallbackController } = await import('./controllers/auth-callback.controller');
      return AuthCallbackController.handleGoogleCallback(req, res);
    } catch (error) {
      logger.error("Error handling Google OAuth callback:", error);
      res.status(500).send("Authentication error");
    }
  });

  // Google Authentication with Firebase token verification
  const googleAuthSchema = z.object({
    email: z.string().email(),
    name: z.string(),
    uid: z.string(),
    token: z.string().optional(),
    photoURL: z.string().optional().nullable()
  });

  app.post("/api/auth/google", async (req, res) => {
    const { canVerifyTokens, default: firebaseAdmin } = await import('./utils/firebase-admin');

    try {
      const validationResult = googleAuthSchema.safeParse(req.body);

      if (!validationResult.success) {
        logger.warn('Google auth validation failed', { errors: validationResult.error.errors });
        return res.status(400).json({
          message: "Invalid request data",
          errors: validationResult.error.errors
        });
      }

      const { email, name, uid, token, photoURL } = validationResult.data;
      const origin = req.headers.origin;
      const referer = req.headers.referer;
      const isReplitEnvironment =
        (origin && (origin.includes('replit') || origin.includes('repl.co'))) ||
        (referer && (referer.includes('replit') || referer.includes('repl.co')));

      logger.info('Google auth request details', {
        email,
        hasToken: !!token,
        isReplitEnvironment
      });

      // Token Verification Logic
      let tokenVerified = false;

      if (token) {
        try {
          if (canVerifyTokens && typeof canVerifyTokens === 'function' && canVerifyTokens()) {
            const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
            if (decodedToken && decodedToken.uid === uid) {
              tokenVerified = true;
              logger.info('Firebase token successfully verified', { uid });
            } else {
              logger.warn('Token UID mismatch or invalid', { tokenUid: decodedToken?.uid, providedUid: uid });
              if (process.env.NODE_ENV === 'production') {
                return res.status(401).json({ message: "Invalid authentication token" });
              }
            }
          } else {
            logger.warn('Token verification skipped - no FIREBASE_SERVICE_ACCOUNT credentials');
          }
        } catch (tokenError: any) {
          logger.error('Token verification error', { error: tokenError.message });
          if (process.env.NODE_ENV === 'production' && !isReplitEnvironment) {
            return res.status(401).json({ message: "Failed to verify authentication token" });
          }
        }
      } else if (process.env.NODE_ENV === 'production' && !isReplitEnvironment) {
        // In strict production (non-Replit), require a token
        return res.status(401).json({ message: "Authentication token is required" });
      }

      // Find or Create User
      let user = await UserService.getUserByEmail(email);

      if (!user) {
        try {
          // Create secure random password that won't be used for login
          // We pass it PLAIN to UserService.createUser so it can be validated and then hashed by Repository
          const securePassword = `FirebaseAuth_${uid}_${crypto.randomBytes(4).toString('hex')}!`;

          user = await UserService.createUser({
            fullName: name,
            username: email, // Use email as username for Google Auth users initially
            email: email,
            password: securePassword,
            phoneNumber: null,
            role: 'Subscriber',
            avatarUrl: photoURL || null,
            preferences: DEFAULT_USER_PREFERENCES,
            twoFactorEnabled: true,
            twoFactorMethod: 'email'
          });
          logger.info('Created new user from Firebase auth', { userId: user.id, email });
        } catch (createError: any) {
          logger.error('Failed to create user from Firebase auth', {
            error: createError.message,
            stack: createError.stack,
            email
          });
          return res.status(500).json({
            message: "Failed to create user account",
            details: createError.message
          });
        }
      } else {
        // Update avatar if changed
        if (photoURL && user.avatarUrl !== photoURL) {
          try {
            await UserService.updateUser(user.id, { avatarUrl: photoURL });
          } catch (e) { /* ignore avatar update error */ }
        }
      }

      if (!user) {
        return res.status(500).json({ message: "User retrieval failed" });
      }

      // Initial login establishes the session in memory/store
      req.login(user, (err) => {
        if (err) {
          logger.error('Passport login error', { userId: user!.id, error: err });
          return res.status(500).json({ message: "Login session creation failed" });
        }

        // CRITICAL: Explicitly save the session before responding
        // This ensures the session is written to the store (e.g. Postgres) 
        // before the Vercel serverless function freezes/terminates.
        req.session.save((saveErr) => {
          if (saveErr) {
            logger.error('Session save error', { error: saveErr });
            return res.status(500).json({ message: "Failed to save session" });
          }

          logger.info('Session saved successfully', { userId: user!.id, sessionId: req.sessionID });

          const { password, ...userData } = user!;
          return res.status(200).json({
            ...userData,
            preferredMethod: user!.twoFactorMethod
          });
        });
      });

    } catch (error: any) {
      logger.error('Firebase auth critical error', {
        message: error.message,
        stack: error.stack
      });

      res.status(500).json({
        message: "Internal authentication error",
        debug_error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Mount verification routes
  app.use("/api/verification", requireAuth, verificationRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
