import "./register.mjs";

import { createApp } from "./app.js";

// @vercel/node invokes the default export as an Express app directly.
export default createApp();
