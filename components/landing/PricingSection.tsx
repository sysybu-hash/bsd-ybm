"use client";

import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import {
  ADMIN_SUBSCRIPTION_TIER_OPTIONS,
  tierAllowance,
  tierLabelHe,
} from "@/lib/subscription-tier-config";

export default function PricingSection() {
  const { t } = useI18n();

  return (
    <section
      id="pricing"
      className="bg-[color:var(--canvas-raised)] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* כותרת */}
        <div className="mb-14 text-center">
          <span className="inline-block rounded-full border border-orange-200/90 bg-orange-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[color:var(--primary-color)]">
            {t("landing.pricingBadge")}
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[color:var(--ink-900)] sm:text-4xl">
            {t("landing.pricingHeadline")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-[color:var(--ink-400)] sm:text-base">
            חמש רמות מנוי — מכסות סריקה לפי מסלול. מתאים לצוותים בענף הבנייה ולמקצועות הנלווים.
          </p>
        </div>

        {/* כרטיסי מחיר */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5 items-stretch">
          {ADMIN_SUBSCRIPTION_TIER_OPTIONS.map((tierKey) => {
            const a = tierAllowance(tierKey);
            const price =
              a.monthlyPriceIls != null ? `₪${a.monthlyPriceIls.toFixed(0)}` : "₪0";
            const popular = a.recommended === true;

            return (
              <div
                key={tierKey}
                className={`relative flex flex-col rounded-2xl border p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                  popular
                    ? "border-orange-300/50 text-white shadow-orange-900/25 ring-2 ring-orange-200/80"
                    : "border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-700)] hover:border-orange-200/80"
                }`}
                style={
                  popular
                    ? {
                        backgroundColor: "var(--primary-color)",
                        boxShadow: "0 20px 50px -24px rgba(193, 89, 47, 0.55)",
                      }
                    : undefined
                }
              >
                {popular ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[color:var(--canvas-raised)] px-4 py-1 text-[10px] font-black text-[color:var(--primary-color)] shadow-md ring-1 ring-orange-200">
                    ⭐ מומלץ
                  </span>
                ) : null}

                {/* Badge tier */}
                <span
                  className={`inline-block w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                    popular ? "bg-white/20 text-white" : "bg-[color:var(--canvas-sunken)] text-[color:var(--ink-500)]"
                  }`}
                >
                  {tierLabelHe(tierKey)}
                </span>

                {/* מחיר */}
                <div className="mt-5">
                  <span className={`text-4xl font-black tabular-nums ${popular ? "text-white" : "text-[color:var(--ink-900)]"}`}>
                    {price}
                  </span>
                  <span className={`ms-1 text-xs font-medium ${popular ? "text-white/90" : "text-[color:var(--ink-400)]"}`}>
                    {tierKey === "FREE" ? "/ ניסיון חינם" : "/ חודש + מע״מ"}
                  </span>
                </div>

                {/* Features */}
                <ul className={`mt-6 flex-1 space-y-3 text-sm ${popular ? "text-white/95" : "text-[color:var(--ink-500)]"}`}>
                  <li className="flex items-start gap-2.5">
                    <Check size={15} className={`mt-0.5 shrink-0 ${popular ? "text-white/90" : "text-[color:var(--primary-color)]"}`} />
                    <span>
                      <strong className={popular ? "text-white" : "text-[color:var(--ink-700)]"}>{a.cheapScans}</strong> סריקות Gemini
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Zap size={15} className={`mt-0.5 shrink-0 ${popular ? "text-white/90" : "text-[color:var(--primary-color)]"}`} />
                    <span>
                      <strong className={popular ? "text-white" : "text-[color:var(--ink-700)]"}>{a.premiumScans}</strong> סריקות פרימיום
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={15} className={`mt-0.5 shrink-0 ${popular ? "text-white/90" : "text-[color:var(--ink-400)]"}`} />
                    <span>
                      {a.unlimitedCompanies ? (
                        "חברות ללא הגבלה"
                      ) : (
                        <>עד <strong className={popular ? "text-white" : "text-[color:var(--ink-700)]"}>{a.maxCompanies}</strong> חברות</>
                      )}
                    </span>
                  </li>
                </ul>

                {/* CTA */}
                <Link
                  href={`/register?plan=${tierKey}`}
                  className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-black transition hover:opacity-90 ${
                    popular
                      ? "bg-[color:var(--canvas-raised)] text-[color:var(--primary-color)] shadow-sm"
                      : "border border-[color:var(--line-strong)] bg-[color:var(--canvas-sunken)] text-[color:var(--ink-700)] hover:border-orange-300/60 hover:bg-orange-50/80"
                  }`}
                >
                  {t("landing.pricingChoose")}
                </Link>
              </div>
            );
          })}
        </div>

        {/* הערת מחיר */}
        <p className="mt-8 text-center text-xs text-[color:var(--ink-400)]">
          * המחירים אינם כוללים מע״מ. תשלום באמצעות PayPal / Pay Plus. ניסיון חינמי ל-30 יום.
        </p>
      </div>
    </section>
  );
}
