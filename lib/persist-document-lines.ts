import { prisma } from "@/lib/prisma";
import { normalizeProductKey } from "@/lib/normalize-product-key";

type LineJson = {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  sku?: string;
};

function num(n: unknown): number | null {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  if (typeof n === "string" && n.trim()) {
    const v = parseFloat(n.replace(/,/g, ""));
    return Number.isFinite(v) ? v : null;
  }
  return null;
}

export type PersistLineItemsOptions = {
  /**
   * כשהתוצאה הגיעה ממטמון סריקה — שומרים שורות מסמך לצורכי תצוגה,
   * בלי ליצור שוב תצפיות מחיר (מניעת כפילות בלוח ההשוואות).
   */
  skipPriceObservations?: boolean;
};

export async function persistDocumentLineItemsFromAiData(
  documentId: string,
  organizationId: string,
  vendor: string | null,
  aiData: Record<string, unknown>,
  options?: PersistLineItemsOptions,
): Promise<void> {
  const skipObs = options?.skipPriceObservations === true;
  const raw = aiData.lineItems;
  if (!Array.isArray(raw) || raw.length === 0) return;

  const supplierName = vendor?.trim() || (typeof aiData.vendor === "string" ? aiData.vendor : null);

  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as LineJson;
    const desc = typeof r.description === "string" ? r.description.trim() : "";
    if (!desc) continue;

    const normalizedKey = normalizeProductKey(desc);
    const qty = num(r.quantity);
    const unitPrice = num(r.unitPrice);
    const lineTotal = num(r.lineTotal);
    const sku = typeof r.sku === "string" ? r.sku.trim() : null;

    await prisma.documentLineItem.create({
      data: {
        documentId,
        organizationId,
        supplierName,
        description: desc,
        normalizedKey,
        quantity: qty ?? undefined,
        unitPrice: unitPrice ?? undefined,
        lineTotal: lineTotal ?? undefined,
        sku: sku || undefined,
      },
    });

    const priceForObs = unitPrice ?? (qty && lineTotal ? lineTotal / qty : lineTotal);
    if (
      !skipObs &&
      priceForObs != null &&
      priceForObs > 0
    ) {
      await prisma.productPriceObservation.create({
        data: {
          organizationId,
          documentId,
          normalizedKey,
          description: desc,
          supplierName,
          unitPrice: priceForObs,
        },
      });
    }
  }
}
