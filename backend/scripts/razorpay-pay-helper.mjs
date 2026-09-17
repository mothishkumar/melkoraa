/** Shared Razorpay Checkout v2 test-mode automation helpers for Playwright. */

export async function completeRazorpayTestPayment(page) {
  const iframe = page.frameLocator('iframe[src*="razorpay"]');
  await iframe.locator("body").waitFor({ timeout: 45000 });
  await page.waitForTimeout(2000);

  const mobile = iframe.locator('input[name="contact"]');
  if (await mobile.count()) {
    await mobile.click();
    await mobile.fill("");
    await mobile.pressSequentially("9123456780", { delay: 40 });
    await page.waitForTimeout(3000);
  }

  // Netbanking has the most reliable Razorpay test-mode mock Success/Failure page.
  await iframe.getByTestId("Netbanking").click();
  await page.waitForTimeout(2000);
  await iframe.getByRole("button", { name: /ICICI Bank/i }).first().click({ force: true });

  let mockPage = null;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(1500);
    for (const p of page.context().pages()) {
      const url = p.url();
      if (url.includes("mocksharp") || url.includes("gateway/mock")) {
        mockPage = p;
        break;
      }
    }
    if (mockPage) break;
  }
  if (!mockPage) {
    throw new Error("Razorpay test-mode mock bank page not opened");
  }
  await mockPage.waitForLoadState("domcontentloaded");
  await mockPage.getByRole("button", { name: "Success", exact: true }).click({ timeout: 30000 });
  await page.waitForURL((url) => url.pathname.includes("/order/"), { timeout: 120000 });
  await page.waitForTimeout(3000);
}

export async function failRazorpayTestPayment(page) {
  const iframe = page.frameLocator('iframe[src*="razorpay"]');
  if (!(await iframe.locator("body").count())) return;
  const close = iframe.locator('button[aria-label="Close Checkout"], .razorpay-close-icon').first();
  if (await close.count()) {
    await close.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);
    return;
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(2000);
}
