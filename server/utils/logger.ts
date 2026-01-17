/**
 * Centralized logging utility
 * Provides consistent logging functionality across the application
 */
import { Request } from 'express';

// Define log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Logger interface
interface Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}

/**
 * Creates a logger instance for a specific module
 * @param moduleName Name of the module (for log context)
 * @returns Logger instance
 */
export function createLogger(moduleName: string): Logger {
  return {
    debug: (message: string, meta?: any) => {
      if (process.env.NODE_ENV !== 'production') {
        if (meta !== undefined) {
          console.debug(`[${new Date().toISOString()}] [DEBUG] [${moduleName}]`, message, meta);
        } else {
          console.debug(`[${new Date().toISOString()}] [DEBUG] [${moduleName}]`, message);
        }
      }
    },
    
    info: (message: string, meta?: any) => {
      if (meta !== undefined) {
        console.info(`[${new Date().toISOString()}] [INFO] [${moduleName}]`, message, meta);
      } else {
        console.info(`[${new Date().toISOString()}] [INFO] [${moduleName}]`, message);
      }
    },
    
    warn: (message: string, meta?: any) => {
      if (meta !== undefined) {
        console.warn(`[${new Date().toISOString()}] [WARN] [${moduleName}]`, message, meta);
      } else {
        console.warn(`[${new Date().toISOString()}] [WARN] [${moduleName}]`, message);
      }
    },
    
    error: (message: string, meta?: any) => {
      if (meta !== undefined) {
        // If meta is an error, try to pass its message or string representation to avoid util.inspect issues
        const safeMeta = (meta instanceof Error) ? { message: meta.message, stack: meta.stack } : meta;
        console.error(`[${new Date().toISOString()}] [ERROR] [${moduleName}]`, message, safeMeta);
      } else {
        console.error(`[${new Date().toISOString()}] [ERROR] [${moduleName}]`, message);
      }
    }
  };
}

/**
 * Get formatted request metadata for logging
 * @param req Express request object
 * @returns Formatted request metadata
 */
export function getRequestMeta(req: Request): Record<string, any> {
  return {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?.id
  };
}