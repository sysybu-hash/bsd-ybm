"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft, Building, Check, Star, Zap } from "lucide-react";
import type { BillingWorkspacePlan } from "@/lib/billing-workspace-plan";
import {
  UpgradeCheckoutModal,
  type UpgradeCheckoutPlanDetails,
} from "@/components/billing/UpgradeCheckoutModal";

const REGISTER_TIER: Record<string, "DEALER" | "COMPANY" | "CORPORATE"> = {
  CHEAP: "DEALER",
  PREMIUM: "COMPANY",
  VIP: "CORPORATE",
};

type PlanRow = {
  id: keyof typeof REGISTER_TIER;
  name: string;
  icon: ReactNode;
  priceMonthly: number | string;
  priceAnnual: number | string;
  description: string;
  badge?: string;
  features: string[];
  css: string;
  buttonCss: string;
  highlight?: boolean;
};

const PLANS: PlanRow[] = [
  {
    id: "CHEAP",
    name: "חבילת בסיס",
    icon: <Star className="text-blue-500" size={24} aria-hidden />,
    priceMonthly: 199,
    priceAnnual: 159,
    description: "מושלם לקבלנים עצמאיים ועסקים קטנים",
    features: [
      "עד 100 סריקות מסמכים בחודש",
      "משתמש אחד (Admin)",
      "ניהול לקוחות ופרויקטים בסיסי",
      "תמיכה במייל",
    ],
    css: "border-gray-200 hover:border-blue-300",
    buttonCss: "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50",
  },
  {
    id: "PREMIUM",
    name: "חבילה מתקדמת",
    icon: <Zap className="text-amber-500" size={24} aria-hidden />,
    priceMonthly: 499,
    priceAnnual: 399,
    description: "לחברות בנייה שרוצות אוטומציה מלאה",
    badge: "הפופולרי ביותר",
    features: [
      "עד 1,000 סריקות מסמכים בחודש",
      "עד 5 משתמשי מערכת",
      "מחברת AI אוטונומית לפרויקטים",
      "סנכרון מלא ל-Meckano",
      "התראות חריגת מחיר בזמן אמת",
    ],
    css: "border-brand bg-brand/5 transform scale-105 shadow-xl relative z-10",
    buttonCss: "bg-brand text-white hover:bg-brand-dark shadow-md",
    highlight: true,
  },
  {
    id: "VIP",
    name: "רישוי ארגוני (VIP)",
    icon: <Building className="text-purple-500" size={24} aria-hidden />,
    priceMonthly: "מותאם אישית",
    priceAnnual: "מותאם אישית",
    description: "לארגונים גדולים ויזמים",
    features: [
      "סריקות מסמכים ללא הגבלה",
      "משתמשים והרשאות ללא הגבלה",
      "חיבור API פתוח למערכות חיצוניות",
      "מנהל תיק לקוח אישי",
      "הגדרות השדרה מותאמות אישית",
    ],
    css: "border-gray-200 hover:border-purple-300",
    buttonCss: "bg-slate-900 text-white hover:bg-slate-800",
  },
];

function buildUpgradeDetails(plan: PlanRow, isAnnual: boolean): UpgradeCheckoutPlanDetails {
  if (typeof plan.priceMonthly !== "number") {
    return {
      id: plan.id,
      name: plan.name,
      price: 0,
      isAnnual,
      features: plan.features,
      totalLabel: "בהתאמה אישית",
    };
  }
  const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
  return {
    id: plan.id,
    name: plan.name,
    price: price as number,
    isAnnual,
    features: plan.features,
  };
}

export type SubscriptionPlansComparisonProps = {
  currentPlan: BillingWorkspacePlan;
  /** אם לא מועבר, נפתח מודל PayPal; אם מועבר — רק הקריאה (למעקב / ניווט מותאם) */
  onUpgradeRequest?: (planId: string, options?: { isAnnual: boolean }) => void;
};

/**
 * כרטיסי שדרוג (תצוגה שיווקית) — שמות מסלול תואמים ל־mapSubscriptionTierToBillingPlan ב־lib/billing-workspace-plan.
 * לפעולת ברירת מחדל: ניווט ל־`/register?plan=` עם DEALER / COMPANY / CORPORATE.
 */
