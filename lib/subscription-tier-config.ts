/** ערכי רמת מנוי — תואם ל־enum SubscriptionTier ב־Prisma */
export type SubscriptionTierKey =
  | "FREE"
  | "HOUSEHOLD"
  | "DEALER"
  | "COMPANY"
  | "CORPORATE";

/** רמות לבחירה באדמין ובממשק */
export const ADMIN_SUBSCRIPTION_TIER_OPTIONS: SubscriptionTierKey[] = [
  "FREE",
  "HOUSEHOLD",
  "DEALER",
  "COMPANY",
  "CORPORATE",
];

export type TierAllowance = {
  cheapScans: number;
  premiumScans: number;
  maxCompanies: number;
  /** מחיר מנוי חודשי בשקלים; null = צור קשר / התאמה אישית */
  monthlyPriceIls: number | null;
};

const TIER_ALLOWANCES: Record<SubscriptionTierKey, TierAllowance> = {
  FREE: {
    cheapScans: 10,
    premiumScans: 0,
    maxCompanies: 1,
    monthlyPriceIls: 0,
  },
  HOUSEHOLD: {
    cheapScans: 50,
    premiumScans: 5,
    maxCompanies: 1,
    monthlyPriceIls: 59.9,
  },
  DEALER: {
    cheapScans: 100,
    premiumScans: 20,
    maxCompanies: 1,
    monthlyPriceIls: 99.9,
  },
  COMPANY: {
    cheapScans: 200,
    premiumScans: 50,
    maxCompanies: 2,
    monthlyPriceIls: 159.9,
  },
  CORPORATE: {
    cheapScans: 500,
    premiumScans: 50,
    maxCompanies: 99,
    monthlyPriceIls: 399.9,
  },
};

export function tierAllowance(tier: SubscriptionTierKey | string): TierAllowance {
  const t = parseSubscriptionTier(tier);
  return t ? TIER_ALLOWANCES[t] : TIER_ALLOWANCES.FREE;
}

export function tierLabelHe(tier: string): string {
  const u = (tier || "FREE").toUpperCase();
  switch (u) {
    case "FREE":
      return "חינם (ניסיון)";
    case "HOUSEHOLD":
      return "משק בית";
    case "DEALER":
      return "עוסק מורשה";
    case "COMPANY":
      return "חברה";
    case "CORPORATE":
      return "תאגיד";
    default:
      return tier;
  }
}

export function tierRank(tier: SubscriptionTierKey | string): number {
  const t = parseSubscriptionTier(tier) ?? "FREE";
  const order: SubscriptionTierKey[] = [
    "FREE",
    "HOUSEHOLD",
    "DEALER",
    "COMPANY",
    "CORPORATE",
  ];
  const i = order.indexOf(t);
  return i >= 0 ? i : 0;
}

export function parseSubscriptionTier(raw: string | null | undefined): SubscriptionTierKey | null {
  const u = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (
    u === "FREE" ||
    u === "HOUSEHOLD" ||
    u === "DEALER" ||
    u === "COMPANY" ||
    u === "CORPORATE"
  ) {
    return u;
  }
  return null;
}

/** מנויים בתשלום ישיר ב-PayPal (לא כולל FREE) */
export function paypalPurchasableTiers(): SubscriptionTierKey[] {
  return ADMIN_SUBSCRIPTION_TIER_OPTIONS.filter((t) => {
    if (t === "FREE") return false;
    return TIER_ALLOWANCES[t].monthlyPriceIls != null;
  });
}

export function defaultScanBalancesForTier(tier: SubscriptionTierKey | string): {
  cheapScansLeft: number;
  premiumScansLeft: number;
  maxCompanies: number;
} {
  const t = parseSubscriptionTier(tier) ?? "FREE";
  const a = TIER_ALLOWANCES[t];
  return {
    cheapScansLeft: a.cheapScans,
    premiumScansLeft: a.premiumScans,
    maxCompanies: a.maxCompanies,
  };
}

/** מיפוי ישן לרמה חדשה (מיגרציית נתונים / תצוגה) */
/** לטפסי אדמין — ערך + תווית עברית */
export function executiveTierOptionsForSelect(): { value: string; label: string }[] {
  return ADMIN_SUBSCRIPTION_TIER_OPTIONS.map((t) => ({
    value: t,
    label: `${tierLabelHe(t)} (${t})`,
  }));
}

export function legacyPlanToTierKey(plan: string | null | undefined): SubscriptionTierKey {
  const u = String(plan ?? "")
    .trim()
    .toUpperCase();
  switch (u) {
    case "PRO":
      return "HOUSEHOLD";
    case "BUSINESS":
      return "COMPANY";
    case "ENTERPRISE":
      return "CORPORATE";
    case "FREE":
    case "HOUSEHOLD":
    case "DEALER":
    case "COMPANY":
    case "CORPORATE":
      return u;
    default:
      return "FREE";
  }
}
