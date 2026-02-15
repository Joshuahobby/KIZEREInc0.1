import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
      ? [
        await import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer(),
        ),
      ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("wouter") || id.includes("@tanstack/react-query") || id.includes("react-router")) {
              return "vendor-react";
            }
            if (id.includes("lucide-react") || id.includes("date-fns") || id.includes("clsx") || id.includes("tailwind-merge") || id.includes("uuid")) {
              return "vendor-utils";
            }
            if (id.includes("@radix-ui") || id.includes("framer-motion") || id.includes("vaul") || id.includes("cmdk")) {
              return "vendor-ui";
            }
            if (id.includes("recharts") || id.includes("d3")) {
              return "vendor-charts";
            }
            if (id.includes("firebase")) {
              return "vendor-firebase";
            }
            if (id.includes("tesseract.js") || id.includes("openai") || id.includes("cloudinary") || id.includes("axios")) {
              return "vendor-heavy";
            }
            if (id.includes("leaflet")) {
              return "vendor-maps";
            }
            return "vendor";
          }
        },
      },
    },
  },
});