function SubscriptionPlansComparisonInner({
  currentPlan,
  onUpgradeRequest,
}: {
  currentPlan: BillingWorkspacePlan;
  onUpgradeRequest?: (planId: string, options?: { isAnnual: boolean }) => void;
}) {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="mx-auto max-w-7xl space-y-10 py-8">
      <div className="space-y-4 text-center">
        <h2 className="text-3xl font-bold text-text-primary">שדרוג מנוי למערכת BSD-YBM</h2>
        <p className="mx-auto max-w-2xl text-text-secondary">
          בחר את התוכנית שמתאימה לגודל העסק שלך. תוכל לשנות או לבטל את המנוי בכל עת.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3" dir="ltr">
          <span className={`text-sm font-medium ${!isAnnual ? "text-text-primary" : "text-text-secondary"}`}>
            תשלום חודשי
          </span>
          <button
            type="button"
            onClick={() => setIsAnnual((a) => !a)}
            className="relative flex h-7 w-14 items-center rounded-full bg-brand px-1 transition-colors"
            aria-pressed={isAnnual}
            aria-label={isAnnual ? "מעבר לתשלום חודשי" : "מעבר לתשלום שנתי"}
          >
            <span
              className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                !isAnnual ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? "text-text-primary" : "text-text-secondary"}`}>
            תשלום שנתי{" "}
            <span className="ms-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">חיסכון של 20%</span>
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 items-center gap-8 px-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-3xl border-2 p-8 transition-all duration-300 ${plan.css} ${
              plan.highlight ? "relative" : ""
            }`}
          >
            {plan.badge ? (
              <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-1.5 text-xs font-bold text-white shadow-md">
                {plan.badge}
              </div>
            ) : null}

            <div className="mb-4 flex items-center gap-3">
              {plan.icon}
              <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                {typeof plan.priceMonthly === "number" ? (
                  <>
                    <span className="text-4xl font-extrabold text-text-primary">
                      ₪{isAnnual ? plan.priceAnnual : plan.priceMonthly}
                    </span>
                    <span className="text-sm text-text-secondary">/ לחודש</span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-text-primary">{plan.priceMonthly}</span>
                )}
              </div>
              <p className="mt-2 min-h-[40px] text-sm text-text-secondary">{plan.description}</p>
            </div>
            <button
              type="button"
              onClick={() => onUpgradeRequest?.(plan.id, { isAnnual })}
              disabled={currentPlan === plan.id}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition-all ${plan.buttonCss} ${
                currentPlan === plan.id ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              {currentPlan === plan.id ? "התוכנית הנוכחית שלך" : "בחר בתוכנית זו"}
              {currentPlan !== plan.id ? <ArrowLeft size={18} aria-hidden /> : null}
            </button>
            <div className="mt-8 space-y-4">
              <p className="text-sm font-bold text-text-primary">מה כלול בחבילה?</p>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-text-secondary">
                    <Check className="mt-0.5 shrink-0 text-emerald-500" size={16} aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SubscriptionPlansComparison(props: SubscriptionPlansComparisonProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutDetails, setCheckoutDetails] = useState<UpgradeCheckoutPlanDetails | null>(null);

  const handle = props.onUpgradeRequest
    ? props.onUpgradeRequest
    : (planId: string, options?: { isAnnual: boolean }) => {
        const plan = PLANS.find((p) => p.id === planId);
        if (!plan) return;
        const isAnnual = options?.isAnnual ?? true;
        setCheckoutDetails(buildUpgradeDetails(plan, isAnnual));
        setCheckoutOpen(true);
      };

  return (
    <>
      <SubscriptionPlansComparisonInner {...props} onUpgradeRequest={handle} />
      <UpgradeCheckoutModal
        isOpen={checkoutOpen}
        onClose={() => {
          if (checkoutOpen) {
            setCheckoutOpen(false);
            setCheckoutDetails(null);
          }
        }}
        isProcessing={false}
        planDetails={checkoutDetails}
      />
    </>
  );
}
