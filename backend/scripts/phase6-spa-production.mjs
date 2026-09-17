#!/usr/bin/env node
/**
 * Phase 6 — Production customer + admin SPA deployment validation.
 * Never logs credentials, secrets, or cookie values.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { completeRazorpayTestPayment } from "./razorpay-pay-helper.mjs";

const API = process.env.API_BASE ?? "https://melkoraa-api.vercel.app/api/v1";
const API_ORIGIN = "https://melkoraa-api.vercel.app";
const CUSTOMER_ORIGIN = process.env.CUSTOMER_ORIGIN ?? "https://melkoraa-customer.vercel.app";
const ADMIN_ORIGIN = process.env.ADMIN_ORIGIN ?? "https://melkoraa-admin.vercel.app";
const LOCAL_CUSTOMER = "http://localhost:5173";
const LOCAL_ADMIN = "http://localhost:5174";
const MEDIA =
  process.env.MEDIA_DIR ??
  "/opt/cursor/agent-store/project/melkoraa-e8d3d64b-b4e6-4e3e-a7c7-cec4b47d2b69/media";

const CUSTOMER_EMAIL = process.env.TEST_CUSTOMER_EMAIL;
const CUSTOMER_PASSWORD = process.env.TEST_CUSTOMER_PASSWORD;
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

const results = [];
const perf = [];
mkdirSync(MEDIA, { recursive: true });

function record(section, name, pass, detail = "") {
  results.push({ section, name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} [${section}] ${name}${detail ? ` — ${detail}` : ""}`);
}

function recordPerf(label, ms, detail = "") {
  perf.push({ label, ms, detail });
  console.log(`PERF ${label}: ${ms}ms${detail ? ` — ${detail}` : ""}`);
}

function parseSetCookieFlags(setCookieHeader) {
  if (!setCookieHeader) return {};
  const lower = setCookieHeader.toLowerCase();
  return {
    httpOnly: lower.includes("httponly"),
    secure: lower.includes("secure"),
    sameSite: lower.match(/samesite=([^;]+)/)?.[1]?.trim() ?? null,
  };
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

async function apiJarRequest(jar, path, init = {}, origin) {
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
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 120) };
  }
  return { status: res.status, json, headers: res.headers, setCookies };
}

async function corsCheck(origin, label) {
  const preflight = await fetch(`${API}/auth/me`, {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  const acao = preflight.headers.get("access-control-allow-origin");
  const acac = preflight.headers.get("access-control-allow-credentials");
  record("CORS", `${label} preflight`, preflight.status === 204 || preflight.status === 200, `status=${preflight.status}`);
  record("CORS", `${label} no wildcard`, acao !== "*", `acao=${acao ?? "missing"}`);
  record("CORS", `${label} credentials`, acac === "true", `acac=${acac ?? "missing"}`);
  record("CORS", `${label} origin echoed`, acao === origin, `acao=${acao ?? "missing"}`);
}

async function runEnvAudit() {
  const keys = [
    "VERCEL_TOKEN",
    "TEST_CUSTOMER_EMAIL",
    "TEST_CUSTOMER_PASSWORD",
    "TEST_ADMIN_EMAIL",
    "TEST_ADMIN_PASSWORD",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
  ];
  for (const k of keys) {
    record("Env", k, Boolean(process.env[k]), process.env[k] ? "configured" : "missing");
  }
  record("Deploy", "customer SPA URL", CUSTOMER_ORIGIN.startsWith("https://"), CUSTOMER_ORIGIN);
  record("Deploy", "admin SPA URL", ADMIN_ORIGIN.startsWith("https://"), ADMIN_ORIGIN);
  record("Deploy", "API URL", API.includes("melkoraa-api.vercel.app"), API);
}

async function runCorsMatrix() {
  await corsCheck(CUSTOMER_ORIGIN, "production customer");
  await corsCheck(ADMIN_ORIGIN, "production admin");
  await corsCheck(LOCAL_CUSTOMER, "localhost:5173");
  await corsCheck(LOCAL_ADMIN, "localhost:5174");
}

async function runAdminIsolation() {
  const customerOnAdmin = await fetch(`${ADMIN_ORIGIN}/`, { redirect: "manual" });
  record("Isolation", "admin SPA reachable (separate origin)", customerOnAdmin.status === 200, `status=${customerOnAdmin.status}`);

  const customerJar = new Jar();
  await apiJarRequest(
    customerJar,
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD }) },
    CUSTOMER_ORIGIN,
  );
  const blocked = await apiJarRequest(customerJar, "/admin/dashboard", {}, CUSTOMER_ORIGIN);
  record("Isolation", "customer session blocked on admin API", blocked.status === 403, `status=${blocked.status}`);
}

async function clearCustomerCart(origin = CUSTOMER_ORIGIN) {
  const jar = new Jar();
  await apiJarRequest(
    jar,
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD }) },
    origin,
  );
  const cart = await apiJarRequest(jar, "/cart", {}, origin);
  for (const item of cart.json?.data?.items ?? []) {
    await apiJarRequest(jar, `/cart/items/${item.variantId}`, { method: "DELETE" }, origin);
  }
}

async function runCustomerAuthBrowser(browser) {
  const section = "Customer auth";
  const context = await browser.newContext();
  const page = await context.newPage();
  let loginSetCookie = null;

  page.on("response", async (res) => {
    if (res.url().includes("/api/v1/auth/login") && res.request().method() === "POST") {
      loginSetCookie = res.headers()["set-cookie"] ?? res.headers()["Set-Cookie"] ?? null;
    }
  });

  await page.goto(`${CUSTOMER_ORIGIN}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', CUSTOMER_EMAIL);
  await page.fill('input[type="password"]', CUSTOMER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });

  const cookies = await context.cookies(API_ORIGIN);
  const authCookie = cookies.find((c) => c.name.includes("auth-token"));
  record(section, "auth cookie stored for API domain", Boolean(authCookie), authCookie ? "present" : "missing");

  const flags = parseSetCookieFlags(loginSetCookie);
  record(section, "httpOnly", flags.httpOnly === true || authCookie?.httpOnly === true, "httponly");
  record(section, "Secure", flags.secure === true || authCookie?.secure === true, "secure");
  record(
    section,
    "SameSite=None",
    flags.sameSite?.toLowerCase() === "none" || authCookie?.sameSite === "None",
    authCookie?.sameSite ?? flags.sameSite ?? "missing",
  );

  const me = await page.evaluate(async (apiBase) => {
    const r = await fetch(`${apiBase}/auth/me`, { credentials: "include" });
    return r.status;
  }, API);
  record(section, "cookie sent on /auth/me", me === 200, `status=${me}`);

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const meAfter = await page.evaluate(async (apiBase) => {
    const r = await fetch(`${apiBase}/auth/me`, { credentials: "include" });
    return r.status;
  }, API);
  record(section, "session persists after refresh", meAfter === 200, `status=${meAfter}`);

  await page.screenshot({ path: join(MEDIA, "phase6-customer-logged-in.png"), fullPage: true });

  const logoutBtn = page.locator('button:has-text("Logout")');
  if (await logoutBtn.count()) await logoutBtn.first().click();
  await page.waitForTimeout(2000);
  const meOut = await page.evaluate(async (apiBase) => {
    const r = await fetch(`${apiBase}/auth/me`, { credentials: "include" });
    return r.status;
  }, API);
  record(section, "logout clears session", meOut === 401, `status=${meOut}`);
  await context.close();
}

async function runCustomerFlowBrowser(browser) {
  const section = "Customer E2E";
  await clearCustomerCart();
  const context = await browser.newContext();
  const page = await context.newPage();

  const t0 = Date.now();
  await page.goto(CUSTOMER_ORIGIN, { waitUntil: "networkidle" });
  recordPerf("customer home TTFB+load", Date.now() - t0);

  const scrollLocked = await page.evaluate(() => document.documentElement.dataset.introLock === "1");
  record(section, "home intro scroll lock active", scrollLocked, scrollLocked ? "locked" : "unlocked");
  await page.screenshot({ path: join(MEDIA, "phase6-customer-home-intro.png"), fullPage: true });

  const shopBtn = page.locator('button:has-text("Shop")').first();
  if (await shopBtn.count()) {
    await shopBtn.click();
    await page.waitForURL(/drop-001/, { timeout: 10000 });
  }
  const unlocked = await page.evaluate(() => document.documentElement.dataset.introLock !== "1");
  record(section, "intro unlock navigates to drop", page.url().includes("/drop-001"), `url=${page.url()}`);
  record(section, "scroll lock released", unlocked, unlocked ? "unlocked" : "still locked");

  await page.goto(`${CUSTOMER_ORIGIN}/drop-001`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const browseBody = await page.textContent("body");
  record(section, "drop 01 browse page loads", browseBody && browseBody.length > 100, "drop-001");

  const urlBeforeAdd = page.url();
  const addBtn = page.locator('button:has-text("Add to bag"):not([disabled])').first();
  record(section, "add-to-bag control present", (await addBtn.count()) > 0, "drop-001");
  if (await addBtn.count()) {
    await addBtn.click();
    const confirm = page.locator('button:has-text("Confirm size")');
    if (await confirm.count()) await confirm.first().click();
    await page.waitForTimeout(2500);
  }
  record(section, "add-to-bag no detail redirect", page.url() === urlBeforeAdd, `url=${page.url()}`);
  await page.screenshot({ path: join(MEDIA, "phase6-customer-drop-add.png"), fullPage: true });

  await page.goto(`${CUSTOMER_ORIGIN}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', CUSTOMER_EMAIL);
  await page.fill('input[type="password"]', CUSTOMER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });

  await page.goto(`${CUSTOMER_ORIGIN}/cart`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  let cartBody = await page.textContent("body");
  const hasItems = cartBody && !/YOUR CART IS EMPTY/i.test(cartBody) && !/Sign in to load your bag/i.test(cartBody);
  record(section, "bag shows items", hasItems, hasItems ? "items" : "empty");
  await page.screenshot({ path: join(MEDIA, "phase6-customer-cart.png"), fullPage: true });

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  cartBody = await page.textContent("body");
  record(section, "cart persists after refresh", cartBody && !/YOUR CART IS EMPTY/i.test(cartBody), "refreshed");

  const meRefresh = await page.evaluate(async (apiBase) => {
    const r = await fetch(`${apiBase}/auth/me`, { credentials: "include" });
    return r.status;
  }, API);
  record(section, "session refresh on cart page", meRefresh === 200, `status=${meRefresh}`);

  await page.goto(`${CUSTOMER_ORIGIN}/checkout`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  const checkoutBody = await page.textContent("body");
  record(
    section,
    "checkout not empty bag",
    checkoutBody && !/Your bag is empty/i.test(checkoutBody) && checkoutBody.includes("Checkout"),
    "checkout loaded",
  );
  await page.screenshot({ path: join(MEDIA, "phase6-customer-checkout.png"), fullPage: true });

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  const checkoutRefresh = await page.textContent("body");
  record(
    section,
    "checkout refresh keeps bag",
    checkoutRefresh && !/Your bag is empty/i.test(checkoutRefresh),
    "refreshed checkout",
  );

  const addressRadio = page.locator('input[name="address"]').first();
  if (await addressRadio.count()) await addressRadio.check();
  await page.click('button:has-text("Pay")');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: join(MEDIA, "phase6-razorpay-modal.png"), fullPage: true });

  let verifyStatus = null;
  page.on("response", (res) => {
    if (res.url().includes("/payments/verify")) verifyStatus = res.status();
  });

  await completeRazorpayTestPayment(page);
  await page.waitForTimeout(3000);
  const onOrder = page.url().includes("/order/");
  const orderBody = await page.textContent("body");
  record(section, "Razorpay test payment completes", onOrder, `url=${page.url()}`);
  record(
    section,
    "order confirmation/history visible",
    onOrder && orderBody && (orderBody.includes("ORDER") || orderBody.includes("paid") || orderBody.includes("placed")),
    "order page",
  );
  record(section, "payments/verify succeeded", verifyStatus === 200, `status=${verifyStatus ?? "missing"}`);
  await page.screenshot({ path: join(MEDIA, "phase6-order-confirmed.png"), fullPage: true });

  const orderId = page.url().split("/order/")[1]?.split(/[?#]/)[0] ?? "";
  if (orderId) {
    await page.goto(`${CUSTOMER_ORIGIN}/order/${orderId}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    const historyBody = await page.textContent("body");
    record(section, "order history page reloads", historyBody && historyBody.length > 50, `order=${orderId}`);
    await page.screenshot({ path: join(MEDIA, "phase6-order-history.png"), fullPage: true });
  }

  const logoutBtn = page.locator('button:has-text("Logout")');
  if (await logoutBtn.count()) await logoutBtn.first().click();
  await page.waitForTimeout(2000);
  const meOut = await page.evaluate(async (apiBase) => {
    const r = await fetch(`${apiBase}/auth/me`, { credentials: "include" });
    return r.status;
  }, API);
  record(section, "logout after purchase", meOut === 401, `status=${meOut}`);

  await context.close();
}

async function runAdminBrowser(browser) {
  const section = "Admin E2E";
  const context = await browser.newContext();
  const page = await context.newPage();
  const apiHits = [];

  page.on("request", (req) => {
    if (req.url().includes("/api/v1/admin")) apiHits.push(req.url());
  });

  const t0 = Date.now();
  await page.goto(`${ADMIN_ORIGIN}/login`, { waitUntil: "networkidle" });
  recordPerf("admin login page load", Date.now() - t0);

  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  record(section, "login reaches dashboard", !page.url().includes("/login"), `url=${page.url()}`);
  await page.screenshot({ path: join(MEDIA, "phase6-admin-dashboard.png"), fullPage: true });

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  record(section, "session persists after refresh", !page.url().includes("/login"), `url=${page.url()}`);

  const pages = [
    { path: "/", keyword: "dashboard", label: "dashboard" },
    { path: "/products", keyword: "product", label: "products" },
    { path: "/categories", keyword: "categor", label: "categories" },
    { path: "/inventory", keyword: "inventor", label: "inventory" },
    { path: "/orders", keyword: "order", label: "orders" },
    { path: "/customers", keyword: "customer", label: "customers" },
    { path: "/payments", keyword: "payment", label: "payments" },
    { path: "/drops", keyword: "drop", label: "drops" },
    { path: "/collections", keyword: "collection", label: "collections" },
    { path: "/audit-logs", keyword: "audit", label: "audit logs" },
  ];

  for (const p of pages) {
    const start = Date.now();
    await page.goto(`${ADMIN_ORIGIN}${p.path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    const body = (await page.textContent("body"))?.toLowerCase() ?? "";
    record(section, `${p.label} page loads`, body.includes(p.keyword), `${Date.now() - start}ms`);
  }

  await page.goto(`${ADMIN_ORIGIN}/categories`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const newBtn = page.locator('button:has-text("New category")');
  if (await newBtn.count()) {
    await newBtn.first().click();
    await page.waitForTimeout(1000);
    const slug = `phase6-${Date.now()}`;
    await page.fill('input[name="name"]', `Phase6 ${slug}`);
    await page.fill('input[name="slug"]', slug);
    const save = page.locator('button[type="submit"]:has-text("Save"), button:has-text("Create")');
    if (await save.count()) {
      await save.first().click();
      await page.waitForTimeout(3000);
      const body = await page.textContent("body");
      record(section, "category CRUD create", body?.includes(slug) ?? false, slug);
    }
  }

  await page.goto(`${ADMIN_ORIGIN}/products`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const productLink = page.locator('a[href*="/products/"]').first();
  if (await productLink.count()) {
    await productLink.click();
    await page.waitForTimeout(2500);
    const detail = await page.textContent("body");
    record(section, "product detail CRUD view", detail && detail.toLowerCase().includes("product"), "detail");
  }

  record(section, "admin API requests observed", apiHits.length > 0, `hits=${apiHits.length}`);

  const signOut = page.locator('button:has-text("Sign out"), button:has-text("Logout")');
  if (await signOut.count()) {
    await signOut.first().click();
    await page.waitForTimeout(2000);
  }
  record(section, "logout redirects to login", page.url().includes("/login"), `url=${page.url()}`);

  await context.close();
}

async function runCustomerCannotUseAdmin(browser) {
  const section = "Customer admin block";
  const page = await browser.newPage();
  await page.goto(`${ADMIN_ORIGIN}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', CUSTOMER_EMAIL);
  await page.fill('input[type="password"]', CUSTOMER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  const body = await page.textContent("body");
  const blocked =
    page.url().includes("/unauthorized") ||
    page.url().includes("/login") ||
    /unauthorized|access denied|staff/i.test(body ?? "");
  record(section, "customer credentials rejected on admin SPA", blocked, `url=${page.url()}`);
  await page.close();
}

async function runPerformanceAudit() {
  const section = "Performance";
  const customerHtml = await fetch(CUSTOMER_ORIGIN).then((r) => r.text());
  const jsMatch = customerHtml.match(/assets\/index-[^"]+\.js/);
  if (jsMatch) {
    const t0 = Date.now();
    const js = await fetch(`${CUSTOMER_ORIGIN}/${jsMatch[0]}`);
    const buf = await js.arrayBuffer();
    const kb = Math.round(buf.byteLength / 1024);
    recordPerf("customer main JS download", Date.now() - t0, `${kb}KB`);
    record(section, "customer main bundle >500KB (bottleneck)", kb > 500, `${kb}KB — consider code-splitting`);
  }

  const apiT0 = Date.now();
  const health = await fetch(`${API}/health`);
  const apiMs = Date.now() - apiT0;
  recordPerf("API /health round-trip", apiMs);
  record(section, "API health latency <2s", health.status === 200 && apiMs < 2000, `status=${health.status} ${apiMs}ms`);

  const catalogT0 = Date.now();
  const products = await fetch(`${API}/products?drop=drop-001&pageSize=4`);
  const catalogMs = Date.now() - catalogT0;
  recordPerf("API catalog (drop-001)", catalogMs, `status=${products.status}`);
  record(section, "catalog API latency <3s", products.status === 200 && catalogMs < 3000, `${catalogMs}ms`);
}

async function main() {
  if (!CUSTOMER_EMAIL || !CUSTOMER_PASSWORD || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("STOP: missing TEST_CUSTOMER_* or TEST_ADMIN_* credentials");
    process.exit(1);
  }

  await runEnvAudit();
  await runCorsMatrix();
  await runAdminIsolation();

  const browser = await chromium.launch({ headless: true });
  try {
    await runCustomerAuthBrowser(browser);
    await runCustomerFlowBrowser(browser);
    await runAdminBrowser(browser);
    await runCustomerCannotUseAdmin(browser);
  } finally {
    await browser.close();
  }

  await runPerformanceAudit();

  writeFileSync(join(MEDIA, "phase6-results.json"), JSON.stringify({ results, perf }, null, 2));

  const failed = results.filter((r) => !r.pass);
  const bySection = {};
  for (const r of results) {
    bySection[r.section] ??= { pass: 0, fail: 0 };
    if (r.pass) bySection[r.section].pass++;
    else bySection[r.section].fail++;
  }
  console.log("\n--- Phase 6 summary ---");
  for (const [section, counts] of Object.entries(bySection)) {
    console.log(`${section}: ${counts.pass}/${counts.pass + counts.fail}`);
  }
  console.log(`Total: ${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
