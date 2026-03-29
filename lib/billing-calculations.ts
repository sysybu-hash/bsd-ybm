import { CompanyType } from "@prisma/client";
import { payPlusFeeIls } from "@/lib/crm-client-ai";

/** שיעור מע״מ לעוסק מורשה / חברה בע״מ (יש לעדכן מול חוק בפועל) */
export const VAT_RATE = 0.17;

export function calculateTotals(netAmount: number, type: CompanyType) {
  const isExempt = type === CompanyType.EXEMPT_DEALER;
  const vat = isExempt ? 0 : netAmount * VAT_RATE;

  return {
    net: netAmount,
    vat,
    total: netAmount + vat,
    isExempt,
  };
}

/** עמלת PayPlus: 1.2% + ‎₪1.20 — אותה לוגיקה כמו ב-CRM (עיגול אגורות) */
export function calculatePayPlusNet(grossAmount: number) {
  return payPlusFeeIls(grossAmount);
}
