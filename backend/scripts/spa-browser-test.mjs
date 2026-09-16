#!/usr/bin/env node
/**
 * Playwright browser verification for SPA → production API.
 * Never logs credentials.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MEDIA = process.env.MEDIA_DIR ?? "/opt/cursor/agent-store/project/melkoraa-e8d3d64b-b4e6-4e3e-a7c7-cec4b47d2b69/media";
const CUSTOMER_EMAIL = process.env.TEST_CUSTOMER_EMAIL;
const CUSTOMER_PASSWORD = process.env.TEST_CUSTOMER_PASSWORD;
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

mkdirSync(MEDIA, { recursive: true });
const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const apiCalls = [];

  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("melkoraa-api.vercel.app")) apiCalls.push(url);
  });

  // Customer login
  await page.goto("http://localhost:5173/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', CUSTOMER_EMAIL);
  await page.fill('input[type="password"]', CUSTOMER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  const customerUrl = page.url();
  record(
    "customer browser login",
    !customerUrl.includes("/login") || (await page.locator("text=LOGIN").count()) === 0,
    `url=${customerUrl}`,
  );
  record(
    "customer requests hit production API",
    apiCalls.some((u) => u.includes("melkoraa-api.vercel.app/api/v1")),
    `apiCalls=${apiCalls.length}`,
  );
  await page.screenshot({ path: join(MEDIA, "customer-logged-in.png"), fullPage: true });

  // Try add-to-bag from catalog if session cookie works
  await page.goto("http://localhost:5173/drop-001", { waitUntil: "networkidle" });
  const addBtn = page.locator('button:has-text("ADD TO BAG"), button:has-text("Add to bag")');
  if (await addBtn.count()) {
    await addBtn.first().click();
    await page.waitForTimeout(1500);
  }

  // Cart
  await page.goto("http://localhost:5173/cart", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const cartText = await page.textContent("body");
  const hasItems = cartText && !/Your cart is empty/i.test(cartText) && !/Sign in to load your bag/i.test(cartText);
  record("customer cart shows items when logged in", hasItems, hasItems ? "items visible" : "empty or sign-in prompt");
  await page.screenshot({ path: join(MEDIA, "customer-cart-with-items.png"), fullPage: true });

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const cartAfterRefresh = await page.textContent("body");
  record(
    "customer cart persists after refresh",
    cartAfterRefresh && !/Sign in to load your bag/i.test(cartAfterRefresh) && !/Your cart is empty/i.test(cartAfterRefresh),
    "refreshed",
  );

  // Checkout
  await page.goto("http://localhost:5173/checkout", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const checkoutText = await page.textContent("body");
  record(
    "checkout does not show empty bag",
    checkoutText && !/Your bag is empty/i.test(checkoutText),
    checkoutText?.includes("Checkout") ? "checkout loaded" : "check content",
  );

  // Logout customer
  const logoutLink = page.locator('a:has-text("LOGOUT"), button:has-text("LOGOUT")');
  if (await logoutLink.count()) {
    await logoutLink.first().click();
    await page.waitForTimeout(1500);
  }

  // Admin
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  const adminApiCalls = [];
  adminPage.on("request", (req) => {
    const url = req.url();
    if (url.includes("melkoraa-api.vercel.app")) adminApiCalls.push(url);
  });

  await adminPage.goto("http://localhost:5174/login", { waitUntil: "networkidle" });
  await adminPage.fill('input[type="email"]', ADMIN_EMAIL);
  await adminPage.fill('input[type="password"]', ADMIN_PASSWORD);
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForTimeout(3000);
  const adminUrl = adminPage.url();
  record("admin browser login", adminUrl.includes("/dashboard") || adminUrl.includes("/products"), `url=${adminUrl}`);
  record(
    "admin requests hit /api/v1/admin",
    adminApiCalls.some((u) => u.includes("/api/v1/admin")),
    `adminApiCalls=${adminApiCalls.length}`,
  );
  await adminPage.screenshot({ path: join(MEDIA, "admin-dashboard.png"), fullPage: true });

  await browser.close();
  writeFileSync(join(MEDIA, "browser-results.json"), JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.pass);
  console.log(`\nBrowser summary: ${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
