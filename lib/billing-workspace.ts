export type InsuranceExpenseLine = { label: string; amountNis: number };

export type BillingWorkspaceV1 = {
  v: 1;
  insuranceLines: InsuranceExpenseLine[];
  /** 1–5 חום המלצה, או none */
  referralLevel: "none" | "1" | "2" | "3" | "4" | "5";
  referralNotes: string;
  /** מה לומר לחבר לפני שמזמינים אותו — חינם + PayPal */
  onboardingFreePitch: string;
};

export const DEFAULT_BILLING_WORKSPACE: BillingWorkspaceV1 = {
  v: 1,
  insuranceLines: [],
  referralLevel: "none",
  referralNotes: "",
  onboardingFreePitch:
    "הקמתי לך חשבון ב־BSD-YBM — הכניסה והשימוש הבסיסי חינם. כשתרצה לשדרג מנוי או לשלם על שירות, התשלום מאובטח דרך PayPal לפי הקישור שאשלח.",
};

export function parseBillingWorkspace(raw: unknown): BillingWorkspaceV1 {
  const base = { ...DEFAULT_BILLING_WORKSPACE };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return base;
  }
  const o = raw as Record<string, unknown>;

  const linesRaw = o.insuranceLines;
  const insuranceLines: InsuranceExpenseLine[] = [];
  if (Array.isArray(linesRaw)) {
    for (const item of linesRaw) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const label = String(row.label ?? "").trim().slice(0, 200);
      const amt = Number(row.amountNis);
      if (!label || !Number.isFinite(amt) || amt < 0) continue;
      insuranceLines.push({ label, amountNis: Math.round(amt * 100) / 100 });
    }
  }

  const ref = String(o.referralLevel ?? "none");
  const referralLevel =
    ref === "1" || ref === "2" || ref === "3" || ref === "4" || ref === "5" || ref === "none"
      ? ref
      : "none";

  return {
    v: 1,
    insuranceLines,
    referralLevel,
    referralNotes: String(o.referralNotes ?? "").slice(0, 4000),
    onboardingFreePitch: String(o.onboardingFreePitch ?? base.onboardingFreePitch).slice(0, 4000),
  };
}

export function sumInsuranceLines(lines: InsuranceExpenseLine[]): number {
  return lines.reduce((s, l) => s + (Number.isFinite(l.amountNis) ? l.amountNis : 0), 0);
}
