/**
 * ציון פענוח לצורך בחירת "תוצאה מומלצת" בין מנועים (ללא קריאה ל-LLM נוסף).
 */
export function scoreExtractedDocument(ai: Record<string, unknown> | undefined): number {
  if (!ai || typeof ai !== "object") return 0;
  let s = 0;
  const vendor = ai.vendor;
  if (typeof vendor === "string" && vendor.trim().length > 1) s += 3;
  const total = ai.total;
  if (typeof total === "number" && Number.isFinite(total) && total > 0) s += 3;
  if (typeof total === "string" && total.trim()) {
    const n = parseFloat(total.replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) s += 2;
  }
  const lineItems = ai.lineItems;
  if (Array.isArray(lineItems)) {
    s += Math.min(6, lineItems.length * 2);
  }
  const summary = ai.summary;
  if (typeof summary === "string" && summary.trim().length > 15) s += 2;
  const docType = ai.docType;
  if (typeof docType === "string" && docType.trim()) s += 1;
  return s;
}

export function pickBestEngineIndex(
  engines: { ok: boolean; aiData?: Record<string, unknown> }[],
): number {
  let best = -1;
  let bestScore = -1;
  engines.forEach((e, i) => {
    if (!e.ok) return;
    const sc = scoreExtractedDocument(e.aiData);
    if (sc > bestScore) {
      bestScore = sc;
      best = i;
    }
  });
  return best;
}
