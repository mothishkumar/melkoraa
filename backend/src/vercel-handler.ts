import "./register.mjs";

import { createApp } from "./app.js";

const app = createApp();

// Explicit (req, res) handler — @vercel/node compatible without serverless-http.
export default function handler(req: import("express").Request, res: import("express").Response) {
  app(req, res);
}
