#!/usr/bin/env node
/**
 * Phase 5 — Razorpay TEST MODE payment E2E (production API + Vite storefront).
 * Never logs secrets or cookie values.
 */
import { createHmac } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { completeRazorpayTestPayment, failRazorpayTestPayment } from "./razorpay-pay-helper.mjs";

const API = process.env.API_BASE ?? "https://melkoraa-api.vercel.app/api/v1";
const API_ORIGIN = "https://melkoraa-api.vercel.app";
const WEBHOOK_URL = `${API_ORIGIN}/api/v1/webhooks/razorpay`;
const MOVED_WEBHOOK_URL = `${API_ORIGIN}/api/v1/payments/webhook`;
const CUSTOMER_ORIGIN = process.env.CUSTOMER_ORIGIN ?? "http://localhost:5173";
const MEDIA =
  process.env.MEDIA_DIR ??
  "/opt/cursor/agent-store/project/melkoraa-e8d3d64b-b4e6-4e3e-a7c7-cec4b47d2b69/media";

const CUSTOMER_EMAIL = process.env.TEST_CUSTOMER_EMAIL;
const CUSTOMER_PASSWORD = process.env.TEST_CUSTOMER_PASSWORD;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

const ENV_CHECKS = [
  "TEST_CUSTOMER_EMAIL",
  "TEST_CUSTOMER_PASSWORD",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
];

const results = [];
mkdirSync(MEDIA, { recursive: true });

