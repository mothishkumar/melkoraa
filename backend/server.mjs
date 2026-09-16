import { createServer } from "node:http";

import handler from "./api/index.js";

const port = Number(process.env.PORT ?? 3000);
createServer(handler).listen(port);
