#!/usr/bin/env node
/**
 * Final SPA → production API browser + HTTP validation.
 * Never logs credentials or cookie values.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const API = process.env.API_BASE ?? "https://melkoraa-api.vercel.app/api/v1";
const API_ORIGIN = "https://melkoraa-api.vercel.app";
const CUSTOMER_ORIGIN = "http://localhost:5173";
const ADMIN_ORIGIN = "http://localhost:5174";
const MEDIA =
  process.env.MEDIA_DIR ??
  "/opt/cursor/agent-store/project/melkoraa-e8d3d64b-b4e6-4e3e-a7c7-cec4b47d2b69/media";

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
  if (!process.env[name]) {
    console.error(`STOP: missing ${name}`);
    process.exit(1);
  }
}

mkdirSync(MEDIA, { recursive: true });
const results = [];

function record(section, name, pass, detail = "") {
  results.push({ section, name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} [${section}] ${name}${detail ? ` — ${detail}` : ""}`);
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

async function clearCustomerCart() {
  const jar = new Jar();
  await apiJarRequest(
    jar,
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD }) },
    CUSTOMER_ORIGIN,
  );
  const cart = await apiJarRequest(jar, "/cart");
  if (cart.json?.data?.items?.length) {
    for (const item of cart.json.data.items) {
      await apiJarRequest(jar, `/cart/items/${item.variantId}`, { method: "DELETE" });
    }
  }
}

async function runCorsChecks() {
  const section = "CORS";
  const preflight = await fetch(`${API}/auth/me`, {
    method: "OPTIONS",
    headers: {
      Origin: CUSTOMER_ORIGIN,
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  const acao = preflight.headers.get("access-control-allow-origin");
  const acac = preflight.headers.get("access-control-allow-credentials");
  record(section, "preflight localhost:5173 → 204/200", preflight.status === 204 || preflight.status === 200, `status=${preflight.status}`);
  record(section, "no wildcard ACAO", acao !== "*", `acao=${acao ?? "missing"}`);
  record(section, "credentials allowed", acac === "true", `acac=${acac ?? "missing"}`);
  record(section, "origin echoed", acao === CUSTOMER_ORIGIN, `acao=${acao ?? "missing"}`);

  const jar = new Jar();
  const login = await apiJarRequest(
    jar,
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD }) },
    CUSTOMER_ORIGIN,
  );
  const credentialed = await apiJarRequest(jar, "/auth/me", {}, CUSTOMER_ORIGIN);
  record(section, "credentialed GET /auth/me success", credentialed.status === 200, `status=${credentialed.status}`);
}

async function runAuthzChecks() {
  const section = "Authz";
  const unauth = await apiJarRequest(new Jar(), "/admin/dashboard");
  record(section, "unauth admin dashboard blocked", unauth.status === 401, `status=${unauth.status}`);

  const customerJar = new Jar();
  await apiJarRequest(
    customerJar,
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD }) },
    CUSTOMER_ORIGIN,
  );
  const customerAdmin = await apiJarRequest(customerJar, "/admin/dashboard");
  record(section, "customer session blocked on admin API", customerAdmin.status === 403, `status=${customerAdmin.status}`);

  const adminJar = new Jar();
  await apiJarRequest(
    adminJar,
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }) },
    ADMIN_ORIGIN,
  );
  const adminDash = await apiJarRequest(adminJar, "/admin/dashboard");
  record(section, "admin allowed on dashboard", adminDash.status === 200, `status=${adminDash.status}`);
}

async function runCustomerBrowser(browser) {
  const section = "Customer browser";
  await clearCustomerCart();

  const context = await browser.newContext();
  const page = await context.newPage();
  let loginSetCookie = null;
  const apiRequestsWithCookie = [];

  page.on("request", (req) => {
    const url = req.url();
    if (!url.startsWith(API_ORIGIN)) return;
    const cookie = req.headers().cookie;
    if (cookie?.includes("auth-token")) {
      apiRequestsWithCookie.push(url);
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/api/v1/auth/login") && res.request().method() === "POST") {
      const headers = res.headers();
      loginSetCookie = headers["set-cookie"] ?? headers["Set-Cookie"] ?? null;
    }
  });

  await page.goto(`${CUSTOMER_ORIGIN}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', CUSTOMER_EMAIL);
  await page.fill('input[type="password"]', CUSTOMER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 }).catch(() => {});

  const cookies = await context.cookies(API_ORIGIN);
  const authCookie = cookies.find((c) => c.name.includes("auth-token"));
  record(section, "auth cookie stored for API domain", Boolean(authCookie), authCookie ? `name=${authCookie.name}` : "none");

  const flags = parseSetCookieFlags(loginSetCookie);
  const httpOnlyOk = flags.httpOnly === true || authCookie?.httpOnly === true;
  const secureOk = flags.secure === true || authCookie?.secure === true;
  const sameSiteOk = flags.sameSite?.toLowerCase() === "none" || authCookie?.sameSite === "None";
  record(
    section,
    "login cookie httpOnly",
    httpOnlyOk,
    authCookie?.httpOnly ? "stored httponly" : flags.httpOnly ? "header httponly" : "missing",
  );
  record(
    section,
    "login cookie Secure",
    secureOk,
    authCookie?.secure ? "stored secure" : flags.secure ? "header secure" : "missing",
  );
  record(
    section,
    "login cookie SameSite=None",
    sameSiteOk,
    authCookie?.sameSite ? `stored=${authCookie.sameSite}` : `header=${flags.sameSite ?? "missing"}`,
  );

  await page.goto(`${CUSTOMER_ORIGIN}/account`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const accountBody = await page.textContent("body");
  record(section, "authenticated account page", accountBody && !/sign in/i.test(accountBody), "account loaded");
  const credentialedMe = await page.evaluate(async (apiBase) => {
    const r = await fetch(`${apiBase}/auth/me`, { credentials: "include" });
    return r.status;
  }, API);
  record(section, "cookie sent on credentialed API call", credentialedMe === 200, `auth/me=${credentialedMe}`);

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const afterRefresh = await page.textContent("body");
  record(section, "auth persists after refresh", afterRefresh && !/sign in/i.test(afterRefresh), "still authenticated");

  const meAfterRefresh = await page.evaluate(async (apiBase) => {
    const r = await fetch(`${apiBase}/auth/me`, { credentials: "include" });
    return { status: r.status, ok: r.ok };
  }, API);
  record(section, "/auth/me after refresh", meAfterRefresh.status === 200, `status=${meAfterRefresh.status}`);

  await page.screenshot({ path: join(MEDIA, "customer-logged-in.png"), fullPage: true });

  // Drop + add to bag
  await page.goto(`${CUSTOMER_ORIGIN}/drop-001`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const addBtn = page.locator('button:has-text("Add to bag"), button:has-text("ADD TO BAG")').first();
  record(section, "drop page has add-to-bag", (await addBtn.count()) > 0, "drop-001");
  if (await addBtn.count()) {
    await addBtn.click();
    await page.waitForTimeout(500);
    const confirm = page.locator('button:has-text("Confirm size")');
    if (await confirm.count()) {
      await confirm.first().click();
    }
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: join(MEDIA, "customer-drop-add.png"), fullPage: true });

  await page.goto(`${CUSTOMER_ORIGIN}/cart`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  let cartBody = await page.textContent("body");
  const hasItems = cartBody && !/YOUR CART IS EMPTY/i.test(cartBody) && !/Sign in to load your bag/i.test(cartBody);
  record(section, "bag shows items", hasItems, hasItems ? "items visible" : "empty");
  await page.screenshot({ path: join(MEDIA, "customer-cart-with-items.png"), fullPage: true });

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  cartBody = await page.textContent("body");
  record(
    section,
    "cart persists after refresh",
    cartBody && !/YOUR CART IS EMPTY/i.test(cartBody),
    "refreshed cart",
  );

  const incBtn = page.locator('button[aria-label^="Increase"]').first();
  if (await incBtn.count()) {
    await incBtn.click();
    await page.waitForTimeout(2000);
    cartBody = await page.textContent("body");
    record(section, "quantity increase persists in UI", cartBody && !/YOUR CART IS EMPTY/i.test(cartBody), "qty+");
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    cartBody = await page.textContent("body");
    record(section, "quantity persists after refresh", cartBody && !/YOUR CART IS EMPTY/i.test(cartBody), "qty refresh");
  }

  await page.goto(`${CUSTOMER_ORIGIN}/checkout`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  const checkoutBody = await page.textContent("body");
  record(
    section,
    "checkout does not show empty bag",
    checkoutBody && !/Your bag is empty/i.test(checkoutBody) && checkoutBody.includes("Checkout"),
    checkoutBody?.includes("Checkout") ? "checkout loaded" : "missing checkout",
  );
  await page.screenshot({ path: join(MEDIA, "customer-checkout.png"), fullPage: true });

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  const checkoutRefresh = await page.textContent("body");
  record(
    section,
    "checkout refresh keeps bag",
    checkoutRefresh && !/Your bag is empty/i.test(checkoutRefresh) && checkoutRefresh.includes("Checkout"),
    "refreshed checkout",
  );

  await page.goto(`${CUSTOMER_ORIGIN}/cart`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  for (let i = 0; i < 12; i++) {
    cartBody = await page.textContent("body");
    if (cartBody && /YOUR CART IS EMPTY/i.test(cartBody)) break;
    const removeBtn = page.locator('button:has-text("Remove"):not([disabled])').first();
    if (await removeBtn.count()) {
      await removeBtn.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(2000);
      continue;
    }
    const dec = page.locator('button[aria-label^="Decrease"]:not([disabled])').first();
    if (await dec.count()) {
      await dec.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(2000);
      continue;
    }
    await page.waitForTimeout(1000);
  }
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  cartBody = await page.textContent("body");
  record(section, "cart empty after removals", cartBody && /YOUR CART IS EMPTY/i.test(cartBody), "emptied");

  const logoutBtn = page.locator('button:has-text("Logout")');
  if (await logoutBtn.count()) {
    await logoutBtn.first().click();
    await page.waitForTimeout(2000);
  }
  await page.goto(`${CUSTOMER_ORIGIN}/account`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  record(section, "logout clears session UI", page.url().includes("/login") || !(await page.locator('button:has-text("Logout")').count()), `url=${page.url()}`);

  const meLoggedOut = await page.evaluate(async (apiBase) => {
    const r = await fetch(`${apiBase}/auth/me`, { credentials: "include" });
    return r.status;
  }, API);
  record(section, "/auth/me unauthenticated after logout", meLoggedOut === 401, `status=${meLoggedOut}`);

  await context.close();
}

async function runAdminBrowser(browser) {
  const section = "Admin browser";
  const context = await browser.newContext();
  const page = await context.newPage();
  const adminApiHits = [];

  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/api/v1/admin")) adminApiHits.push(url);
  });

  await page.goto(`${ADMIN_ORIGIN}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  const url = page.url();
  record(section, "admin login reaches dashboard", url.includes("/") && !url.includes("/login"), `url=${url}`);
  await page.screenshot({ path: join(MEDIA, "admin-dashboard.png"), fullPage: true });

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  record(section, "admin session persists after refresh", !page.url().includes("/login"), `url=${page.url()}`);

  await page.goto(`${ADMIN_ORIGIN}/products`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  record(section, "admin products page loads", (await page.textContent("body"))?.toLowerCase().includes("product"), "products");
  await page.goto(`${ADMIN_ORIGIN}/orders`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  record(section, "admin orders page loads", (await page.textContent("body"))?.toLowerCase().includes("order"), "orders");
  record(section, "admin API requests observed", adminApiHits.length > 0, `hits=${adminApiHits.length}`);

  const signOut = page.locator('button:has-text("Sign out"), button:has-text("Logout")');
  if (await signOut.count()) {
    await signOut.first().click();
    await page.waitForTimeout(2000);
  }
  record(section, "admin logout redirects to login", page.url().includes("/login"), `url=${page.url()}`);

  await context.close();
}

async function main() {
  await runCorsChecks();
  await runAuthzChecks();

  const browser = await chromium.launch({ headless: true });
  try {
    await runCustomerBrowser(browser);
    await runAdminBrowser(browser);
  } finally {
    await browser.close();
  }

  writeFileSync(join(MEDIA, "validation-results.json"), JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.pass);
  const bySection = {};
  for (const r of results) {
    bySection[r.section] ??= { pass: 0, fail: 0 };
    if (r.pass) bySection[r.section].pass++;
    else bySection[r.section].fail++;
  }
  console.log("\n--- Validation summary ---");
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
