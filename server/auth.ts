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
import { sendWelcomeEmail } from "./services/email.service";


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
  // If missing, a new secret is generated on every lambda cold start, logging everyone out.
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret && env.NODE_ENV === "production") {
    console.error("❌ CRITICAL ERROR: SESSION_SECRET is not set in production!");
    console.error("Sessions will be volatile and users will be logged out on every serverless cold start.");
    console.error("Please set SESSION_SECRET in your Vercel Environment Variables.");
  }

  // Use a hash of the DATABASE_URL as a semi-stable fallback if secret is missing
  // This is better than randomBytes which changes on every single cold start.
  const fallbackSecret = process.env.DATABASE_URL
    ? createHash('sha256').update(process.env.DATABASE_URL).digest('hex')
    : randomBytes(32).toString('hex');

  const finalSecret = sessionSecret || fallbackSecret;

  const sessionSettings: session.SessionOptions = {
    secret: finalSecret,
    resave: false,
    saveUninitialized: false,
    name: 'kizere.sid', // Specific name to avoid conflicts
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: 'lax'
    },
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
}

export function setupAuth(app: Express) {

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
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
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("Deserializing user ID:", id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log("User not found in database:", id);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(null, false);
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
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

      // Create new user with forced Subscriber role
      const user = await storage.createUser(safeUserData);

      // Send welcome email
      if (user.email) {
        sendWelcomeEmail(user.email, user.fullName || user.username)
          .catch(err => console.error('Failed to send welcome email:', err));
      }

      // Strip password from response
      const { password, ...userWithoutPassword } = user;

      // Log in the new user
      req.login(user, (err) => {
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
      req.login(user, (loginErr) => {
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
      return res.status(401).json({ message: "Not authenticated" });
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
      console.error("Error fetching user data:", error);
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