import { app, serverPromise } from "../dist/server.js";

export default async function handler(req, res) {
  try {
    // Set a timeout for server initialization to avoid hanging indefinitely
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Server initialization timeout (15s)")), 15000)
    );

    // Wait for the server to be fully initialized or timeout
    await Promise.race([serverPromise, timeoutPromise]);

    // Hand off the request to the express app
    return app(req, res);
  } catch (error) {
    console.error("Vercel Entry Point Error:", error);
    res.status(500).json({
      error: "KIZERE Server Initialization Failed",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      vercel_env: !!process.env.VERCEL
    });
  }
}
