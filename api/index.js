import { app, serverPromise } from "../dist/server.js";

export default async function handler(req, res) {
  // Wait for the server to be fully initialized
  await serverPromise;
  
  // Hand off the request to the express app
  return app(req, res);
}
