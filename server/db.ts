import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { config, isProd } from "./config";
import { createLogger } from "./utils/logger";

const logger = createLogger("database");

// Configure WebSockets for environments that need them (like session stores)
if (!process.env.VERCEL) {
  neonConfig.webSocketConstructor = ws;
}

if (!config.DATABASE_URL) {
  logger.error('CRITICAL: DATABASE_URL is missing!');
}

// Global pool to prevent multiple connections during dev HMR
declare global {
  var pool: Pool | undefined;
}

// Optimized Connection Pool
// Use globalThis.pool in development to persist across HMR restarts
export const pool = globalThis.pool || new Pool({
  connectionString: config.DATABASE_URL,
  max: isProd ? 20 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

if (!isProd) {
  globalThis.pool = pool;
}

// Connection error handling for the pool
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', { error: err.message });
});

// Single database instance using the pool for transaction support
export const db = drizzle(pool, { schema });

// Log startup
logger.info('Database connection initialized using Pool (WebSocket)');
