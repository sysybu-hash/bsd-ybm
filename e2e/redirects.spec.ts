import { expect, test } from "@playwright/test";

test.describe("הפניות workspace (next.config)", () => {
  test("‏/app/clients מפנה ל־/app/crm", async ({ request }) => {
    const res = await request.get("/app/clients", { maxRedirects: 0 });
    expect([301, 302, 307, 308]).toContain(res.status());
    expect(res.headers().location ?? "").toContain("/app/crm");
  });

  test("‏/app/projects מפנה ל־CRM עם לשונית פרויקטים", async ({ request }) => {
    const res = await request.get("/app/projects", { maxRedirects: 0 });
    expect([301, 302, 307, 308]).toContain(res.status());
    const loc = res.headers().location ?? "";
    expect(loc).toContain("/app/crm");
    expect(loc).toContain("hub=projects");
  });

  test("‏/app/documents מפנה ל־/app/erp", async ({ request }) => {
    const res = await request.get("/app/documents", { maxRedirects: 0 });
    expect([301, 302, 307, 308]).toContain(res.status());
    expect(res.headers().location ?? "").toContain("/app/erp");
  });

  test("‏/app/ai מפנה ל־/app", async ({ request }) => {
    const res = await request.get("/app/ai", { maxRedirects: 0 });
    expect([301, 302, 307, 308]).toContain(res.status());
    const loc = res.headers().location ?? "";
    expect(loc).toContain("/app");
    expect(loc).not.toContain("/app/ai");
  });

  test("‏/dashboard/crm מפנה ל־/app/crm", async ({ request }) => {
    const res = await request.get("/dashboard/crm", { maxRedirects: 0 });
    expect([301, 302, 307, 308]).toContain(res.status());
    expect(res.headers().location ?? "").toContain("/app/crm");
  });

  test("‏/dashboard/business מפנה ל־/app/business", async ({ request }) => {
    const res = await request.get("/dashboard/business", { maxRedirects: 0 });
    expect([301, 302, 307, 308]).toContain(res.status());
    expect(res.headers().location ?? "").toContain("/app/business");
  });

  test("‏/app/business — ללא סשן מופנה להתחברות או נטען (לא לולאת redirect ל־/app)", async ({ request }) => {
    const res = await request.get("/app/business", { maxRedirects: 0 });
    expect([200, 302, 307, 308]).toContain(res.status());
    const loc = res.headers().location ?? "";
    if (loc) {
      expect(loc).not.toMatch(/\/app\/?$/);
    }
  });
});
