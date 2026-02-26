import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default("5000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z.string().min(32, "Session secret should be at least 32 characters").optional(),

  // Optional but recommended for production
  FRONTEND_URL: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  VITE_STRIPE_PUBLIC_KEY: z.string().startsWith("pk_").optional(),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
});

const _config = configSchema.safeParse(process.env);

if (!_config.success) {
  console.error("❌ Invalid environment variables:", _config.error.flatten().fieldErrors);
  // DON'T process.exit(1) — let the server start and return useful error messages
  // instead of crashing silently in serverless environments
}

export const config = _config.success ? _config.data : ({
  NODE_ENV: (process.env.NODE_ENV || "development") as "development" | "production" | "test",
  PORT: Number(process.env.PORT || "5000"),
  DATABASE_URL: process.env.DATABASE_URL || "",
  SESSION_SECRET: process.env.SESSION_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL,
} as z.infer<typeof configSchema>);

export const env = config; // Alias for backward compatibility
export const isProd = config.NODE_ENV === "production";
export const isDev = config.NODE_ENV === "development";