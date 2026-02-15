import * as Sentry from "@sentry/node";
import { type Express } from "express";
// Profiling is optional as it may not be available in all environments (e.g. Windows without build tools)
let nodeProfilingIntegration: any = null;
try {
    const profiling = await import("@sentry/profiling-node");
    nodeProfilingIntegration = profiling.nodeProfilingIntegration;
} catch (e) {
    console.warn("[Monitoring] Sentry profiling integration not available.");
}

export async function initMonitoring(app: Express) {
    const SENTRY_DSN = process.env.SENTRY_DSN;

    if (!SENTRY_DSN) {
        console.log("[Monitoring] SENTRY_DSN not found, monitoring disabled.");
        return;
    }

    const integrations: any[] = [];
    if (nodeProfilingIntegration) {
        integrations.push(nodeProfilingIntegration());
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        integrations,
        // Performance Monitoring
        tracesSampleRate: 1.0,
        // Set sampling rate for profiling
        profilesSampleRate: nodeProfilingIntegration ? 1.0 : 0,
        environment: process.env.NODE_ENV || "development",
    });
}

export function initErrorHandlers(app: Express) {
    if (process.env.SENTRY_DSN) {
        // Sentry v8+ way of setting up error tracking for Express
        Sentry.setupExpressErrorHandler(app);
    }
}

export function captureException(error: any, context?: any) {
    if (process.env.SENTRY_DSN) {
        Sentry.captureException(error, { extra: context });
    } else {
        console.error("[Monitoring] Error caught:", error, context);
    }
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = "info" as any) {
    if (process.env.SENTRY_DSN) {
        Sentry.captureMessage(message, level);
    } else {
        console.log(`[Monitoring] ${level.toUpperCase()}:`, message);
    }
}
