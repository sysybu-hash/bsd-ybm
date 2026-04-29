import { expect, test } from "@playwright/test";

/** תואם ל־`scripts/seed-test-data.mjs` — רק כש־`playwright.config` מגדיר PLAYWRIGHT_USE_DEMO_LOGIN (localhost בלי E2E_EMAIL) */
const DEMO_SEED_EMAIL = "owner@bsd-demo.test";
const DEMO_SEED_PASSWORD = "Demo!2026";

const useDemoLogin = process.env.PLAYWRIGHT_USE_DEMO_LOGIN === "1";
const e2eEmail = (process.env.E2E_EMAIL?.trim() || (useDemoLogin ? DEMO_SEED_EMAIL : "")).trim();
const e2ePassword = process.env.E2E_PASSWORD || (useDemoLogin ? DEMO_SEED_PASSWORD : "");
const hasE2ECreds = !!(e2eEmail && e2ePassword);

const describeAuth = hasE2ECreds ? test.describe : test.describe.skip;

/**
 * בדיקות מחוברות — Credentials ב-DB.
 * אפשרות א׳: `.env.local` עם `E2E_EMAIL` / `E2E_PASSWORD`.
 * אפשרות ב׳ (מקומי בלבד): `npm run seed:test` ואז Playwright מול 127.0.0.1/localhost — יילקחו פרטי ה-demo מהסקריפט (ראו `playwright.config.ts`).
 */
describeAuth("אחרי התחברות (E2E)", () => {
  /** רצף — מונע מספר לוגינים במקביל לאותו שרת dev ו־ERR_NETWORK_IO_SUSPENDED */
  test.describe.configure({ mode: "serial" });

  test.setTimeout(90_000);

  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "bsd-ybm-cookie-consent-v1",
        JSON.stringify({
          version: 1,
          necessary: true,
          analytics: false,
          marketing: false,
          updatedAt: new Date().toISOString(),
        }),
      );
    });
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.readyState === "complete");
    await page.locator('input[name="email"]').fill(e2eEmail);
    await page.locator('input[name="password"]').fill(e2ePassword);
    await page.locator('form:has(input[name="password"]) button[type="submit"]').click();
    const continueButton = page.getByRole("button", { name: /Continue to Dashboard|המשך/i });
    if (await continueButton.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await continueButton.click();
    }
    await page.waitForURL(/\/app/, { timeout: 45_000 });
  });

  test("דשבורד /app נטען", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveURL(/\/app/);
  });

  test("מרכז הגדרות — סקירה", async ({ page }) => {
    await page.goto("/app/settings/overview", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/app\/settings\/overview/);
    await expect(page.getByRole("heading", { name: "מרכז ההפעלה", exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test("מנויים וחיוב בהגדרות", async ({ page }) => {
    await page.goto("/app/settings/billing", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/app\/settings\/billing/);
    await expect(page.getByText("ניהול מנויים", { exact: false })).toBeVisible({ timeout: 20_000 });
  });

  test("דף CRM נטען", async ({ page }) => {
    await page.goto("/app/crm", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/app\/crm/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("דף ERP נטען וכולל עוגן סריקה", async ({ page }) => {
    await page.goto("/app/erp", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/app\/erp/);
    await expect(page.locator("#erp-multi-scanner")).toBeAttached({ timeout: 25_000 });
  });
});
