import { Pool, neonConfig, neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import ws from "ws";
import * as schema from "@shared/schema";
import { config, isProd } from "./config";
import { createLogger } from "./utils/logger";

const logger = createLogger("database");

// Configure WebSockets for environments that need them (like session stores)
// This is critical for the Neon serverless driver to connect over WebSockets.
if (process.env.VERCEL) {
  neonConfig.webSocketConstructor = ws;
}

// 1. HTTP Connection for fast, stateless queries (Drizzle)
if (!config.DATABASE_URL) {
  logger.error('CRITICAL: DATABASE_URL is missing!');
}

let sql: any;
try {
  sql = neon(config.DATABASE_URL);
  logger.info('Neon HTTP client initialized');
} catch (err: any) {
  logger.error('Failed to initialize Neon HTTP client', { error: err.message });
}

export const db = drizzle({ client: sql, schema });

// 2. Optimized Connection Pool for persistent needs (like session stores)
export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: isProd ? 20 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000, // Increased to 15s
  maxUses: 7500,
});

// Connection error handling for the pool
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', { error: err.message });
});

// Log startup
logger.info('Database connection initialized (HTTP + Pool)');
