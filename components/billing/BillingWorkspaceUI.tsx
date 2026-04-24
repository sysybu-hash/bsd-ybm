"use client";

import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { CreditCard, Server, ShieldCheck, Zap } from "lucide-react";

/** תצוגה ממופה ממסלולי Prisma; לא תואם 1:1 לשמות API */
export type BillingWorkspacePlan = "FREE" | "CHEAP" | "PREMIUM" | "VIP";

export type BillingWorkspaceUIProps = {
  organizationName: string;
  subscriptionPlan: BillingWorkspacePlan;
  scanQuotaTotal: number;
  scanQuotaUsed: number;
  nextBillingDate?: string | null;
  upgradeHref?: string;
  addOnHref?: string;
};

function planLabel(plan: BillingWorkspacePlan): { title: string } {
  switch (plan) {
    case "CHEAP":
      return { title: "תוכנית בסיס (Household / Dealer)" };
    case "PREMIUM":
      return { title: "תוכנית מתקדמת (Company)" };
    case "VIP":
      return { title: "חשבון ארגוני (Corporate)" };
    default:
      return { title: "גרסת ניסיון (Free)" };
  }
}

/**
 * שכבת מבט-על לחיוב: תוכנית, מכסת סריקה וקישורי PayPal/מסלול
 */
export function BillingWorkspaceUI({
  organizationName,
  subscriptionPlan,
  scanQuotaTotal,
  scanQuotaUsed,
  nextBillingDate,
  upgradeHref = "/app/settings/billing",
  addOnHref = "/app/settings/billing",
}: BillingWorkspaceUIProps) {
  const safeTotal = Math.max(1, scanQuotaTotal);
  const usagePercentage = Math.min(100, Math.round((scanQuotaUsed / safeTotal) * 100)) || 0;
  const isNearLimit = usagePercentage > 85;
  const { title: planTitle } = planLabel(subscriptionPlan);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">חיוב ומנויים (Billing)</h1>
        <p className="mt-1 text-text-secondary">
          ניהול חבילות סריקה, רישוי ופרטי תשלום עבור {organizationName}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard className="relative overflow-hidden lg:col-span-2" title="התוכנית הנוכחית">
          {subscriptionPlan === "PREMIUM" && (
            <div className="absolute end-0 top-0 translate-x-[20%] translate-y-[40%] rotate-45 transform bg-gradient-to-l from-amber-500 to-amber-700 px-10 py-1 text-xs font-bold text-white shadow-md">
              COMPANY
            </div>
          )}
          {subscriptionPlan === "VIP" && (
            <div className="absolute end-0 top-0 translate-x-[20%] translate-y-[40%] rotate-45 transform bg-gradient-to-l from-violet-500 to-violet-800 px-10 py-1 text-xs font-bold text-white shadow-md">
              CORPORATE
            </div>
          )}
          <div className="mt-4 flex flex-col items-start gap-8 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <h2 className="mb-2 text-2xl font-bold text-text-primary">{planTitle}</h2>
              <p className="mb-6 text-sm leading-relaxed text-text-secondary">
                התוכנית כוללת גישה למנועי ה-AI לפי מסלול, אינטגרציות (כולל מקאנו לפי הרשאה) ו-CRM. לשדרוג
                או לרכישת מסלול — השתמשו בפעולות בצד.
              </p>

              <div className="space-y-3">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-text-primary">ניצול מכסת סריקות (סה״כ זול+פרימיום)</span>
                  <span
                    className={isNearLimit ? "font-bold text-red-500" : "text-text-secondary"}
                  >
                    {scanQuotaUsed} / {scanQuotaTotal}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      isNearLimit ? "bg-red-500" : "bg-brand"
                    }`}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
                {isNearLimit && (
                  <p className="text-xs text-red-500">
                    המכסה עומדת להיגמר. שקלו שדרוג או רכישת הוספה כדי לא לעצור אוטומציה.
                  </p>
                )}
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="פעולות חיוב" className="border-brand-light/30 bg-brand-surface">
          <div className="mt-2 flex flex-col gap-4">
            <Link
              href={upgradeHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-medium text-white shadow-md transition-all hover:bg-brand-dark"
            >
              <Zap size={18} />
              שדרוג תוכנית
            </Link>
            <Link
              href={addOnHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 font-medium text-text-primary transition-all hover:bg-gray-50"
            >
              <Server size={18} />
              מסלול חיוב / תוספות
            </Link>
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <CreditCard size={16} aria-hidden />
                <span>תשלומי פלטפורמה: PayPal (בהגדרות)</span>
              </div>
              {nextBillingDate && (
                <div className="mt-2 flex items-center gap-3 text-sm text-text-secondary">
                  <ShieldCheck size={16} aria-hidden />
                  <span>תאריך רלוונטי: {new Date(nextBillingDate).toLocaleDateString("he-IL")}</span>
                </div>
              )}
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

export function mapSubscriptionTierToBillingPlan(tier: string): BillingWorkspacePlan {
  const u = (tier || "FREE").toUpperCase();
  if (u === "CORPORATE") return "VIP";
  if (u === "COMPANY") return "PREMIUM";
  if (u === "HOUSEHOLD" || u === "DEALER") return "CHEAP";
  return "FREE";
}
