import { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { type Server } from "http";
import { nanoid } from "nanoid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupVite(app: Express, server: Server) {
  const { createServer: createViteServer, createLogger } = await import("vite");
  const viteConfigPath = "../vite.config";
  const viteConfig = (await import(viteConfigPath)).default;
  const viteLogger = createLogger();

  const hmrPort = 5001; // Separate port to avoid conflict with Socket.io
  const serverOptions = {
    middlewareMode: true,
    hmr: {
      port: hmrPort,
      clientPort: hmrPort
    },
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
      },
    },
    server: serverOptions,
    appType: "custom",
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip assets that should be handled by Vite or static middleware
    // This prevents "MIME type text/html" errors for failing asset requests
    if (
      url.startsWith("/api") ||
      url.match(/\.(js|ts|tsx|jsx|css|scss|sass|less|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp4|webm|ogg|mp3|wav|flac|aac)$/) ||
      url.includes("/src/") ||
      url.includes("/node_modules/") ||
      url.includes("@vite") ||
      url.includes("@id") ||
      url.includes("?v=")
    ) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      console.error("[Vite] Error transforming HTML:", e);
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
