import express, { type Request, Response, NextFunction } from "express"; // Updated
import crypto from "crypto";
import cookieParser from "cookie-parser";
import { config, isProd } from "./config";
import { registerRoutes } from "./routes";
import { setupSessionAccess } from "./auth";
import { serveStatic, log } from "./static"; // Reverted to correct import
import { createLogger } from "./utils/logger";
import { setupSecurityMiddleware } from "./middleware/security.middleware";
import { handleRequestError } from "./utils/error-handler";
import { initMonitoring, initErrorHandlers } from "./utils/monitoring";

const logger = createLogger('Server');
const app = express();
let serverPromise: Promise<any>;

// Trust proxy is required for correct IP detection on Vercel/proxies
app.set('trust proxy', true);

// Handle process-level errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
});

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Setup session and passport before security
setupSessionAccess(app);

// Apply security middleware before route handlers
setupSecurityMiddleware(app);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Export app and server for Vercel

export const startServer = async () => {
  // Initialize Monitoring (Sentry)
  await initMonitoring(app);

  const server = await registerRoutes(app);

  // Initialize WebSocket server
  try {
    const { setupWebSocket } = await import("./websocket");
    setupWebSocket(server);
    logger.info("WebSocket server started");
  } catch (err) {
    logger.error("Failed to start WebSocket server", { error: err });
  }

  // Start background cron jobs (skip on Vercel as background jobs are not supported in serverless)
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";
  if (!isVercel) {
    try {
      const { startExpirationCron } = await import("./cron/expiration");
      startExpirationCron();
      logger.info("Expiration cron job started");
    } catch (err) {
      logger.error("Failed to start expiration cron", { error: err });
    }

    try {
      const { startSubscriptionReminderCron } = await import("./cron/subscription-reminder");
      startSubscriptionReminderCron();
      logger.info("Subscription reminder cron job started");
    } catch (err) {
      logger.error("Failed to start subscription reminder cron", { error: err });
    }
  } else {
    logger.info("Vercel: Skipping expiration cron job in serverless environment");
  }

  // Global error handler using centralized error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    logger.error('Global error handler caught an error', {
      path: req.path,
      method: req.method,
      error: err.message || 'Unknown error',
      stack: err.stack
    });

    handleRequestError(err, res);
  });

  // Sentry error handler (must be after all controllers)
  initErrorHandlers(app);

  if (isVercel) {
    process.env.NODE_ENV = "production";
  }

  logger.info("Initializing environment-specific middleware", {
    isDev: !isProd,
    isVercel,
    nodeEnv: process.env.NODE_ENV,
    appEnv: app.get("env")
  });

  if (!isProd && !isVercel) {
    logger.info("Setting up Vite for development...");
    try {
      // Hide the import from static analysis to prevent bundling devDependencies into production
      const vitePath = "./vite";
      const { setupVite } = await import(vitePath);
      await setupVite(app, server);
      logger.info("Vite middleware initialized successfully");
    } catch (err: any) {
      logger.error("Failed to setup Vite", { error: err.message, stack: err.stack });
    }
  } else {
    logger.info("Serving static files for production/serverless mode");
    serveStatic(app);
  }

  // Only listen if not in a serverless environment
  // In Vercel, the environment provides the server.
  if (process.env.VERCEL !== "1" && process.env.VERCEL !== "true") {
    const port = config.PORT || 5000;
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  }

  return server;
};

// ⚡ Top-level diagnostic logging for Vercel
console.log(`[Vercel] Booting KIZERE Server... (ENV: ${isProd ? 'production' : 'development'})`);

serverPromise = (async () => {
  try {
    const server = await startServer();
    console.log(`[Vercel] KIZERE Server fully initialized`);
    return server;
  } catch (error: any) {
    console.error('[Vercel] FATAL CRASH during server initialization:', {
      message: error.message,
      stack: error.stack
    });
    // Re-throw so the module properly fails and Vercel sees the crash
    throw error;
  }
})();

export { app, serverPromise };
export default app;
