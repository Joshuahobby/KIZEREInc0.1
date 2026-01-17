import express, { type Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createLogger } from "./utils/logger";
import { setupSecurityMiddleware } from "./middleware/security.middleware";
import { handleRequestError } from "./utils/error-handler";

const logger = createLogger('Server');
const app = express();

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

const startServer = async () => {
  const server = await registerRoutes(app);

  // Global error handler using centralized error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    // Log the original error for debugging
    logger.error('Global error handler caught an error', {
      path: req.path,
      method: req.method,
      error: err.message || 'Unknown error',
      stack: err.stack
    });
    
    // Use our centralized error handler to format the response
    handleRequestError(err, res);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Only listen if not in a serverless environment
  if (process.env.NODE_ENV !== "production" || process.env.VERCEL !== "1") {
    const port = 5000;
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  }
  
  return server;
};

// Start the server
startServer().catch((err) => {
  logger.error("Failed to start server", { error: err.message, stack: err.stack });
  process.exit(1);
});

export default app;
