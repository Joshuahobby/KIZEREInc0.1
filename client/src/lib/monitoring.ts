import * as Sentry from "@sentry/react";
import posthog from 'posthog-js';

export function initMonitoring() {
    const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
    const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
    const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://app.posthog.com";

    if (SENTRY_DSN) {
        Sentry.init({
            dsn: SENTRY_DSN,
            integrations: [
                Sentry.browserTracingIntegration(),
                Sentry.replayIntegration(),
            ],
            // Performance Monitoring
            tracesSampleRate: 1.0,
            // Session Replay
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
            environment: import.meta.env.MODE,
        });
    }

    if (POSTHOG_KEY) {
        posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            autocapture: true,
            capture_pageview: true,
            persistence: 'localStorage'
        });
    }
}

export function captureException(error: any, context?: any) {
    if (import.meta.env.VITE_SENTRY_DSN) {
        Sentry.captureException(error, { extra: context });
    } else {
        console.error("[Monitoring] Error caught:", error, context);
    }
}

export function trackEvent(name: string, properties?: any) {
    if (import.meta.env.VITE_POSTHOG_KEY) {
        posthog.capture(name, properties);
    } else {
        console.log(`[Analytics] Event: ${name}`, properties);
    }
}

export function identifyUser(userId: string, traits?: any) {
    if (import.meta.env.VITE_SENTRY_DSN) {
        Sentry.setUser({ id: userId, ...traits });
    }
    if (import.meta.env.VITE_POSTHOG_KEY) {
        posthog.identify(userId, traits);
    }
}

export function resetUser() {
    if (import.meta.env.VITE_SENTRY_DSN) {
        Sentry.setUser(null);
    }
    if (import.meta.env.VITE_POSTHOG_KEY) {
        posthog.reset();
    }
}
