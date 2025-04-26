/**
 * Simple logger utility for server-side logging
 */

export function createLogger(namespace: string) {
  return {
    info: (message: string, data: Record<string, any> = {}) => {
      console.log(`[${new Date().toISOString()}] [INFO] [${namespace}] ${message}`, data);
    },
    warn: (message: string, data: Record<string, any> = {}) => {
      console.warn(`[${new Date().toISOString()}] [WARN] [${namespace}] ${message}`, data);
    },
    error: (message: string, data: Record<string, any> = {}) => {
      console.error(`[${new Date().toISOString()}] [ERROR] [${namespace}] ${message}`, data);
    },
    debug: (message: string, data: Record<string, any> = {}) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[${new Date().toISOString()}] [DEBUG] [${namespace}] ${message}`, data);
      }
    }
  };
}