import {
  canAccessPlatformAdmin,
  canManageOrganization,
  getSubscriptionStatusLabel,
  getVisibleUtilitySectionIds,
  getWorkspaceModeLabel,
  getWorkspaceRoleLabel,
  getWorkspaceTierLabel,
  hasActiveWorkspaceSubscription,
  isOrgAdminRole,
  isWorkspaceManagerRole,
} from "@/lib/workspace-access";

describe("workspace-access", () => {
  test("recognizes org admin and project manager roles correctly", () => {
    expect(isOrgAdminRole("ORG_ADMIN")).toBe(true);
    expect(isOrgAdminRole("SUPER_ADMIN")).toBe(true);
    expect(isOrgAdminRole("CLIENT")).toBe(false);

    expect(isWorkspaceManagerRole("PROJECT_MGR")).toBe(true);
    expect(isWorkspaceManagerRole("EMPLOYEE")).toBe(false);
  });

  test("separates platform admin from org management", () => {
    expect(
      canManageOrganization({
        role: "ORG_ADMIN",
        isPlatformAdmin: false,
      }),
    ).toBe(true);

    expect(
      canAccessPlatformAdmin({
        role: "ORG_ADMIN",
        isPlatformAdmin: false,
      }),
    ).toBe(false);

    expect(
      canAccessPlatformAdmin({
        role: "CLIENT",
        isPlatformAdmin: true,
      }),
    ).toBe(true);
  });

  test("returns readable labels for role, mode, tier and status", () => {
    expect(
      getWorkspaceRoleLabel({
        role: "ORG_ADMIN",
      }),
    ).toBe("מנהל ארגון");

    expect(
      getWorkspaceModeLabel({
        role: "CLIENT",
      }),
    ).toBe("צפייה");

    expect(
      getWorkspaceTierLabel({
        subscriptionTier: "COMPANY",
      }),
    ).toContain("חברה");

    expect(getSubscriptionStatusLabel("PENDING_APPROVAL")).toBe("ממתין לאישור");
  });

  test("flags active subscription states and visible utility sections", () => {
    expect(hasActiveWorkspaceSubscription("ACTIVE")).toBe(true);
    expect(hasActiveWorkspaceSubscription("PENDING_APPROVAL")).toBe(true);
    expect(hasActiveWorkspaceSubscription("INACTIVE")).toBe(false);

    expect(
      getVisibleUtilitySectionIds({
        role: "CLIENT",
        isPlatformAdmin: false,
      }),
    ).toEqual(["help", "business"]);

    expect(
      getVisibleUtilitySectionIds({
        role: "SUPER_ADMIN",
        isPlatformAdmin: true,
      }),
    ).toEqual(["help", "business", "admin"]);
  });
});