function record(section, name, pass, detail = "") {
  results.push({ section, name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} [${section}] ${name}${detail ? ` — ${detail}` : ""}`);
}

function signWebhook(rawBody) {
  if (!WEBHOOK_SECRET) throw new Error("RAZORPAY_WEBHOOK_SECRET missing");
  return createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
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

async function api(jar, path, init = {}, origin = CUSTOMER_ORIGIN) {
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
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json, text };
}

async function loginCustomer() {
  const jar = new Jar();
  const res = await api(jar, "/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD }),
  });
  if (res.status !== 200) throw new Error(`customer login failed status=${res.status}`);
  return jar;
}

async function clearCart(jar) {
  const cart = await api(jar, "/cart");
  for (const item of cart.json?.data?.items ?? []) {
    await api(jar, `/cart/items/${item.variantId}`, { method: "DELETE" });
  }
}

async function addDropItem(jar) {
  const products = await api(jar, "/products?drop=drop-001&pageSize=5");
  const product = products.json?.data?.[0];
  if (!product?.variants?.length) throw new Error("no drop-001 variant");
  const variantId = product.variants.find((v) => v.available)?.id ?? product.variants[0].id;
  const add = await api(jar, "/cart/items", {
    method: "POST",
    body: JSON.stringify({ variantId, quantity: 1 }),
  });
  if (add.status !== 200) throw new Error(`add to cart failed status=${add.status}`);
  return { variantId, subtotalMinor: add.json?.data?.subtotalMinor ?? 0 };
}

async function ensureAddress(jar) {
  const list = await api(jar, "/addresses");
  const addresses = list.json?.data ?? [];
  if (addresses.length > 0) return addresses[0].id;
  const created = await api(jar, "/addresses", {
    method: "POST",
    body: JSON.stringify({
      name: "Phase 5 Test",
      phone: "9999999999",
      addressLine1: "1 Test Street",
      city: "Chennai",
      state: "TN",
      postalCode: "600001",
      country: "IN",
      isDefault: true,
    }),
  });
  if (created.status !== 201 && created.status !== 200) {
    throw new Error(`create address failed status=${created.status}`);
  }
  return created.json?.data?.id;
}

function capturedWebhookBody(orderId, paymentId, amountPaise) {
  return JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          amount: amountPaise,
          currency: "INR",
          status: "captured",
        },
      },
    },
  });
}

function failedWebhookBody(orderId, paymentId, amountPaise) {
  return JSON.stringify({
    event: "payment.failed",
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          amount: amountPaise,
          currency: "INR",
          status: "failed",
        },
      },
    },
  });
}

async function postWebhook(rawBody, signature) {
  const headers = { "Content-Type": "application/json" };
  if (signature !== undefined) headers["X-Razorpay-Signature"] = signature;
  const res = await fetch(WEBHOOK_URL, { method: "POST", headers, body: rawBody });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json, text };
}

async function runEnvAudit() {
  const section = "Env audit";
  for (const name of ENV_CHECKS) {
    record(section, name, Boolean(process.env[name]), process.env[name] ? "configured" : "missing");
  }
  const keyId = process.env.RAZORPAY_KEY_ID ?? "";
  record(section, "RAZORPAY_KEY_ID is test mode", keyId.startsWith("rzp_test_"), keyId ? "rzp_test_*" : "missing");
  if (!CUSTOMER_EMAIL || !CUSTOMER_PASSWORD || !WEBHOOK_SECRET) {
    throw new Error("missing required env for phase 5");
  }
}

async function runWebhookSecurity() {
  const section = "Webhook security";
  const body = capturedWebhookBody("order_fake", "pay_fake", 10000);

  const noSig = await postWebhook(body, "");
  record(section, "missing signature rejected", noSig.status === 400, `status=${noSig.status}`);

  const badSig = await postWebhook(body, "deadbeef");
  record(section, "invalid signature rejected", badSig.status === 400, `status=${badSig.status}`);

  const malformedSig = signWebhook("{not-json");
  const malformed = await postWebhook("{not-json", malformedSig);
  record(
    section,
    "malformed JSON rejected after sig check",
    malformed.status === 400,
    `status=${malformed.status}`,
  );

  const moved = await fetch(MOVED_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  record(section, "duplicate route /payments/webhook → 404", moved.status === 404, `status=${moved.status}`);

  const unknown = JSON.stringify({ event: "order.paid", payload: {} });
  const unknownSig = signWebhook(unknown);
  const ignored = await postWebhook(unknown, unknownSig);
  record(
    section,
    "unknown event ignored (200)",
    ignored.status === 200 && ignored.json?.data?.action === "ignored",
    `status=${ignored.status} action=${ignored.json?.data?.action ?? "?"}`,
  );
}

async function runCheckoutApiFlow() {
  const section = "Checkout API";
  const jar = await loginCustomer();
  await clearCart(jar);
  const { subtotalMinor } = await addDropItem(jar);
  const addressId = await ensureAddress(jar);
  record(section, "cart has server-priced items", subtotalMinor > 0, `subtotalMinor=${subtotalMinor}`);

  const checkout = await api(jar, "/checkout", {
    method: "POST",
    body: JSON.stringify({ addressId, idempotencyKey: crypto.randomUUID() }),
  });
  record(section, "checkout creates session", checkout.status === 201, `status=${checkout.status}`);
  const session = checkout.json?.data;
  const keyId = session?.payment?.keyId ?? "";
  const razorpayOrderId = session?.payment?.razorpayOrderId ?? "";
  const amountMinor = session?.payment?.amountMinor ?? 0;
  const orderId = session?.order?.id ?? "";
  record(section, "test mode keyId returned", keyId.startsWith("rzp_test_"), "rzp_test_*");
  record(section, "razorpay order id present", Boolean(razorpayOrderId), razorpayOrderId ? "present" : "missing");
  record(
    section,
    "order pending before payment",
    session?.order?.paymentStatus === "pending" && session?.order?.status === "pending",
    `payment=${session?.order?.paymentStatus} status=${session?.order?.status}`,
  );
  record(section, "amount from server matches cart", amountMinor === subtotalMinor, `checkout=${amountMinor} cart=${subtotalMinor}`);

  const fakeVerify = await api(jar, "/payments/verify", {
    method: "POST",
    body: JSON.stringify({
      razorpayPaymentId: "pay_fake",
      razorpayOrderId,
      razorpaySignature: "00",
    }),
  });
  record(section, "frontend cannot mark paid with bad signature", fakeVerify.status === 400, `status=${fakeVerify.status}`);

  const orderBeforePay = await api(jar, `/orders/${orderId}`);
  record(
    section,
    "order still pending without verify/webhook",
    orderBeforePay.json?.data?.paymentStatus === "pending",
    `payment=${orderBeforePay.json?.data?.paymentStatus}`,
  );

  return { jar, session, razorpayOrderId, amountMinor, orderId, addressId };
}

async function runWebhookIdempotency(ctx) {
  const section = "Webhook idempotency";
  const { razorpayOrderId, amountMinor, orderId, jar } = ctx;
  const payId = `pay_phase5_${Date.now()}`;
  const raw = capturedWebhookBody(razorpayOrderId, payId, amountMinor);
  const sig = signWebhook(raw);
  const first = await postWebhook(raw, sig);
  const second = await postWebhook(raw, sig);
  record(
    section,
    "valid webhook marks paid",
    first.status === 200 && first.json?.data?.action === "paid",
    `status=${first.status} action=${first.json?.data?.action}`,
  );
  record(
    section,
    "duplicate webhook idempotent",
    second.status === 200 && second.json?.data?.alreadyFinalized === true,
    `alreadyFinalized=${second.json?.data?.alreadyFinalized}`,
  );
  const order = await api(jar, `/orders/${orderId}`);
  record(
    section,
    "order confirmed after webhook",
    order.json?.data?.paymentStatus === "paid" && order.json?.data?.status === "confirmed",
    `payment=${order.json?.data?.paymentStatus} status=${order.json?.data?.status}`,
  );
}

async function runWebhookFailure(ctx) {
  const section = "Webhook failure";
  const jar = await loginCustomer();
  await clearCart(jar);
  await addDropItem(jar);
  const addressId = await ensureAddress(jar);
  const checkout = await api(jar, "/checkout", {
    method: "POST",
    body: JSON.stringify({ addressId, idempotencyKey: crypto.randomUUID() }),
  });
  const session = checkout.json?.data;
  const razorpayOrderId = session?.payment?.razorpayOrderId;
  const amountMinor = session?.payment?.amountMinor;
  const orderId = session?.order?.id;
  const payId = `pay_fail_${Date.now()}`;
  const raw = failedWebhookBody(razorpayOrderId, payId, amountMinor);
  const sig = signWebhook(raw);
  const first = await postWebhook(raw, sig);
  const second = await postWebhook(raw, sig);
  record(section, "payment.failed webhook processed", first.status === 200 && first.json?.data?.action === "failed", `action=${first.json?.data?.action}`);
  record(section, "duplicate failure idempotent", second.status === 200 && second.json?.data?.alreadyFinalized === true, `alreadyFinalized=${second.json?.data?.alreadyFinalized}`);
  const order = await api(jar, `/orders/${orderId}`);
  record(
    section,
    "order cancelled after failure",
    order.json?.data?.paymentStatus === "failed" && order.json?.data?.status === "cancelled",
    `payment=${order.json?.data?.paymentStatus} status=${order.json?.data?.status}`,
  );
}

async function waitForAuth(page) {
  await page.waitForFunction(
    () => document.body?.innerText?.includes("Logout") || document.body?.innerText?.includes("Account"),
    { timeout: 20000 },
  );
}

async function addToBagUi(page) {
  await page.goto(`${CUSTOMER_ORIGIN}/drop-001`, { waitUntil: "networkidle" });
  await waitForAuth(page);
  await page.waitForTimeout(2000);
  const addBtn = page.locator('button:has-text("Add to bag"):not([disabled])').first();
  await addBtn.waitFor({ state: "visible", timeout: 15000 });
  await addBtn.click();
  const confirm = page.locator('button:has-text("Confirm size")');
  if (await confirm.count()) await confirm.first().click();
  await page.waitForTimeout(2500);
  await page.goto(`${CUSTOMER_ORIGIN}/cart`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const body = await page.textContent("body");
  return body && !/YOUR CART IS EMPTY/i.test(body) && !/Sign in to load your bag/i.test(body);
}

async function runBrowserSuccessPayment() {
  const section = "Browser E2E success";
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let verifyStatus = null;
  page.on("response", (res) => {
    if (res.url().includes("/payments/verify")) verifyStatus = res.status();
  });

  try {
    await page.goto(`${CUSTOMER_ORIGIN}/login`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', CUSTOMER_EMAIL);
    await page.fill('input[type="password"]', CUSTOMER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });

    const bagOk = await addToBagUi(page);
    record(section, "UI add-to-bag reaches cart with items", bagOk, bagOk ? "items visible" : "empty");
    await page.screenshot({ path: join(MEDIA, "phase5-cart-with-items.png"), fullPage: true });

    await page.goto(`${CUSTOMER_ORIGIN}/checkout`, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    const addressRadio = page.locator('input[name="address"]').first();
    if (await addressRadio.count()) await addressRadio.check();
    await page.screenshot({ path: join(MEDIA, "phase5-checkout-before-pay.png"), fullPage: true });

    await page.click('button:has-text("Pay")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(MEDIA, "phase5-razorpay-modal.png"), fullPage: true });

    await completeRazorpayTestPayment(page);
    await page.screenshot({ path: join(MEDIA, "phase5-order-confirmed.png"), fullPage: true });

    const onOrder = page.url().includes("/order/");
    await page.waitForTimeout(3000);
    const orderBody = await page.textContent("body");
    const confirmed =
      onOrder &&
      orderBody &&
      (orderBody.includes("ORDER CONFIRMED") || orderBody.includes("placed successfully") || orderBody.includes("paid"));
    record(section, "redirects to order page", onOrder, `url=${page.url()}`);
    record(section, "payments/verify succeeded", verifyStatus === 200, `status=${verifyStatus ?? "missing"}`);
    record(section, "order shows paid/confirmed", Boolean(confirmed), confirmed ? "confirmed" : "pending copy");

    const cartAfter = await page.evaluate(async (apiBase) => {
      const r = await fetch(`${apiBase}/cart`, { credentials: "include" });
      const j = await r.json();
      return j?.data?.itemCount ?? -1;
    }, API);
    record(section, "cart cleared after purchase", cartAfter === 0, `itemCount=${cartAfter}`);
  } finally {
    await browser.close();
  }
}

async function runBrowserFailedPayment() {
  const section = "Browser E2E cancelled";
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(`${CUSTOMER_ORIGIN}/login`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', CUSTOMER_EMAIL);
    await page.fill('input[type="password"]', CUSTOMER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });
    await addToBagUi(page);
    await page.goto(`${CUSTOMER_ORIGIN}/checkout`, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    const addressRadio = page.locator('input[name="address"]').first();
    if (await addressRadio.count()) await addressRadio.check();
    await page.click('button:has-text("Pay")');
    await page.waitForTimeout(5000);
    await failRazorpayTestPayment(page);
    const notice = await page.textContent("body");
    const cancelled =
      notice &&
      (notice.includes("Payment cancelled") ||
        notice.includes("not paid") ||
        notice.includes("Payment failed") ||
        page.url().includes("/checkout"));
    record(section, "dismissed payment shows not paid", Boolean(cancelled), page.url());
    await page.screenshot({ path: join(MEDIA, "phase5-payment-cancelled.png"), fullPage: true });
  } finally {
    await browser.close();
  }
}

async function runSecurityAudit() {
  const section = "Security audit";
  const frontendEnv = await fetch(`${CUSTOMER_ORIGIN}/src/lib/api/config.ts`).then((r) => r.text()).catch(() => "");
  record(
    section,
    "no Razorpay secrets in Vite frontend",
    !/RAZORPAY_KEY_SECRET|RAZORPAY_WEBHOOK_SECRET|WEBHOOK_SECRET/i.test(frontendEnv),
    "frontend config scanned",
  );
  const health = await fetch(`${API_ORIGIN}/api/v1/health`);
  record(section, "production health 200", health.status === 200, `status=${health.status}`);
  const cors = await fetch(`${API}/auth/me`, {
    method: "OPTIONS",
    headers: {
      Origin: CUSTOMER_ORIGIN,
      "Access-Control-Request-Method": "GET",
    },
  });
  const acao = cors.headers.get("access-control-allow-origin");
  record(section, "CORS not wildcard", acao !== "*", `acao=${acao ?? "missing"}`);
  record(section, "CORS credentials allowed", cors.headers.get("access-control-allow-credentials") === "true", "acac=true");
}

async function main() {
  await runEnvAudit();
  await runSecurityAudit();
  await runWebhookSecurity();
  const ctx = await runCheckoutApiFlow();
  await runWebhookIdempotency(ctx);
  await runWebhookFailure();
  await runBrowserSuccessPayment();
  await runBrowserFailedPayment();

  writeFileSync(join(MEDIA, "phase5-results.json"), JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.pass);
  const bySection = {};
  for (const r of results) {
    bySection[r.section] ??= { pass: 0, fail: 0 };
    if (r.pass) bySection[r.section].pass++;
    else bySection[r.section].fail++;
  }
  console.log("\n--- Phase 5 summary ---");
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
