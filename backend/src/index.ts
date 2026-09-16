import "./load-env.js";

import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 4318);
const app = createApp();

app.listen(port, () => {
  console.log(`MELKORAA API listening on http://localhost:${port}`);
});
