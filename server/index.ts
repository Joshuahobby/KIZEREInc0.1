import express, { type Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createLogger } from "./utils/logger";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

(async () => {
  const server = await registerRoutes(app);

  // Global error handler with improved error logging
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Generate a unique request ID for tracking this error
    const requestId = crypto.randomUUID();
    
    // Create structured error response
    const errorResponse = {
      status: 'error',
      message: err.message || 'An unexpected error occurred',
      code: err.code || 'UNKNOWN_ERROR',
      requestId: requestId
    };
    
    // Extract status code from error
    const status = err.status || err.statusCode || 500;
    
    // Enhanced logging with request context
    const logContext = {
      requestId,
      path: _req.path,
      method: _req.method,
      statusCode: status,
      errorCode: err.code,
      errorType: err.name || (err.constructor ? err.constructor.name : 'UnknownError'),
      errorStack: err.stack
    };
    
    // Log based on error severity
    if (status >= 500) {
      console.error(`[ERROR] Server error (${requestId}):`, err.message);
      console.error(logContext);
    } else if (status >= 400) {
      console.warn(`[WARN] Client error (${requestId}):`, err.message);
      console.warn(logContext);
    }
    
    // Send appropriate response to client
    // In production, don't expose internal error details
    const clientResponse = process.env.NODE_ENV === 'production' 
      ? { 
          message: status === 500 ? 'Internal server error' : err.message,
          requestId,
          status: 'error'
        }
      : { 
          message: err.message || 'Internal server error',
          requestId,
          status: 'error',
          details: err.details || null,
          code: err.code || null
        };
        
    res.status(status).json(clientResponse);
    // Don't throw the error again - this is causing the app to crash
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
