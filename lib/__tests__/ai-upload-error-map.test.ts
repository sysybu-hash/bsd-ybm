import { mapProcessDocumentFailureToHttp } from "@/lib/ai-upload-error-map";

describe("mapProcessDocumentFailureToHttp", () => {
  it("returns 402 and gate-shaped body for QUOTA_EXCEEDED", () => {
    const { status, body } = mapProcessDocumentFailureToHttp({
      success: false,
      error: "אין יתרה",
      code: "QUOTA_EXCEEDED",
    });
    expect(status).toBe(402);
    expect(body).toEqual({
      ok: false,
      error: "אין יתרה",
      code: "QUOTA_EXCEEDED",
      billingUrl: "/app/settings/billing",
    });
  });

  it("passes through quota error text from server", () => {
    const { status, body } = mapProcessDocumentFailureToHttp({
      success: false,
      error: "אין יתרת סריקות",
      code: "QUOTA_EXCEEDED",
    });
    expect(status).toBe(402);
    expect(body.error).toBe("אין יתרת סריקות");
    expect(body.code).toBe("QUOTA_EXCEEDED");
  });

  it("returns 500 for other failures without code in body when missing", () => {
    const { status, body } = mapProcessDocumentFailureToHttp({
      success: false,
      error: "שגיאת שרת",
    });
    expect(status).toBe(500);
    expect(body).toEqual({ error: "שגיאת שרת" });
  });
});
