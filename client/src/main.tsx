import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";
import { AuthProvider } from "./hooks/use-auth";
import { LoadingProvider } from "./hooks/use-loading-state";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { DirectionProvider } from "@radix-ui/react-direction";
import App from "./App";
import "./index.css";
import { initMonitoring } from "./lib/monitoring";

// Initialize Monitoring (Sentry & PostHog)
initMonitoring();

createRoot(document.getElementById("root")!).render(
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
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
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
