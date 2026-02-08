import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/use-auth";
import { ThemeProvider } from "next-themes";
import { LoadingProvider } from "./hooks/use-loading-state";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LoadingProvider>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
      </LoadingProvider>
    </ThemeProvider>
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
