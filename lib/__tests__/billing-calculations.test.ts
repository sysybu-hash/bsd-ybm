import {
  VAT_RATE,
  calculateIssuedDocumentTotals,
  calculatePayPlusNet,
  calculateTotals,
} from "@/lib/billing-calculations";

const COMPANY_TYPE = {
  EXEMPT_DEALER: "EXEMPT_DEALER",
  LICENSED_DEALER: "LICENSED_DEALER",
  LTD_COMPANY: "LTD_COMPANY",
} as const;

describe("billing-calculations", () => {
  test("applies VAT for reportable licensed dealers", () => {
    expect(calculateTotals(100, COMPANY_TYPE.LICENSED_DEALER)).toEqual({
      net: 100,
      vat: 100 * VAT_RATE,
      total: 117,
      isExempt: false,
    });
  });

  test("does not apply VAT for exempt dealers", () => {
    expect(calculateTotals(100, COMPANY_TYPE.EXEMPT_DEALER)).toEqual({
      net: 100,
      vat: 0,
      total: 100,
      isExempt: true,
    });
  });

  test("treats non-reportable issued documents as internal memos", () => {
    expect(
      calculateIssuedDocumentTotals(250, COMPANY_TYPE.LTD_COMPANY, false),
    ).toEqual({
      net: 250,
      vat: 0,
      total: 250,
      isExempt: true,
      isInternalMemo: true,
    });
  });

  test("calculates PayPlus net with rounded fee", () => {
    expect(calculatePayPlusNet(100)).toEqual({
      fee: 2.4,
      net: 97.6,
    });
  });
});
