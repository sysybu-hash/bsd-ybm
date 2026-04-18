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

  it("מסתיר תפעול כשלא CONSTRUCTION", () => {
    const hidden = getHiddenPrimaryRouteIds({
      role: "ORG_ADMIN",
      industryId: "LEGAL",
      hasOrganization: true,
      hasMeckanoAccess: false,
      subscriptionTier: "FREE",
      subscriptionStatus: "ACTIVE",
    });
    expect(hidden.has("operations")).toBe(true);
  });

  it("pathnameToWorkspacePrimaryRoute מזהה מקטע ראשי", () => {
    expect(pathnameToWorkspacePrimaryRoute("/app")).toBe("home");
    expect(pathnameToWorkspacePrimaryRoute("/app/operations/meckano")).toBe("operations");
    expect(pathnameToWorkspacePrimaryRoute("/app/admin")).toBeNull();
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
    expect(f.has("module_insights")).toBe(true);
  });
});
