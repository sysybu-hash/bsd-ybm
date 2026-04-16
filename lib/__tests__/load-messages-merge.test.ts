import { getMessages } from "@/lib/i18n/load-messages";

describe("getMessages merge", () => {
  test("מזג תוכן שיווק ודף בית (עברית)", () => {
    const m = getMessages("he") as Record<string, unknown>;
    expect(m.marketingProduct).toBeDefined();
    expect(m.marketingHome).toBeDefined();
    expect((m.aboutPage as Record<string, string>).shellDescription).toBeTruthy();
  });

  test("מזג תוכן שיווק ודף בית (רוסית)", () => {
    const m = getMessages("ru") as Record<string, unknown>;
    expect(m.publicShell).toBeDefined();
    expect(m.marketingHome).toBeDefined();
    expect((m.aboutPage as Record<string, string>).shellDescription).toBeTruthy();
  });
});
