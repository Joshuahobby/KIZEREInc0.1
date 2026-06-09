import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle, NeonDatabase } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";
import { config, isProd } from "./config";
import { createLogger } from "./utils/logger";

const logger = createLogger("database");

if (!config.DATABASE_URL) {
  logger.error('CRITICAL: DATABASE_URL is missing!');
}

/**
 * Detect whether DATABASE_URL points to Neon (cloud) or a local postgres.
 * Neon URLs contain 'neon.tech' or a Neon endpoint slug ('ep-').
 * CI / local Docker use localhost/127.0.0.1 and get the standard pg driver,
 * which connects over TCP (no WebSocket required).
 */
const isNeonUrl = (url: string) =>
  url.includes('neon.tech') || url.includes('@ep-');

const useNeon = isNeonUrl(config.DATABASE_URL || '');

// Global pool declaration for HMR persistence in dev
declare global {
  var pool: NeonPool | PgPool | undefined;
}

// Use NeonDatabase<typeof schema> as the canonical type — both adapters expose
// the same query API with the schema-typed `db.tableName` accessors, so this
// cast is safe for all usage patterns in the codebase.
let pool: NeonPool | PgPool;
let db: NeonDatabase<typeof schema>;

if (useNeon) {
  // Neon serverless — WebSocket-based (prod + local dev against Neon cloud)
  if (!process.env.VERCEL) {
    neonConfig.webSocketConstructor = ws;
  }

  const neonPool = (globalThis.pool as NeonPool | undefined) || new NeonPool({
    connectionString: config.DATABASE_URL,
    max: isProd ? 20 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  });

  if (!isProd) globalThis.pool = neonPool;
  neonPool.on('error', (err) => {
    logger.error('Unexpected error on idle Neon client', { error: err.message });
  });

  pool = neonPool;
  db = neonDrizzle(neonPool, { schema });
  logger.info('Database connection initialized using Neon serverless Pool (WebSocket)');
} else {
  // Standard pg — TCP-based (CI with local postgres, local dev with docker)
  const pgPool = (globalThis.pool as PgPool | undefined) || new PgPool({
    connectionString: config.DATABASE_URL,
    max: isProd ? 20 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  });

  if (!isProd) globalThis.pool = pgPool;
  pgPool.on('error', (err) => {
    logger.error('Unexpected error on idle pg client', { error: err.message });
  });

  pool = pgPool;
  // Cast to NeonDatabase shape — drizzle-orm/node-postgres exposes the same
  // schema-typed query interface; the pool type difference is transparent.
  db = pgDrizzle(pgPool, { schema }) as unknown as NeonDatabase<typeof schema>;
  logger.info('Database connection initialized using node-postgres Pool (TCP)');
}

export { pool, db };
