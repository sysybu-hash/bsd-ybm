import { applyPayPalCaptureResult } from "@/lib/paypal-capture-apply";

const mockInvoiceFindUnique = jest.fn();
const mockOrganizationFindUnique = jest.fn();
const mockUserFindFirst = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    invoice: { findUnique: (...a: unknown[]) => mockInvoiceFindUnique(...a) },
    organization: { findUnique: (...a: unknown[]) => mockOrganizationFindUnique(...a) },
    user: { findFirst: (...a: unknown[]) => mockUserFindFirst(...a) },
    $transaction: jest.fn(),
  },
}));

describe("applyPayPalCaptureResult", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when currency is not ILS", async () => {
    mockInvoiceFindUnique.mockResolvedValue(null);
    const r = await applyPayPalCaptureResult({
      customIdFull: "org|BUNDLE|x",
      paidTotal: 100,
      currency: "USD",
      captureId: "cap_1",
    });
    expect(r).toEqual({ ok: false, status: 400, error: "מטבע לא צפוי" });
  });

  it("returns duplicate when invoice already exists for captureId", async () => {
    mockInvoiceFindUnique.mockResolvedValue({ id: "inv_existing" });
    const r = await applyPayPalCaptureResult({
      customIdFull: "org-id|TIER|PRO",
      paidTotal: 100,
      currency: "ILS",
      captureId: "cap_dup",
    });
    expect(r).toEqual({ ok: true, duplicate: true });
    expect(mockOrganizationFindUnique).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid custom_id", async () => {
    mockInvoiceFindUnique.mockResolvedValue(null);
    const r = await applyPayPalCaptureResult({
      customIdFull: "only-one-part",
      paidTotal: 100,
      currency: "ILS",
      captureId: "cap_2",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(400);
  });

  it("returns 403 when sessionOrgId does not match custom org", async () => {
    mockInvoiceFindUnique.mockResolvedValue(null);
    const r = await applyPayPalCaptureResult({
      customIdFull: "org-a|TIER|PRO",
      paidTotal: 100,
      currency: "ILS",
      captureId: "cap_3",
      sessionOrgId: "org-b",
    });
    expect(r).toEqual({ ok: false, status: 403, error: "ההזמנה לא תואמת לארגון" });
  });

  it("returns 404 when organization missing", async () => {
    mockInvoiceFindUnique.mockResolvedValue(null);
    mockOrganizationFindUnique.mockResolvedValue(null);
    const r = await applyPayPalCaptureResult({
      customIdFull: "missing-org|TIER|PRO",
      paidTotal: 100,
      currency: "ILS",
      captureId: "cap_4",
    });
    expect(r).toEqual({ ok: false, status: 404, error: "ארגון לא נמצא" });
  });

  it("returns 400 for unknown order kind after org resolved", async () => {
    mockInvoiceFindUnique.mockResolvedValue(null);
    mockOrganizationFindUnique.mockResolvedValue({
      name: "Test Org",
      companyType: "LTD",
      isReportable: false,
    });
    mockUserFindFirst.mockResolvedValue({ email: "a@b.c" });
    const r = await applyPayPalCaptureResult({
      customIdFull: "org-real|UNKNOWN|payload",
      paidTotal: 100,
      currency: "ILS",
      captureId: "cap_5",
    });
    expect(r).toEqual({ ok: false, status: 400, error: "סוג הזמנה לא מוכר" });
  });
});
