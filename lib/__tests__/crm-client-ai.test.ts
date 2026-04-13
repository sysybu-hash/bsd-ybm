import {
  buildTableDataFromInvoices,
  payPlusFeeIls,
} from "@/lib/crm-client-ai";

describe("crm-client-ai", () => {
  test("calculates PayPlus fee and net with currency rounding", () => {
    expect(payPlusFeeIls(412.37)).toEqual({
      fee: 6.15,
      net: 406.22,
    });
  });

  test("builds table data from invoice rows", () => {
    const rows = buildTableDataFromInvoices([
      {
        id: "inv_1",
        amount: 100,
        status: "PAID",
        description: " Consulting ",
        paidAt: new Date("2026-04-01T10:00:00.000Z"),
        createdAt: new Date("2026-03-31T10:00:00.000Z"),
      },
      {
        id: "inv_2",
        amount: null,
        status: "PENDING",
        description: null,
        paidAt: null,
        createdAt: new Date("2026-04-02T12:00:00.000Z"),
      },
    ]);

    expect(rows).toEqual([
      {
        id: "inv_1",
        date: "2026-04-01",
        label: "Consulting",
        amountGross: 100,
        feePayPlus: 2.4,
        net: 97.6,
        status: "PAID",
      },
      {
        id: "inv_2",
        date: "2026-04-02",
        label: "חשבונית · PENDING",
        amountGross: 0,
        feePayPlus: 1.2,
        net: -1.2,
        status: "PENDING",
      },
    ]);
  });
});
