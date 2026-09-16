#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import esbuild from "esbuild";

const backendRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const repoRoot = resolve(backendRoot, "..");
const sharedRoot = resolve(backendRoot, ".vercel-shared-src");
const sharedSrc = resolve(sharedRoot, "src");
const apiOut = resolve(backendRoot, "api/index.js");

const monorepoSrc = resolve(repoRoot, "src");
if (!existsSync(monorepoSrc)) {
  if (!existsSync(apiOut)) {
    console.error("Missing monorepo src/ and prebuilt api/index.js");
    process.exit(1);
  }
  console.log("Using prebuilt api/index.js (monorepo src/ unavailable)");
  process.exit(0);
}

rmSync(sharedRoot, { recursive: true, force: true });
mkdirSync(sharedRoot, { recursive: true });
cpSync(monorepoSrc, sharedSrc, { recursive: true });

await esbuild.build({
  entryPoints: [resolve(backendRoot, "src/vercel-handler.ts")],
  outfile: apiOut,
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  packages: "external",
  alias: {
    "@/lib/supabase/server": resolve(backendRoot, "src/shims/supabase-server.ts"),
    "@": sharedSrc,
  },
});

const funcDir = resolve(backendRoot, ".vercel/output/functions/api/index.func");
rmSync(resolve(backendRoot, ".vercel/output"), { recursive: true, force: true });
mkdirSync(funcDir, { recursive: true });
cpSync(apiOut, resolve(funcDir, "index.js"));
if (existsSync(sharedRoot)) {
  cpSync(sharedRoot, resolve(funcDir, ".vercel-shared-src"), { recursive: true });
}
writeFileSync(
  resolve(funcDir, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs20.x",
      handler: "index.js",
      launcherType: "Nodejs",
      maxDuration: 30,
      supportsResponseStreaming: true,
    },
    null,
    2,
  ),
);
writeFileSync(
  resolve(backendRoot, ".vercel/output/config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [{ src: "/(.*)", dest: "/api" }],
    },
    null,
    2,
  ),
);

console.log("Bundled Vercel API handler to api/index.js and .vercel/output");
