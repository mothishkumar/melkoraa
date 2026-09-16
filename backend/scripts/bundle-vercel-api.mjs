#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import esbuild from "esbuild";

const backendRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const repoRoot = resolve(backendRoot, "..");
const sharedRoot = resolve(backendRoot, ".vercel-shared-src");
const sharedSrc = resolve(sharedRoot, "src");
const apiOut = resolve(backendRoot, "api/index.js");
const monorepoSrc = resolve(repoRoot, "src");

rmSync(sharedRoot, { recursive: true, force: true });
mkdirSync(sharedRoot, { recursive: true });
cpSync(monorepoSrc, sharedSrc, { recursive: true });

await esbuild.build({
  entryPoints: [resolve(backendRoot, "src/vercel-handler.ts")],
  outfile: apiOut,
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  packages: "external",
  alias: {
    "@/lib/supabase/server": resolve(backendRoot, "src/shims/supabase-server.ts"),
    "@": sharedSrc,
  },
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});

console.log("Bundled Vercel API handler to api/index.js");
