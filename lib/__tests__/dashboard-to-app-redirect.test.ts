import { mapDashboardPathToApp } from "@/lib/dashboard-to-app-redirect";

describe("dashboard-to-app-redirect", () => {
  it("ממפה נתיבי legacy ליעדי workspace עדכניים", () => {
    expect(mapDashboardPathToApp("/dashboard/crm")).toBe("/app/crm");
    expect(mapDashboardPathToApp("/dashboard/erp")).toBe("/app/erp");
    expect(mapDashboardPathToApp("/dashboard/ai")).toBe("/app");
    expect(mapDashboardPathToApp("/dashboard/control-center")).toBe("/app");
    expect(mapDashboardPathToApp("/dashboard/business")).toBe("/app/business");
    expect(mapDashboardPathToApp("/dashboard")).toBe("/app");
    expect(mapDashboardPathToApp("/dashboard/projects")).toBe("/app/crm?hub=projects");
  });
});
