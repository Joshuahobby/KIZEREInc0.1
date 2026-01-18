import { app, serverPromise } from "../server/index";

export default async function handler(req: any, res: any) {
  // Wait for the server to be fully initialized
  await serverPromise;
  
  // Hand off the request to the express app
  return app(req, res);
}
