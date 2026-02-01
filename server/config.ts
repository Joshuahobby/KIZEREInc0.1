import { z } from 'zod';
import { randomBytes } from 'crypto';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Generate a secure session secret if one isn't provided
// This is only used in development and is recreated on each server restart
// In production, a proper SESSION_SECRET env var should be set
const devSessionSecret = randomBytes(32).toString('hex');

// Define and validate the environment schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('5000'),
  DATABASE_URL: z.string().optional(),
  POSTGRES_URL: z.string().optional(),
  SESSION_SECRET: z.string().default(devSessionSecret),
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
});

// Parse and validate environment variables
const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(envResult.error.format(), null, 2));
}

// Export the validated environment object
// Use POSTGRES_URL as a fallback for DATABASE_URL if available
const parsedEnv = envResult.success ? envResult.data : process.env as any;
const finalDatabaseUrl = parsedEnv.DATABASE_URL || parsedEnv.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;

export const env = {
  ...parsedEnv,
  DATABASE_URL: finalDatabaseUrl || ''
};

// Check for missing critical variables
if (!env.DATABASE_URL) {
  console.error('❌ DATABASE_URL or POSTGRES_URL is missing! Database connections will fail.');
}

// Warn about using the auto-generated session secret in production
if (process.env.NODE_ENV === 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === devSessionSecret)) {
  console.warn('⚠️ Warning: Using auto-generated SESSION_SECRET in production is not recommended.');
  console.warn('   Set a proper SESSION_SECRET environment variable.');
}