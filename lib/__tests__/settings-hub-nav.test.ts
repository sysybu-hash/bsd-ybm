import { legacyTabToSegment, settingsHubPath } from "@/lib/settings-hub-nav";

describe("settings-hub-nav", () => {
  test("legacyTabToSegment maps old tab names", () => {
    expect(legacyTabToSegment("portal")).toBe("presence");
    expect(legacyTabToSegment("billing")).toBe("billing");
    expect(legacyTabToSegment("subscription")).toBe("billing");
    expect(legacyTabToSegment("ai")).toBe("stack");
    expect(legacyTabToSegment("integrations")).toBe("stack");
  });

  test("legacyTabToSegment returns null for empty or unknown", () => {
    expect(legacyTabToSegment("")).toBeNull();
    expect(legacyTabToSegment("nope")).toBeNull();
  });

  test("settingsHubPath builds nested routes", () => {
    expect(settingsHubPath("overview")).toBe("/app/settings/overview");
    expect(settingsHubPath("billing")).toBe("/app/settings/billing");
  });
});
