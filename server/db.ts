import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { env } from "./config";
import { createLogger } from "./utils/logger";

const logger = createLogger("database");

neonConfig.webSocketConstructor = ws;

// Optimized connection pool configuration
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: process.env.NODE_ENV === 'production' ? 20 : 10, // More connections for production
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 5000, // 5 seconds to establish a connection
  maxUses: 7500, // Close connections after 7500 queries to prevent memory issues
});

// Connection error handling
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', { error: err.message });
});

// Connection pool monitoring in production
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    logger.info('DB pool status', {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    });
  }, 60000); // Log every minute
}

export const db = drizzle({ client: pool, schema });

// Log startup
logger.info('Database connection initialized');
