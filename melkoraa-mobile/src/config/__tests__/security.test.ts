import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../../..");
const SOURCE_DIRS = ["app", "src"];
const FORBIDDEN_PATTERNS = [
  /SUPABASE_SERVICE_ROLE/i,
  /service_role/i,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./,
  /\b192\.168\.\d{1,3}\.\d{1,3}\b/,
  /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
];

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === "__tests__") continue;
      files.push(...collectSourceFiles(fullPath));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("mobile security scan", () => {
  it("does not embed secrets, service-role keys, or private IPs in source", () => {
    const offenders: string[] = [];

    for (const sourceDir of SOURCE_DIRS) {
      const absoluteDir = path.join(ROOT, sourceDir);
      for (const file of collectSourceFiles(absoluteDir)) {
        const content = readFileSync(file, "utf8");
        for (const pattern of FORBIDDEN_PATTERNS) {
          if (pattern.test(content)) {
            offenders.push(path.relative(ROOT, file));
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
