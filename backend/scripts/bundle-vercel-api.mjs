#!/usr/bin/env node
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
    "@/lib/supabase/server": resolve(backendRoot, "src/shims/supabase-server.ts"),
    "@": sharedSrc,
  },
});

// register.mjs is bundled with its own createRequire; inject one global require shim instead.
const banner =
  "import { createRequire } from 'module'; const require = createRequire(import.meta.url);\n";
let bundle = readFileSync(apiOut, "utf8");
bundle = bundle.replace(
  /import \{ createRequire \} from "node:module";\nimport \{ fileURLToPath \} from "node:url";\nvar require2 = createRequire\(import\.meta\.url\);/,
  'import { fileURLToPath } from "node:url";',
);
bundle = bundle.replace(/\brequire2\b/g, "require");
writeFileSync(apiOut, banner + bundle);

// Only ship the runtime CJS shim — .ts files under api/ become extra Vercel lambdas.
const apiShims = resolve(backendRoot, "api/shims");
rmSync(apiShims, { recursive: true, force: true });
mkdirSync(apiShims, { recursive: true });
cpSync(
  resolve(backendRoot, "src/shims/server-only-empty.cjs"),
  resolve(apiShims, "server-only-empty.cjs"),
);

// Optional Build Output API artifacts for `vercel deploy --prebuilt`.
const funcDir = resolve(backendRoot, ".vercel/output/functions/api/index.func");
rmSync(resolve(backendRoot, ".vercel/output"), { recursive: true, force: true });
mkdirSync(funcDir, { recursive: true });
cpSync(apiOut, resolve(funcDir, "index.js"));
cpSync(apiShims, resolve(funcDir, "shims"), { recursive: true });
cpSync(sharedRoot, resolve(funcDir, ".vercel-shared-src"), { recursive: true });
for (const file of ["package.json", "package-lock.json"]) {
  cpSync(resolve(backendRoot, file), resolve(funcDir, file));
}
if (existsSync(resolve(backendRoot, "vendor"))) {
  cpSync(resolve(backendRoot, "vendor"), resolve(funcDir, "vendor"), { recursive: true });
}
execSync("npm ci --omit=dev --ignore-scripts", { cwd: funcDir, stdio: "inherit" });

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
