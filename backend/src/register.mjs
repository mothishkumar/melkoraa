import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const shim = fileURLToPath(new URL("./shims/server-only-empty.cjs", import.meta.url));

const Module = require("node:module");
const original = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === "server-only") {
    return shim;
  }
  return original.call(this, request, parent, isMain, options);
};
