import { expect, test } from "@playwright/test";

const hasE2ECreds = !!(process.env.E2E_EMAIL?.trim() && process.env.E2E_PASSWORD);

const describeAuth = hasE2ECreds ? test.describe : test.describe.skip;

/**
 * בדיקות מחוברות — דורשות משתמש אמיתי ב-DB (סיסמה ב-credentials).
 * הגדר ב-.env.local: E2E_EMAIL, E2E_PASSWORD
 * בלי משתנים אלה כל הסוויטה מדולגת.
 */
describeAuth("אחרי התחברות (E2E)", () => {
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
    await page.locator('input[name="email"]').fill(process.env.E2E_EMAIL!.trim());
    await page.locator('input[name="password"]').fill(process.env.E2E_PASSWORD!);
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
    await expect(page.getByRole("heading", { name: "מרכז ההגדרות", exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test("מנויים וחיוב בהגדרות", async ({ page }) => {
    await page.goto("/app/settings/billing", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/app\/settings\/billing/);
    await expect(page.getByText("ניהול מנויים", { exact: false })).toBeVisible({ timeout: 20_000 });
  });
});
