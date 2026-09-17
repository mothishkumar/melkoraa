import { config } from "dotenv";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const backend = resolve(import.meta.dirname, "..");

config({ path: resolve(root, ".env.local") });
config({ path: resolve(root, ".env") });
config({ path: resolve(backend, ".env") });
