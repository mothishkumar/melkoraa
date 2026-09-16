#!/usr/bin/env node
/**
 * Live production API verification for melkoraa_spa.
 * Reads credentials from env; never prints secret values.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const API = process.env.API_BASE ?? "https://melkoraa-api.vercel.app/api/v1";
const CUSTOMER_EMAIL = process.env.TEST_CUSTOMER_EMAIL;
const CUSTOMER_PASSWORD = process.env.TEST_CUSTOMER_PASSWORD;
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

const REQUIRED = [
  "TEST_CUSTOMER_EMAIL",
  "TEST_CUSTOMER_PASSWORD",
  "TEST_ADMIN_EMAIL",
  "TEST_ADMIN_PASSWORD",
];
for (const name of REQUIRED) {
  console.log(`${name}: ${process.env[name] ? "configured" : "missing"}`);
}
if (REQUIRED.some((n) => !process.env[n])) {
  console.error("STOP: missing required test credentials.");
  process.exit(1);
}

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

class Jar {
  constructor() {
    this.map = new Map();
  }
  ingest(setCookie) {
    if (!setCookie) return;
    const parts = setCookie.split(";")[0];
    const eq = parts.indexOf("=");
    if (eq < 0) return;
    this.map.set(parts.slice(0, eq), parts.slice(eq + 1));
  }
  header() {
    if (!this.map.size) return undefined;
    return [...this.map.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

async function request(jar, path, init = {}, origin) {
  const headers = {
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...init.headers,
  };
  const cookie = jar.header();
  if (cookie) headers.Cookie = cookie;
  if (origin) headers.Origin = origin;

  const res = await fetch(`${API}${path}`, { ...init, headers, redirect: "manual" });
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const c of setCookies) jar.ingest(c);
  const single = res.headers.get("set-cookie");
  if (single && !setCookies.length) jar.ingest(single);

  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json, headers: res.headers };
}

async function login(jar, email, password, origin) {
  const res = await request(
    jar,
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    origin,
  );
  return res;
}

async function main() {
  const outDir = process.env.OUT_DIR ?? "/tmp/melkoraa-live-test";
  mkdirSync(outDir, { recursive: true });

  // --- Unauthenticated ---
  {
    const res = await request(new Jar(), "/auth/me");
    record("unauth /auth/me → 401", res.status === 401, `status=${res.status}`);
  }
  {
    const res = await request(new Jar(), "/admin/dashboard");
    record("unauth /admin/dashboard → 401", res.status === 401, `status=${res.status}`);
  }

  // --- CORS preflight ---
  for (const [label, origin] of [
    ["customer localhost:5173", "http://localhost:5173"],
    ["admin localhost:5174", "http://localhost:5174"],
  ]) {
    const res = await fetch(`${API}/auth/me`, {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    const acao = res.headers.get("access-control-allow-origin");
    const acc = res.headers.get("access-control-allow-credentials");
    record(
      `CORS preflight ${label}`,
      res.status === 204 && acao === origin && acc === "true",
      `status=${res.status} acao=${acao ?? "none"} credentials=${acc ?? "none"}`,
    );
  }

  // --- Customer flow ---
  const customerJar = new Jar();
  const customerOrigin = "http://localhost:5173";
  {
    const loginRes = await login(customerJar, CUSTOMER_EMAIL, CUSTOMER_PASSWORD, customerOrigin);
    record("customer login", loginRes.status === 200, `status=${loginRes.status}`);
    record(
      "customer login sets cookies",
      customerJar.map.size > 0,
      `cookieCount=${customerJar.map.size}`,
    );
  }
  {
    const me = await request(customerJar, "/auth/me", {}, customerOrigin);
    const role = me.json?.data?.role ?? me.json?.role;
    record("customer /auth/me session", me.status === 200, `status=${me.status} role=${role ?? "?"}`);
    writeFileSync(join(outDir, "customer-me.json"), JSON.stringify(me.json, null, 2));
  }
  {
    const me2 = await request(customerJar, "/auth/me");
    record("customer cookies sent without Origin", me2.status === 200, `status=${me2.status}`);
  }

  // Customer → admin forbidden
  {
    const adminTry = await request(customerJar, "/admin/dashboard", {}, "http://localhost:5174");
    record(
      "customer session → admin 401/403",
      adminTry.status === 401 || adminTry.status === 403,
      `status=${adminTry.status}`,
    );
  }

  // Cart flow
  let variantId = null;
  {
    const products = await request(new Jar(), "/products?drop=drop-001&pageSize=1");
    variantId = products.json?.data?.[0]?.variants?.[0]?.id ?? null;
    record("catalog products available", products.status === 200 && Boolean(variantId), `variant=${variantId ? "yes" : "no"}`);
  }
  if (variantId) {
    const add = await request(
      customerJar,
      "/cart/items",
      { method: "POST", body: JSON.stringify({ variantId, quantity: 1 }) },
      customerOrigin,
    );
    record("customer add to cart", add.status === 200, `status=${add.status}`);
    const cart1 = await request(customerJar, "/cart");
    const count1 = cart1.json?.data?.items?.length ?? cart1.json?.items?.length ?? 0;
    record("cart has items after add", count1 > 0, `items=${count1}`);
    writeFileSync(join(outDir, "customer-cart.json"), JSON.stringify(cart1.json, null, 2));

    // Simulate refresh: new jar with same cookies
    const refreshJar = new Jar();
    for (const [k, v] of customerJar.map) refreshJar.map.set(k, v);
    const cart2 = await request(refreshJar, "/cart");
    const count2 = cart2.json?.data?.items?.length ?? cart2.json?.items?.length ?? 0;
    record("cart persists (cookie replay)", count2 > 0, `items=${count2}`);
  }

  {
    const logout = await request(customerJar, "/auth/logout", { method: "POST" }, customerOrigin);
    record("customer logout", logout.status === 200, `status=${logout.status}`);
    const after = await request(customerJar, "/auth/me");
    record("customer session cleared after logout", after.status === 401, `status=${after.status}`);
  }

  // --- Admin flow ---
  const adminJar = new Jar();
  const adminOrigin = "http://localhost:5174";
  {
    const loginRes = await login(adminJar, ADMIN_EMAIL, ADMIN_PASSWORD, adminOrigin);
    record("admin login", loginRes.status === 200, `status=${loginRes.status}`);
    record("admin login sets cookies", adminJar.map.size > 0, `cookieCount=${adminJar.map.size}`);
  }
  {
    const me = await request(adminJar, "/auth/me", {}, adminOrigin);
    const role = me.json?.data?.role ?? me.json?.role;
    record("admin /auth/me session", me.status === 200, `status=${me.status} role=${role ?? "?"}`);
    writeFileSync(join(outDir, "admin-me.json"), JSON.stringify(me.json, null, 2));
  }
  {
    const dash = await request(adminJar, "/admin/dashboard", {}, adminOrigin);
    record("admin /admin/dashboard", dash.status === 200, `status=${dash.status}`);
    writeFileSync(join(outDir, "admin-dashboard.json"), JSON.stringify(dash.json, null, 2));
  }
  for (const mod of ["products", "orders", "customers", "inventory"]) {
    const res = await request(adminJar, `/admin/${mod}?page=1&pageSize=1`, {}, adminOrigin);
    record(`admin /admin/${mod}`, res.status === 200, `status=${res.status}`);
  }
  {
    const logout = await request(adminJar, "/auth/logout", { method: "POST" }, adminOrigin);
    record("admin logout", logout.status === 200, `status=${logout.status}`);
    const after = await request(adminJar, "/auth/me");
    record("admin session cleared after logout", after.status === 401, `status=${after.status}`);
  }

  const failed = results.filter((r) => !r.pass);
  writeFileSync(join(outDir, "results.json"), JSON.stringify(results, null, 2));
  console.log(`\nSummary: ${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
