import express, { type Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./static"; // Reverted to correct import
import { createLogger } from "./utils/logger";
import { config, isProd } from "./config";
import { setupSecurityMiddleware } from "./middleware/security.middleware";
import { handleRequestError } from "./utils/error-handler";
import { startExpirationCron } from "./cron/expiration";
import { initMonitoring, initErrorHandlers } from "./utils/monitoring";

const logger = createLogger('Server');
const app = express();

// Handle process-level errors
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
let serverPromise: Promise<any> | null = null;

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

  // Start background cron jobs
  try {
    const { startExpirationCron } = await import("./cron/expiration");
    startExpirationCron();
    logger.info("Expiration cron job started");
  } catch (err) {
    logger.error("Failed to start expiration cron", { error: err });
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

  // Explicitly check if running on Vercel to avoid loading Vite
  const isVercel = process.env.VERCEL === "1";
  if (isVercel) {
    process.env.NODE_ENV = "production";
  }
  if (app.get("env") === "development" && !isVercel) {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Only listen if not in a serverless environment
  if (!isProd || process.env.VERCEL !== "1") {
    const port = config.PORT;
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  }

  return server;
};

// Start the server initialization
serverPromise = startServer().catch((err) => {
  logger.error("Failed to start server", { error: err.message, stack: err.stack });
  // Don't exit in Vercel, just let the promise reject
  if (process.env.VERCEL !== "1") {
    process.exit(1);
  }
  throw err;
});

export { app, serverPromise };
export default app;
