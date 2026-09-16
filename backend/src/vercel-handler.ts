import "./register.mjs";

import { createApp } from "./app.js";

const app = createApp();

// Explicit handler for @vercel/node; default Express export hung on Build Output API.
export default function handler(req: import("express").Request, res: import("express").Response) {
  app(req, res);
}
