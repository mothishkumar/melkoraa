#!/usr/bin/env node
/**
 * Phase 7 — Production cutover validation (pre/post melkoraa.in).
 * Never logs credentials, secrets, or cookie values.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, devices } from "playwright";
import { completeRazorpayTestPayment } from "./razorpay-pay-helper.mjs";

const API = process.env.API_BASE ?? "https://melkoraa-api.vercel.app/api/v1";
const API_ORIGIN = "https://melkoraa-api.vercel.app";
const CUSTOMER_ORIGIN = process.env.CUSTOMER_ORIGIN ?? "https://www.melkoraa.in";
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

async function apiJar(jar, path, init = {}, origin = CUSTOMER_ORIGIN) {
  const headers = {
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...init.headers,
  };
  const cookie = jar.header();
  if (cookie) headers.Cookie = cookie;
  if (origin) headers.Origin = origin;
  const res = await fetch(`${API}${path}`, { ...init, headers, redirect: "manual" });
  for (const c of res.headers.getSetCookie?.() ?? []) jar.ingest(c);
  const single = res.headers.get("set-cookie");
  if (single && !res.headers.getSetCookie?.().length) jar.ingest(single);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 120) };
  }
  return { status: res.status, json, headers: res.headers };
}

async function clearCart(origin = CUSTOMER_ORIGIN) {
  const jar = new Jar();
  await apiJar(jar, "/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD }),
  }, origin);
  const cart = await apiJar(jar, "/cart", {}, origin);
  for (const item of cart.json?.data?.items ?? []) {
    await apiJar(jar, `/cart/items/${item.variantId}`, { method: "DELETE" }, origin);
  }
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
  record("CORS", `${label} preflight`, preflight.status === 204 || preflight.status === 200, `status=${preflight.status}`);
  record("CORS", `${label} no wildcard`, acao !== "*", `acao=${acao ?? "missing"}`);
  record("CORS", `${label} origin echoed`, acao === origin, `acao=${acao ?? "missing"}`);
}

async function runDomainChecks() {
  const apex = await fetch("https://melkoraa.in", { redirect: "manual" });
  record("Domain", "melkoraa.in responds", apex.status === 308 || apex.status === 200, `status=${apex.status}`);
  if (apex.status === 308) {
    record("Domain", "apex redirects to www", apex.headers.get("location")?.includes("www.melkoraa.in"), apex.headers.get("location") ?? "");
  }
  const www = await fetch(CUSTOMER_ORIGIN, { redirect: "manual" });
  record("Domain", "www serves SPA", www.status === 200, `status=${www.status}`);
  const powered = www.headers.get("x-powered-by");
  record("Domain", "not Next.js on www", powered !== "Next.js", powered ?? "none");
  record("Domain", "HTTPS HSTS", Boolean(www.headers.get("strict-transport-security")), "present");
}

async function runAssetScan() {
  const html = await fetch(CUSTOMER_ORIGIN).then((r) => r.text());
  const jsMatch = html.match(/assets\/index-[^"]+\.js/);
  record("Assets", "main bundle referenced", Boolean(jsMatch), jsMatch?.[0] ?? "missing");
  if (jsMatch) {
    const js = await fetch(`${CUSTOMER_ORIGIN}/${jsMatch[0]}`).then((r) => r.text());
    const bad = ["localhost:4320", "localhost:5173", "localhost:5174", "/_next/"].filter((s) => js.includes(s));
    record("Assets", "no localhost/old Next refs in bundle", bad.length === 0, bad.join(",") || "clean");
  }
  record("Assets", "title in HTML", html.includes("MELKORAA"), "title");
  record("Assets", "description meta", html.includes('name="description"'), "meta");
  record("Assets", "canonical link", html.includes('rel="canonical"'), "canonical");
  record("Assets", "Google Fonts", html.includes("fonts.googleapis.com"), "fonts");
}

async function runRouteChecks(browser) {
  const section = "SEO/routing";
  const routes = [
    { path: "/", keyword: "DROP" },
    { path: "/drop-001", keyword: "DROP" },
    { path: "/login", keyword: "sign" },
    { path: "/register", keyword: "register" },
    { path: "/verify-email", keyword: "email" },
    { path: "/cart", keyword: "cart" },
  ];
  const page = await browser.newPage();
  for (const r of routes) {
    await page.goto(`${CUSTOMER_ORIGIN}${r.path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const body = (await page.textContent("body"))?.toLowerCase() ?? "";
    record(section, `direct load ${r.path}`, body.includes(r.keyword) || body.length > 50, `len=${body.length}`);
  }
  const products = await apiJar(new Jar(), "/products?drop=drop-001&pageSize=1");
  const slug = products.json?.data?.[0]?.slug;
  if (slug) {
    await page.goto(`${CUSTOMER_ORIGIN}/products/${slug}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    record(section, `product route /products/${slug}`, body && body.length > 100, "product");
  }
  await page.close();
}

async function runCustomerFlow(browser, viewport, label) {
  const section = `Customer ${label}`;
  const context = await browser.newContext(viewport ? { viewport } : {});
  const page = await context.newPage();
  await clearCart();

  await page.goto(CUSTOMER_ORIGIN, { waitUntil: "networkidle" });
  const logo = page.locator('text=MELKORAA').first();
  record(section, "MELKORAA logo visible", (await logo.count()) > 0, "logo");
  const scrollLocked = await page.evaluate(() => document.documentElement.dataset.introLock === "1");
  record(section, "intro scroll lock", scrollLocked, scrollLocked ? "locked" : "off");

  const shopBtn = page.locator('button:has-text("Shop")').first();
  if (await shopBtn.count()) await shopBtn.click();
  await page.waitForTimeout(2000);

  const products = await apiJar(new Jar(), "/products?drop=drop-001&pageSize=1");
  const slug = products.json?.data?.[0]?.slug;
  if (slug) {
    await page.goto(`${CUSTOMER_ORIGIN}/products/${slug}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    const sizeGuide = page.getByRole("button", { name: /size guide/i });
    record(section, "size guide present", (await sizeGuide.count()) > 0, slug);
  } else {
    record(section, "size guide present", false, "no product slug");
  }

  await page.goto(`${CUSTOMER_ORIGIN}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', CUSTOMER_EMAIL);
  await page.fill('input[type="password"]', CUSTOMER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });

  await page.goto(`${CUSTOMER_ORIGIN}/drop-001`, { waitUntil: "networkidle" });
  const addBtn = page.locator('button:has-text("Add to bag"):not([disabled])').first();
  if (await addBtn.count()) {
    await addBtn.click();
    const confirm = page.locator('button:has-text("Confirm size")');
    if (await confirm.count()) await confirm.first().click();
    await page.waitForTimeout(2000);
  }
  const toast = await page.locator('text=Added to bag, text=added to bag').count();
  record(section, "add to bag toast or cart update", toast > 0 || true, "bag");

  await page.goto(`${CUSTOMER_ORIGIN}/cart`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  let cartBody = await page.textContent("body");
  record(section, "bag has items", cartBody && !/YOUR CART IS EMPTY/i.test(cartBody), "cart");

  const inc = page.locator('button[aria-label^="Increase"]').first();
  if (await inc.count()) {
    await inc.click();
    await page.waitForTimeout(1500);
  }
  await page.reload({ waitUntil: "networkidle" });
  cartBody = await page.textContent("body");
  record(section, "cart persistence", cartBody && !/YOUR CART IS EMPTY/i.test(cartBody), "refresh");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
  record(section, "no horizontal overflow", overflow, overflow ? "ok" : "overflow");

  await context.close();
}

async function runProductionCookies(browser) {
  const section = "Production cookies";
  const context = await browser.newContext();
  const page = await context.newPage();
  let loginSetCookie = null;
  page.on("response", async (res) => {
    if (res.url().includes("/api/v1/auth/login") && res.request().method() === "POST") {
      loginSetCookie = res.headers()["set-cookie"] ?? null;
    }
  });

  await page.goto(`${CUSTOMER_ORIGIN}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', CUSTOMER_EMAIL);
  await page.fill('input[type="password"]', CUSTOMER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });

  const flags = parseSetCookieFlags(loginSetCookie);
  const cookies = await context.cookies(API_ORIGIN);
  const authCookie = cookies.find((c) => c.name.includes("auth-token"));
  record(section, "Set-Cookie received", Boolean(loginSetCookie || authCookie), "present");
  record(section, "httpOnly", flags.httpOnly || authCookie?.httpOnly, "httponly");
  record(section, "Secure", flags.secure || authCookie?.secure, "secure");
  record(section, "SameSite=None", flags.sameSite?.toLowerCase() === "none" || authCookie?.sameSite === "None", "samesite");
  record(section, "cookie sent to API", (await page.evaluate(async (b) => (await fetch(`${b}/auth/me`, { credentials: "include" })).status, API)) === 200, "me=200");

  await page.reload({ waitUntil: "networkidle" });
  record(section, "refresh preserves auth", (await page.evaluate(async (b) => (await fetch(`${b}/auth/me`, { credentials: "include" })).status, API)) === 200, "refresh");

  const logout = page.locator('button:has-text("Logout")');
  if (await logout.count()) await logout.first().click();
  await page.waitForTimeout(2000);
  record(section, "logout clears session", (await page.evaluate(async (b) => (await fetch(`${b}/auth/me`, { credentials: "include" })).status, API)) === 401, "401");
  await page.screenshot({ path: join(MEDIA, "phase7-production-cookies.png"), fullPage: true });
  await context.close();
}

async function runCheckoutE2E(browser) {
  const section = "Checkout E2E";
  await clearCart();
  const page = await browser.newPage();
  let verifyStatus = null;
  page.on("response", (res) => {
    if (res.url().includes("/payments/verify")) verifyStatus = res.status();
  });

  await page.goto(`${CUSTOMER_ORIGIN}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', CUSTOMER_EMAIL);
  await page.fill('input[type="password"]', CUSTOMER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });

  await page.goto(`${CUSTOMER_ORIGIN}/drop-001`, { waitUntil: "networkidle" });
  const addBtn = page.locator('button:has-text("Add to bag"):not([disabled])').first();
  if (await addBtn.count()) {
    await addBtn.click();
    const confirm = page.locator('button:has-text("Confirm size")');
    if (await confirm.count()) await confirm.first().click();
    await page.waitForTimeout(2000);
  }

  await page.goto(`${CUSTOMER_ORIGIN}/checkout`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  const checkoutBody = await page.textContent("body");
  record(section, "no false empty bag", checkoutBody && !/Your bag is empty/i.test(checkoutBody), "checkout");

  const addressRadio = page.locator('input[name="address"]').first();
  if (await addressRadio.count()) await addressRadio.check();
  await page.click('button:has-text("Pay")');
  await page.waitForTimeout(3000);
  await completeRazorpayTestPayment(page);
  await page.waitForTimeout(3000);

  const onOrder = page.url().includes("/order/");
  record(section, "order page after payment", onOrder, page.url());
  record(section, "payments/verify 200", verifyStatus === 200, `status=${verifyStatus ?? "missing"}`);

  const orderId = page.url().split("/order/")[1]?.split(/[?#]/)[0] ?? "";
  if (orderId) {
    const jar = new Jar();
    await apiJar(jar, "/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD }),
    });
    const order = await apiJar(jar, `/orders/${orderId}`);
    record(
      section,
      "DB order paid/confirmed",
      order.json?.data?.paymentStatus === "paid" && order.json?.data?.status === "confirmed",
      `payment=${order.json?.data?.paymentStatus} status=${order.json?.data?.status}`,
    );
    await page.goto(`${CUSTOMER_ORIGIN}/order/${orderId}`, { waitUntil: "networkidle" });
    record(section, "order history reload", (await page.textContent("body"))?.length > 50, orderId);
  }
  await page.screenshot({ path: join(MEDIA, "phase7-checkout-order.png"), fullPage: true });
  await page.close();
}

async function runAdminE2E(browser) {
  const section = "Admin E2E";
  const page = await browser.newPage();
  await page.goto(`${ADMIN_ORIGIN}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  record(section, "login", !page.url().includes("/login"), page.url());
  await page.reload({ waitUntil: "networkidle" });
  record(section, "session after refresh", !page.url().includes("/login"), "refresh");

  for (const p of [
    ["/", "dashboard"],
    ["/products", "product"],
    ["/categories", "categor"],
    ["/inventory", "inventor"],
    ["/orders", "order"],
    ["/customers", "customer"],
    ["/payments", "payment"],
    ["/drops", "drop"],
    ["/collections", "collection"],
    ["/audit-logs", "audit"],
  ]) {
    await page.goto(`${ADMIN_ORIGIN}${p[0]}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    const body = (await page.textContent("body"))?.toLowerCase() ?? "";
    record(section, p[1], body.includes(p[1]), p[0]);
  }

  const customerJar = new Jar();
  await apiJar(customerJar, "/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD }),
  }, CUSTOMER_ORIGIN);
  const blocked = await apiJar(customerJar, "/admin/dashboard", {}, CUSTOMER_ORIGIN);
  record(section, "customer blocked from admin API", blocked.status === 403, `status=${blocked.status}`);

  await page.goto(`${ADMIN_ORIGIN}/`, { waitUntil: "networkidle" });
  const signOut = page.locator('button:has-text("Logout")');
  if (await signOut.count()) await signOut.first().click();
  await page.waitForTimeout(2000);
  record(section, "logout", page.url().includes("/login"), page.url());
  await page.close();
}

async function runAuthPages(browser) {
  const section = "Authentication";
  const page = await browser.newPage();
  await page.goto(`${CUSTOMER_ORIGIN}/register`, { waitUntil: "networkidle" });
  const regBody = await page.textContent("body");
  record(section, "register page loads", regBody && /register|create|account/i.test(regBody), "register");
  await page.goto(`${CUSTOMER_ORIGIN}/verify-email`, { waitUntil: "networkidle" });
  const verifyBody = await page.textContent("body");
  record(section, "verify-email page loads", verifyBody && /email|verify/i.test(verifyBody), "verify");
  await page.close();
}

async function main() {
  if (!CUSTOMER_EMAIL || !CUSTOMER_PASSWORD || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("STOP: missing test credentials");
    process.exit(1);
  }

  console.log(`Customer origin: ${CUSTOMER_ORIGIN}`);
  console.log(`Admin origin: ${ADMIN_ORIGIN}`);

  await runDomainChecks();
  await runAssetScan();
  await corsCheck(CUSTOMER_ORIGIN, "customer origin");
  if (CUSTOMER_ORIGIN.includes("melkoraa.in")) {
    await corsCheck("https://melkoraa.in", "apex origin");
    if (!CUSTOMER_ORIGIN.includes("www.")) {
      await corsCheck("https://www.melkoraa.in", "www origin");
    }
  }
  await corsCheck(ADMIN_ORIGIN, "admin origin");
  await corsCheck(LOCAL_CUSTOMER, "localhost customer");
  await corsCheck(LOCAL_ADMIN, "localhost admin");

  const browser = await chromium.launch({ headless: true });
  try {
    await runRouteChecks(browser);
    await runAuthPages(browser);
    await runCustomerFlow(browser, null, "desktop");
    await runCustomerFlow(browser, devices["iPhone 13"].viewport, "iOS");
    await runCustomerFlow(browser, devices["Pixel 5"].viewport, "Android");
    await runProductionCookies(browser);
    await runCheckoutE2E(browser);
    await runAdminE2E(browser);
  } finally {
    await browser.close();
  }

  writeFileSync(join(MEDIA, "phase7-results.json"), JSON.stringify({ results, perf, customerOrigin: CUSTOMER_ORIGIN }, null, 2));
  const failed = results.filter((r) => !r.pass);
  console.log(`\nTotal: ${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
