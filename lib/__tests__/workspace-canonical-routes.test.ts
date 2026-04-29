import { WORKSPACE_ROUTES } from "@/lib/workspace-canonical-routes";

describe("workspace-canonical-routes", () => {
  it("כל הנתיבים מתחילים ב-/app", () => {
    for (const path of Object.values(WORKSPACE_ROUTES)) {
      expect(path.startsWith("/app")).toBe(true);
    }
  });
});
