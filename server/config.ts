import { z } from 'zod';

// Define and validate the environment schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('5000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET should be at least 32 chars').default('kizere-session-secret-this-should-be-changed-in-production'),
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
});

// Parse and validate environment variables
const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(envResult.error.format(), null, 2));
  
  // Only exit in production, allow development to continue with warnings
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid environment variables');
  } else {
    console.warn('⚠️ Continuing with default values where possible...');
  }
}

// Export the validated environment object
export const env = envResult.success ? envResult.data : process.env as any;