import {
  getHiddenPrimaryRouteIds,
  pathnameToWorkspacePrimaryRoute,
  resolveWorkspaceFeatures,
} from "@/lib/workspace-features";

describe("workspace-features", () => {
  it("מחזיר הכול כשהתעשייה בנייה ואין denylist למקצוע", () => {
    const hidden = getHiddenPrimaryRouteIds({
      role: "ORG_ADMIN",
      industryId: "CONSTRUCTION",
      constructionTradeId: "ELECTRICAL",
      hasOrganization: true,
      hasMeckanoAccess: true,
      subscriptionTier: "PRO",
      subscriptionStatus: "ACTIVE",
    });
    expect(hidden.size).toBe(0);
  });

  it("מציג תפעול גם מחוץ לבנייה (מודול ארגון-רוחבי)", () => {
    const hidden = getHiddenPrimaryRouteIds({
      role: "ORG_ADMIN",
      industryId: "LEGAL",
      hasOrganization: true,
      hasMeckanoAccess: false,
      subscriptionTier: "FREE",
      subscriptionStatus: "ACTIVE",
    });
    expect(hidden.has("operations")).toBe(false);
  });

  it("pathnameToWorkspacePrimaryRoute מזהה מקטע ראשי", () => {
    expect(pathnameToWorkspacePrimaryRoute("/app")).toBe("home");
    expect(pathnameToWorkspacePrimaryRoute("/app/erp")).toBe("erp");
    expect(pathnameToWorkspacePrimaryRoute("/app/crm")).toBe("crm");
    expect(pathnameToWorkspacePrimaryRoute("/app/operations/meckano")).toBe("operations");
    expect(pathnameToWorkspacePrimaryRoute("/app/admin")).toBeNull();
    // נתיבים ישנים מנותבים מחדש
    expect(pathnameToWorkspacePrimaryRoute("/app/finance")).toBe("erp");
    expect(pathnameToWorkspacePrimaryRoute("/app/clients")).toBe("crm");
    expect(pathnameToWorkspacePrimaryRoute("/app/ai")).toBe("home");
    expect(pathnameToWorkspacePrimaryRoute("/app/inbox")).toBe("home");
  });

  it("resolveWorkspaceFeatures מחזיר סט מלא לברירת מחדל", () => {
    const f = resolveWorkspaceFeatures({
      role: "ORG_ADMIN",
      industryId: "CONSTRUCTION",
      hasOrganization: true,
      hasMeckanoAccess: true,
      subscriptionTier: "PRO",
      subscriptionStatus: "ACTIVE",
    });
    expect(f.has("module_crm")).toBe(true);
    expect(f.has("module_erp")).toBe(true);
    expect(f.has("module_operations")).toBe(true);
  });
});
