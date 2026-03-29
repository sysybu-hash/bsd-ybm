/** תואם לדף billing ולשדה Organization.plan */
export const ADMIN_PLAN_OPTIONS = ["FREE", "PRO", "BUSINESS", "ENTERPRISE"] as const;
export type AdminPlanId = (typeof ADMIN_PLAN_OPTIONS)[number];

export function planDefaultCredits(plan: string): number {
  switch (plan) {
    case "FREE":
      return 5;
    case "PRO":
      return 120;
    case "BUSINESS":
      return 600;
    case "ENTERPRISE":
      return 5000;
    default:
      return 5;
  }
}

export function planLabelHe(plan: string): string {
  switch (plan) {
    case "FREE":
      return "חינם";
    case "PRO":
      return "Pro";
    case "BUSINESS":
      return "Business";
    case "ENTERPRISE":
      return "Enterprise";
    default:
      return plan;
  }
}

/** מחיר מנוי חודשי בשקלים לתשלום PayPal (Live) — עדכן לפי המחירון שלך */
export function planPriceIls(plan: string): number | null {
  switch (plan) {
    case "PRO":
      return 199;
    case "BUSINESS":
      return 299;
    case "ENTERPRISE":
      return null;
    default:
      return null;
  }
}

export function isPlanPayPalPurchasable(plan: string): boolean {
  return planPriceIls(plan) != null;
}
