import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { User, User as SelectUser } from "@shared/schema";
import { env } from "./config";
import { UserService } from "./services/user.service";
import { hashPassword, comparePasswords } from "./utils/auth-crypto";


declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}


export function setupAuth(app: Express) {
  // Always generate a fallback session secret for development
  // In production, SESSION_SECRET should be set properly
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
  console.log("Using session secret:", sessionSecret ? "✓ Session secret available" : "⚠️ No session secret");
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: 'lax' // Provides some CSRF protection
    },
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

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

      // Create new user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Strip password from response
      const { password, ...userWithoutPassword } = user;

      // Log in the new user
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        // Strip password from response
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
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
      const { password, ...userWithoutPassword } = req.user;
      res.json(userWithoutPassword);
    }
  });
  
  // Google OAuth authentication is now handled in routes.ts
}