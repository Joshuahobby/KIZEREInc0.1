type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Simple logger utility for consistent logging across the application
 * In a production environment, this would be replaced with a more robust solution
 * like Winston or Pino.
 */
class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      context: this.context,
      message,
      ...(meta || {})
    };

    // In production, we might use structured logging and send to a service
    if (process.env.NODE_ENV === 'production') {
      console[level === 'debug' ? 'log' : level](JSON.stringify(logData));
    } else {
      // In development, format for readability
      const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
      console[level === 'debug' ? 'log' : level](`[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}${metaStr}`);
    }
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, any>): void {
    this.log('error', message, meta);
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}

// Default logger
export default createLogger('app');