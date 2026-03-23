import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { randomBytes, createHash } from "crypto";
import { storage } from "./storage";
import { User as SchemaUser, User as SelectUser } from "@shared/schema";
import { env } from "./config";
import { UserService } from "./services/user.service";
import { hashPassword, comparePasswords } from "./utils/auth-crypto";
import { sendWelcomeEmail, sendResetPasswordEmail } from "./services/email.service";
import { createLogger } from "./utils/logger";

const logger = createLogger('Auth');


declare global {
  namespace Express {
    interface User extends SelectUser {
      preferences: any;
      customPermissions: string[] | null;
    }
  }
}


export function setupSessionAccess(app: Express) {
  // SESSION_SECRET is critical for session persistence in serverless environments.
  const sessionSecret = process.env.SESSION_SECRET;
  const nodeEnv = process.env.NODE_ENV || "development";
  const isLocal = process.env.LOCAL_TESTING === "true" || nodeEnv === "development";

  console.log(`[Auth] Setting up session access. ENV: ${nodeEnv}, Local: ${isLocal}`);

  if (!sessionSecret && nodeEnv === "production") {
    console.error("❌ CRITICAL ERROR: SESSION_SECRET is not set in production!");
  }

  const fallbackSecret = process.env.DATABASE_URL
    ? createHash('sha256').update(process.env.DATABASE_URL).digest('hex')
    : randomBytes(32).toString('hex');

  const finalSecret = sessionSecret || fallbackSecret;

  const sessionSettings: session.SessionOptions = {
    secret: finalSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Force cookie on every response to help debugging
    name: 'kizere.sid',
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      // Only require secure cookies in production, UNLESS we're on localhost
      secure: nodeEnv === "production" && !isLocal,
      sameSite: 'lax'
    },
    store: storage.sessionStore,
  };

  console.log(`[Auth] Session Cookie Settings:`, {
    name: sessionSettings.name,
    secure: sessionSettings.cookie?.secure,
    resave: sessionSettings.resave,
    saveUninitialized: sessionSettings.saveUninitialized,
    isLocal
  });

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
}

export function setupAuth(app: Express) {

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        let user = await storage.getUserByUsername(username);
        
        // Fallback to searching by email if username not found
        if (!user) {
          user = await storage.getUserByEmail(username);
        }

        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        logger.warn('Deserialized user not found in database', { userId: id });
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      logger.error('Error deserializing user', { error });
      done(null, false);
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      // Validate password strength
      const rawPassword = req.body.password;
      if (!rawPassword || rawPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      // Rwanda Law No. 058/2021, Art. 6 — Require explicit consent
      if (!req.body.consentGiven) {
        return res.status(400).json({
          message: "You must consent to our Privacy Policy and data processing terms to create an account."
        });
      }

      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // SECURITY: Force role to Subscriber for public registration
      // Admin and Agent roles can only be assigned by existing administrators
      const safeUserData = {
        ...req.body,
        role: 'Subscriber', // Always force Subscriber role on public registration
        password: await hashPassword(req.body.password),
      };

      // Remove consent field from user data (stored separately)
      delete safeUserData.consentGiven;

      // Create new user with forced Subscriber role
      const user = await storage.createUser(safeUserData);

      // Record consent (Rwanda Law No. 058/2021, Art. 6)
      try {
        const { createConsentRecord } = await import("./storage/consent.storage");
        await createConsentRecord({
          userId: user.id,
          consentType: "registration",
          consentGiven: true,
          consentText: "I agree to KIZERE's Privacy Policy and consent to the processing of my personal data for item registration, lost & found reporting, and identity verification purposes, as described in the Privacy Policy.",
          ipAddress: (req.ip as string) || null,
          userAgent: req.headers["user-agent"] || null,
        });
      } catch (consentErr) {
        logger.error('Failed to record consent', { error: consentErr, userId: user.id });
      }

      // Send welcome email
      if (user.email) {
        sendWelcomeEmail(user.email, user.fullName || user.username)
          .catch(err => logger.error('Failed to send welcome email', { error: err }));
      }

      // Strip password from response
      const { password, ...userWithoutPassword } = user;

      // Log in the new user
      req.login(user as Express.User, (err) => {
        if (err) return next(err);

        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);
          res.status(201).json(userWithoutPassword);
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.login(user as Express.User, (loginErr) => {
        if (loginErr) return next(loginErr);

        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);
          // Strip password from response
          const { password, ...userWithoutPassword } = user;
          res.status(200).json(userWithoutPassword);
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/forgot-password", async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const { token, user } = await UserService.generateResetToken(email);
      
      // Send reset email
      await sendResetPasswordEmail(user.email, user.fullName || user.username, token);

      res.status(200).json({ message: "Password reset link sent to your email" });
    } catch (error: any) {
      // For security, don't reveal if user exists or not
      if (error.name === 'NotFoundError') {
        return res.status(200).json({ message: "If an account exists with that email, a reset link has been sent." });
      }
      next(error);
    }
  });

  app.post("/api/auth/reset-password", async (req, res, next) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      await UserService.resetPassword(token, password);
      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((destroyErr) => {
        if (destroyErr) return next(destroyErr);
        res.clearCookie('kizere.sid');
        res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.json(null);
    }

    try {
      // Use UserService to get fresh user data
      const freshUserData = await UserService.getUserById(req.user.id);

      if (!freshUserData) {
        return res.status(404).json({ message: "User no longer exists" });
      }

      // Strip password from response
      const { password, ...userWithoutPassword } = freshUserData;
      res.json(userWithoutPassword);
    } catch (error) {
      logger.error('Error fetching fresh user data', { error, userId: req.user?.id });
      // Fallback to session user if service fails
      if (!req.user) {
        return res.status(401).json({ message: "Session user missing" });
      }
      const { password, ...userWithoutPassword } = req.user;
      res.json(userWithoutPassword);
    }
  });

  // Google OAuth authentication is now handled in routes.ts
}