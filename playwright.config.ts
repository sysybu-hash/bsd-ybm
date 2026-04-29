import path from "path";
import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

loadEnv({ path: path.resolve(process.cwd(), ".env"), quiet: true });
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true, quiet: true });

/** פורט ייעודי ל־E2E — לא מתנגש עם `npm run dev` על 3000 ומונע בדיקות מול שרת אחר על אותו פורט */
const e2eDevPort = process.env.PLAYWRIGHT_DEV_PORT ?? "3330";
const e2eBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${e2eDevPort}`;

/** רק מול localhost — מאפשר E2E מחובר בלי E2E_EMAIL (משתמש seed; ראו `npm run seed:test`) */
const e2eHost = (() => {
  try {
    return new URL(e2eBaseUrl).hostname.toLowerCase();
  } catch {
    return "";
  }
})();
if ((e2eHost === "127.0.0.1" || e2eHost === "localhost") && !process.env.E2E_EMAIL?.trim()) {
  process.env.PLAYWRIGHT_USE_DEMO_LOGIN = "1";
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: "list",
  use: {
    baseURL: e2eBaseUrl,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev -p ${e2eDevPort}`,
    url: e2eBaseUrl,
    /** ברירת מחדל false — כדי ש־NEXTAUTH_URL מה־env למעלה יחול על תהליך ה־dev; PW_REUSE_SERVER=1 לאופטימיזציה מקומית */
    reuseExistingServer: process.env.PW_REUSE_SERVER === "1",
    timeout: 120_000,
    /** כדי ש־NextAuth יחזיר callback/redirect לאותו מארח כמו שרת ה־E2E (לא localhost:3000 מ־.env.local) */
    env: {
      ...process.env,
      NEXTAUTH_URL: e2eBaseUrl,
      AUTH_URL: e2eBaseUrl,
    },
  },
});
