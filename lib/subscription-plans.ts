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
