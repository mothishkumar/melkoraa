#!/usr/bin/env node
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import esbuild from "esbuild";

const backendRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const repoRoot = resolve(backendRoot, "..");
const sharedRoot = resolve(backendRoot, ".vercel-shared-src");
const sharedSrc = resolve(sharedRoot, "src");
const apiOut = resolve(backendRoot, "api/index.js");

rmSync(sharedRoot, { recursive: true, force: true });
mkdirSync(sharedRoot, { recursive: true });
cpSync(resolve(repoRoot, "src"), sharedSrc, { recursive: true });

await esbuild.build({
  entryPoints: [resolve(backendRoot, "src/vercel-handler.ts")],
  outfile: apiOut,
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  packages: "external",
  alias: {
    "@": sharedSrc,
  },
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});

console.log("Bundled Vercel API handler to api/index.js");
