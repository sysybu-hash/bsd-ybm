import { expect, test } from "@playwright/test";

/**
 * Scan Wizard v2 — בדיקות עשן.
 * אין כאן זרימת סריקה אמיתית (דורשת התחברות + מנוע AI חי), רק בדיקות
 * שה-route חי ושה-?legacy=1 escape hatch עובד.
 */
test.describe("אשף סריקה v2", () => {
  test("‎/app/scan דורש התחברות", async ({ page }) => {
    await page.goto("/app/scan", { waitUntil: "commit" });
    await expect(page).toHaveURL(/\/login/);
  });

  test("‎/app/scan?legacy=1 גם דורש התחברות", async ({ page }) => {
    await page.goto("/app/scan?legacy=1", { waitUntil: "commit" });
    await expect(page).toHaveURL(/\/login/);
  });

  test("‎/api/scan/credits דורש סשן", async ({ request }) => {
    const res = await request.get("/api/scan/credits");
    // מצופה 401 לא-מורשה
    expect([401, 403]).toContain(res.status());
  });
});
