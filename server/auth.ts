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
import { sendOTP, verifyOTP } from "./services/otp.service";
import { normalizeRwandanPhone, isValidRwandanPhone, sendSMS } from "./services/sms.service";
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


// Exported so Socket.IO can reuse the same session middleware for WS auth
export let sessionMiddleware: ReturnType<typeof session>;

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
  sessionMiddleware = session(sessionSettings);
  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());
}

export function setupAuth(app: Express) {

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        logger.info('[Auth] login attempt', { username });
        let user = await storage.getUserByUsername(username);
        
        // Fallback to searching by email if username not found
        if (!user) {
          user = await storage.getUserByEmail(username);
        }

        if (!user) {
          logger.warn('[Auth] user not found', { username });
          return done(null, false);
        }

        const isMatch = await comparePasswords(password, user.password);
        if (!isMatch) {
          logger.warn('[Auth] invalid password', { userId: user.id, username: user.username });
          return done(null, false);
        }

        logger.info('[Auth] authentication successful', { userId: user.id });
        return done(null, user);
      } catch (error) {
        logger.error('[Auth] strategy error', { error });
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
        twoFactorEnabled: true,
        twoFactorMethod: req.body.phoneNumber ? 'sms' : 'email',
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

      // Force 2FA verification on registration
      (req.session as any).pending2FAUserId = user.id;
      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);

        const methods: string[] = [];
        if (user.phoneNumber) methods.push('sms');
        if (user.email && !user.email.includes('@placeholder.kizere.rw')) methods.push('email');
        if (methods.length === 0) methods.push('email'); // Fallback option

        res.status(201).json({
          requires2FA: true,
          isRegistration: true,
          userId: user.id,
          methods,
          preferredMethod: user.twoFactorMethod,
          maskedPhone: user.phoneNumber ? maskPhone(user.phoneNumber) : null,
          maskedEmail: user.email ? maskEmail(user.email) : null,
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) {
        logger.error('[Auth] passport.authenticate error', { err });
        return next(err);
      }
      if (!user) {
        logger.warn('[Auth] login failed: user not found or password mismatch', { 
          info,
          username: req.body.username 
        });
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        // Store pending user ID in session for 2FA verification
        (req.session as any).pending2FAUserId = user.id;
        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);

          // Determine available 2FA methods
          const methods: string[] = [];
          if (user.phoneNumber) methods.push('sms');
          if (user.email && !user.email.includes('@placeholder.kizere.rw')) methods.push('email');
          // Fallback: always allow email if no phone is verified and no valid email is present
          if (methods.length === 0) methods.push('email');

          return res.status(200).json({
            requires2FA: true,
            methods,
            preferredMethod: user.twoFactorMethod,
            maskedPhone: user.phoneNumber ? maskPhone(user.phoneNumber) : null,
            maskedEmail: user.email ? maskEmail(user.email) : null,
          });
        });
        return;
      }

      // Normal login (no 2FA) — rotate session ID before completing login
      req.session.regenerate((regenErr) => {
        if (regenErr) return next(regenErr);

        req.login(user as Express.User, (loginErr) => {
          if (loginErr) return next(loginErr);

          req.session.save((saveErr) => {
            if (saveErr) return next(saveErr);

            storage.updateUser(user.id, { lastLogin: new Date() }).catch(err => {
              logger.error('Failed to update last login', { error: err, userId: user.id });
            });

            const { password, ...userWithoutPassword } = user;
            res.status(200).json(userWithoutPassword);
          });
        });
      });
    })(req, res, next);
  });

  // ===================== 2FA Endpoints =====================

  /**
   * Send 2FA verification code
   * Called after login returns requires2FA: true
   */
  app.post("/api/auth/2fa/send", async (req, res, next) => {
    try {
      const pendingUserId = (req.session as any)?.pending2FAUserId;
      if (!pendingUserId) {
        return res.status(400).json({ message: "No pending 2FA verification. Please log in first." });
      }

      const { channel } = req.body; // 'sms' or 'email'
      if (!channel || !['sms', 'email'].includes(channel)) {
        return res.status(400).json({ message: "Invalid channel. Use 'sms' or 'email'." });
      }

      const user = await storage.getUser(pendingUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let destination: string;
      if (channel === 'sms') {
        if (!user.phoneNumber) {
          return res.status(400).json({ message: "No phone number on this account." });
        }
        destination = user.phoneNumber;
      } else {
        if (!user.email || user.email.includes('@placeholder.kizere.rw')) {
          return res.status(400).json({ message: "No valid email on this account." });
        }
        destination = user.email;
      }

      const result = await sendOTP(user.id, channel, 'login_2fa', destination);
      if (!result.success) {
        const isRateLimit = result.message.includes('Too many');
        return res.status(isRateLimit ? 429 : 500).json({ message: result.message });
      }
      return res.status(200).json({ message: result.message });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Verify 2FA code and complete login
   */
  app.post("/api/auth/2fa/verify", async (req, res, next) => {
    try {
      const pendingUserId = (req.session as any)?.pending2FAUserId;
      if (!pendingUserId) {
        return res.status(400).json({ message: "No pending 2FA verification. Please log in first." });
      }

      const { code } = req.body;
      if (!code || code.length !== 6) {
        return res.status(400).json({ message: "Please enter a valid 6-digit code." });
      }

      const result = await verifyOTP(pendingUserId, code, 'login_2fa');
      if (!result.valid) {
        return res.status(400).json({ message: result.message });
      }

      // If it's a registration/login 2FA, mark the used channel as verified
      if (result.channel === 'sms') {
        await storage.updateUser(pendingUserId, { phoneVerified: true });
      } else if (result.channel === 'email') {
        await storage.updateUser(pendingUserId, { emailVerified: true });
      }

      // OTP verified — complete login
      const user = await storage.getUser(pendingUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Rotate session ID before completing login to prevent session fixation
      req.session.regenerate((regenErr) => {
        if (regenErr) return next(regenErr);

        req.login(user as Express.User, (loginErr) => {
          if (loginErr) return next(loginErr);

          req.session.save((saveErr) => {
            if (saveErr) return next(saveErr);

            storage.updateUser(user.id, { lastLogin: new Date() }).catch(err => {
              logger.error('Failed to update last login', { error: err, userId: user.id });
            });

            const { password, ...userWithoutPassword } = user;
            res.status(200).json(userWithoutPassword);
          });
        });
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Enable 2FA for authenticated user
   */
  app.post("/api/auth/2fa/enable", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { method, code } = req.body; // method: 'sms' | 'email' | 'both'
      if (!method || !['sms', 'email', 'both'].includes(method)) {
        return res.status(400).json({ message: "Invalid method. Use 'sms', 'email', or 'both'." });
      }

      // Require a confirmation code — proves the user controls their device before enabling 2FA
      if (!code) {
        return res.status(400).json({ message: "A verification code is required. Please call /api/auth/2fa/send first." });
      }
      const verifyResult = await verifyOTP(req.user.id, code, 'login_2fa');
      if (!verifyResult.valid) {
        return res.status(400).json({ message: verifyResult.message });
      }

      // Enable 2FA
      await storage.updateUser(req.user.id, {
        twoFactorEnabled: true,
        twoFactorMethod: method,
      });

      logger.info('2FA enabled', { userId: req.user.id, method });
      res.status(200).json({ message: `Two-factor authentication enabled via ${method}` });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Disable 2FA for authenticated user (requires current password)
   */
  app.post("/api/auth/2fa/disable", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { password: currentPassword } = req.body;
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to disable 2FA." });
      }

      // Verify current password
      const user = await storage.getUser(req.user.id);
      if (!user || !(await comparePasswords(currentPassword, user.password))) {
        return res.status(400).json({ message: "Incorrect password." });
      }

      await storage.updateUser(req.user.id, {
        twoFactorEnabled: false,
        twoFactorMethod: null,
      });

      logger.info('2FA disabled', { userId: req.user.id });
      res.status(200).json({ message: "Two-factor authentication has been disabled." });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Verify phone number (used during registration or settings)
   */
  app.post("/api/auth/verify-phone", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { code } = req.body;
      if (!code || code.length !== 6) {
        return res.status(400).json({ message: "Please enter a valid 6-digit code." });
      }

      const result = await verifyOTP(req.user.id, code, 'phone_verify');
      if (!result.valid) {
        return res.status(400).json({ message: result.message });
      }

      // Mark phone as verified
      await storage.updateUser(req.user.id, { phoneVerified: true });

      logger.info('Phone verified', { userId: req.user.id });
      res.status(200).json({ message: "Phone number verified successfully." });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Send phone verification OTP (for settings / post-registration)
   */
  app.post("/api/auth/send-phone-otp", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(req.user.id);
      if (!user || !user.phoneNumber) {
        return res.status(400).json({ message: "No phone number on this account." });
      }

      if (!isValidRwandanPhone(user.phoneNumber)) {
        return res.status(400).json({ message: "Invalid Rwandan phone number format." });
      }

      const result = await sendOTP(user.id, 'sms', 'phone_verify', user.phoneNumber);
      return res.status(result.success ? 200 : 429).json({ message: result.message });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/forgot-password", async (req, res, next) => {
    try {
      const { email, phoneNumber } = req.body;
      const identifier = email || phoneNumber;
      
      if (!identifier) {
        return res.status(400).json({ message: "Email or phone number is required" });
      }

      const { token, user } = await UserService.generateResetToken(identifier);
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(identifier);

      if (isEmail) {
        // Send reset email
        await sendResetPasswordEmail(user.email, user.fullName || user.username, token);
        res.status(200).json({ message: "Password reset link sent to your email" });
      } else {
        // Send reset SMS
        // We use the same 'token' (6-digit code) generated by UserService
        const message = `Your KIZERE password reset code is: ${token}. It expires in 1 hour. Do not share this code with anyone.`;
        await sendSMS(user.phoneNumber || identifier, message);
        
        res.status(200).json({ message: "If an account exists with that phone number, a reset code has been sent." });
      }
    } catch (error: any) {
      // For security, don't reveal if user exists or not (except for specific errors)
      if (error.name === 'NotFoundError') {
        const identifier = req.body.email || req.body.phoneNumber || "";
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        return res.status(200).json({ 
          message: isEmail 
            ? "If an account exists with that email, a reset link has been sent."
            : "If an account exists with that phone number, a reset code has been sent."
        });
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

// Utility functions for masking sensitive data
function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return '***';
  return phone.slice(0, 4) + '****' + phone.slice(-3);
}

function maskEmail(email: string): string {
  if (!email) return '***';
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const maskedLocal = local.slice(0, 2) + '***';
  return `${maskedLocal}@${domain}`;
}