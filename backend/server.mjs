import { createServer } from "node:http";

import handler from "./vercel-handler.js";

const port = Number(process.env.PORT ?? 3000);
createServer(handler).listen(port);
