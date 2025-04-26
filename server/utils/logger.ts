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
        console.debug(`[${new Date().toISOString()}] [DEBUG] [${moduleName}]`, message, meta || '');
      }
    },
    
    info: (message: string, meta?: any) => {
      console.info(`[${new Date().toISOString()}] [INFO] [${moduleName}]`, message, meta || '');
    },
    
    warn: (message: string, meta?: any) => {
      console.warn(`[${new Date().toISOString()}] [WARN] [${moduleName}]`, message, meta || '');
    },
    
    error: (message: string, meta?: any) => {
      console.error(`[${new Date().toISOString()}] [ERROR] [${moduleName}]`, message, meta || '');
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