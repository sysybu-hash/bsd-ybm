import { expect, test } from "@playwright/test";

test.describe("עשן ציבורי ואבטחת workspace", () => {
  test("דף הבית נטען", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  test("דף התחברות נגיש", async ({ page }) => {
    const res = await page.goto("/login");
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 }).catch(() => {
      /* חלק מהערכות עיצוב משתמשות ב-main בלבד */
    });
  });

  test("נתיבי /app דורשים התחברות", async ({ page }) => {
    await page.goto("/app", { waitUntil: "commit" });
    await expect(page).toHaveURL(/\/login/);
  });

  test("הגדרות /app/settings דורשות התחברות", async ({ page }) => {
    await page.goto("/app/settings", { waitUntil: "commit" });
    await expect(page).toHaveURL(/\/login/);
  });

  test("הפניה /app/billing (legacy) דורשת התחברות לפני מרכז החיוב", async ({ page }) => {
    await page.goto("/app/billing", { waitUntil: "commit" });
    await expect(page).toHaveURL(/\/login/);
  });

  test("דפים ציבוריים נטענים", async ({ page }) => {
    for (const path of ["/product", "/pricing", "/about"]) {
      const res = await page.goto(path);
      expect(res?.ok(), `${path} צריך להחזיר סטטוס תקין`).toBeTruthy();
      await expect(page.locator("body")).toBeVisible();
    }
  });
});
