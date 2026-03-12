
import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist");

  if (!fs.existsSync(distPath)) {
    // If dist/public doesn't exist, try local public as fallback (for dev/local testing)
    const localPublic = path.resolve(process.cwd(), "public");
    if (fs.existsSync(localPublic)) {
      app.use(express.static(localPublic));
    } else {
      log(`Warning: Could not find build directory at ${distPath}`, "express");
    }
  } else {
    app.use(express.static(distPath));
  }

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res, next) => {
    const url = _req.originalUrl;
    // Skip API routes and common asset extensions to avoid incorrect MIME type errors
    if (
      url.startsWith("/api") ||
      url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webmanifest|json)$/)
    ) {
      return next();
    }

    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Fallback for dev environment or missing dist
      const localIndex = path.resolve(process.cwd(), "client", "index.html");
      if (fs.existsSync(localIndex)) {
        res.sendFile(localIndex);
      } else {
        res.status(404).send("Not found");
      }
    }
  });
}
