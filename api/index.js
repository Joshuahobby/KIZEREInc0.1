import fs from "fs";
import path from "path";

let app, serverPromise;

async function bootstrap() {
  try {
    const serverPath = path.join(process.cwd(), "dist", "server.js");
    if (!fs.existsSync(serverPath)) {
      throw new Error(`Server file not found at ${serverPath}`);
    }

    const serverModule = await import(serverPath);
    app = serverModule.app;
    serverPromise = serverModule.serverPromise;
  } catch (error) {
    console.error("❌ CRITICAL BOOT ERROR:", error);
    global._bootError = error;
  }
}

const bootPromise = bootstrap();

export default async function handler(req, res) {
  await bootPromise;

  if (global._bootError) {
    return res.status(500).json({
      error: "KIZERE Boot Failure",
      message: "The server failed to initialize. Please check server logs.",
      timestamp: new Date().toISOString()
    });
  }

  if (!app || !serverPromise) {
    return res.status(500).json({
      error: "KIZERE Component Missing",
      message: "Internal server components failed to load."
    });
  }

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Server initialization timeout (15s)")), 15000)
    );

    await Promise.race([serverPromise, timeoutPromise]);
    return app(req, res);
  } catch (error) {
    console.error("❌ Runtime Error:", error);
    res.status(500).json({
      error: "KIZERE Initialization Failed",
      message: "An error occurred during request processing."
    });
  }
}
