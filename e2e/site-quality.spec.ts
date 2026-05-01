import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/product",
  "/pricing",
  "/solutions",
  "/professional",
  "/about",
  "/contact",
  "/tutorial",
  "/legal",
  "/privacy",
  "/terms",
];

const protectedRoutes = [
  "/app",
  "/app/scan",
  "/app/admin",
  "/app/crm",
  "/app/erp",
  "/app/settings/overview",
  "/app/settings/profile",
  "/app/settings/profession",
  "/app/settings/billing",
];

const ignoredConsolePatterns = [
  /favicon/i,
  /DevTools/i,
  /ResizeObserver loop/i,
  /AbortError/i,
];

test.describe("site quality gate", () => {
  test.setTimeout(45_000);

  for (const route of publicRoutes) {
    test(`public route loads cleanly: ${route}`, async ({ page }, testInfo) => {
      const consoleErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        const text = message.text();
        if (!ignoredConsolePatterns.some((pattern) => pattern.test(text))) {
          consoleErrors.push(text);
        }
      });

      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.ok(), `${route} should return a successful response`).toBeTruthy();
      await expect(page.locator("body")).toBeVisible();
      await page.waitForFunction(() => document.readyState === "complete", null, { timeout: 15_000 }).catch(() => undefined);
      await page.waitForTimeout(250);

      const layout = await page.evaluate(() => {
        const documentElement = document.documentElement;
        const body = document.body;
        return {
          bodyTextLength: body.innerText.trim().length,
          scrollWidth: documentElement.scrollWidth,
          clientWidth: documentElement.clientWidth,
          hiddenOverflowX: getComputedStyle(body).overflowX === "hidden",
        };
      });

      expect(layout.bodyTextLength, `${route} should render meaningful content`).toBeGreaterThan(20);
      expect(
        layout.scrollWidth <= layout.clientWidth + 4 || layout.hiddenOverflowX,
        `${route} should not create horizontal overflow on ${testInfo.project.name}`,
      ).toBeTruthy();
      expect(consoleErrors, `${route} should not log browser console errors`).toEqual([]);
    });
  }

  for (const route of protectedRoutes) {
    test(`protected route redirects to login: ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: "commit" });
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
