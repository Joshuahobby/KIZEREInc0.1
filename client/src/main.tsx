import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";
import { AuthProvider } from "@/hooks/use-auth";
import { LoadingProvider } from "@/hooks/use-loading-state";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { DirectionProvider } from "@radix-ui/react-direction";
import App from "@/App";
import "./index.css";
import { initMonitoring } from "./lib/monitoring";

// Initialize Monitoring (Sentry & PostHog)
initMonitoring();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <Router>
        <DirectionProvider dir="ltr">
          <LoadingProvider>
            <AuthProvider>
              <App />
              <Toaster />
            </AuthProvider>
          </LoadingProvider>
        </DirectionProvider>
      </Router>
    </QueryClientProvider>
  </HelmetProvider>
);

// Register Service Worker for PWA (Production ONLY to avoid dev caching issues)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
