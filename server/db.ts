import { Pool, neonConfig, neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import ws from "ws";
import * as schema from "@shared/schema";
import { env } from "./config";
import { createLogger } from "./utils/logger";

const logger = createLogger("database");

// Configure WebSockets for environments that need them (like session stores)
neonConfig.webSocketConstructor = ws;

// 1. HTTP Connection for fast, stateless queries (Drizzle)
// This is more stable in serverless environments (Vercel) and latest Node versions
const sql = neon(env.DATABASE_URL);
export const db = drizzle({ client: sql, schema });

// 2. Optimized Connection Pool for persistent needs (like session stores)
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: process.env.NODE_ENV === 'production' ? 20 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  maxUses: 7500,
});

// Connection error handling for the pool
pool.on('error', (err) => {
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
  }, 60000);
}

// Log startup
logger.info('Database connection initialized (HTTP + Pool)');
