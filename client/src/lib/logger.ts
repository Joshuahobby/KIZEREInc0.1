/**
 * Centralized logger module
 * 
 * Provides consistent logging across the application with different log levels
 * and context identification.
 */

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Log entry structure
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
}

/**
 * Logger class providing methods for different log levels
 */
class Logger {
  private module: string;

  constructor(module: string) {
    this.module = module;
  }

  /**
   * Create a log entry with the specified level
   */
  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      data: data ? { ...data } : undefined
    };

    // In production, we might want to send logs to a server
    // For now, just use console with appropriate methods
    switch (level) {
      case 'debug':
        console.debug(`[${entry.module}] ${message}`, data || '');
        break;
      case 'info':
        console.info(`[${entry.module}] ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`[${entry.module}] ${message}`, data || '');
        break;
      case 'error':
        console.error(`[${entry.module}] ${message}`, data || '');
        break;
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  /**
   * Log error message
   */
  error(message: string, data?: any): void {
    this.log('error', message, data);
  }
}

/**
 * Create a logger for a specific module
 * 
 * @param module The module name for context
 * @returns Logger instance
 */
export function createLogger(module: string): Logger {
  return new Logger(module);
}