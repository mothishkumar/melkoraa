#!/usr/bin/env node
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import esbuild from "esbuild";

const backendRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const repoRoot = resolve(backendRoot, "..");
const sharedRoot = resolve(backendRoot, ".vercel-shared-src");
const sharedSrc = resolve(sharedRoot, "src");
const apiOut = resolve(backendRoot, "api/index.js");
const prebuilt = process.argv.includes("--prebuilt");

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
  packages: "bundle",
  alias: {
    "@/lib/supabase/server": resolve(backendRoot, "src/shims/supabase-server.ts"),
    "@": sharedSrc,
    "server-only": resolve(backendRoot, "src/shims/server-only-empty.cjs"),
    react: resolve(backendRoot, "src/shims/react.ts"),
  },
});

const banner =
  "import { createRequire } from 'module'; const require = createRequire(import.meta.url);\n";
let bundle = readFileSync(apiOut, "utf8");
bundle = bundle.replace(
  /import \{ createRequire \} from "node:module";\nimport \{ fileURLToPath \} from "node:url";\nvar require2 = createRequire\(import\.meta\.url\);/,
  'import { fileURLToPath } from "node:url";',
);
bundle = bundle.replace(/\brequire2\b/g, "require");
writeFileSync(apiOut, banner + bundle);

const apiShims = resolve(backendRoot, "api/shims");
rmSync(apiShims, { recursive: true, force: true });
mkdirSync(apiShims, { recursive: true });
cpSync(
  resolve(backendRoot, "src/shims/server-only-empty.cjs"),
  resolve(apiShims, "server-only-empty.cjs"),
);

if (prebuilt) {
  const funcDir = resolve(backendRoot, ".vercel/output/functions/api/index.func");
  rmSync(resolve(backendRoot, ".vercel/output"), { recursive: true, force: true });
  mkdirSync(funcDir, { recursive: true });
  cpSync(apiOut, resolve(funcDir, "index.js"));
  cpSync(apiShims, resolve(funcDir, "shims"), { recursive: true });
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
    JSON.stringify({ version: 3, routes: [{ src: "/(.*)", dest: "/api" }] }, null, 2),
  );
  console.log("Bundled Vercel API handler to api/index.js and .vercel/output");
} else {
  console.log("Bundled Vercel API handler to api/index.js");
}
