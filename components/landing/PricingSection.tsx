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
      className="bg-white py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* כותרת */}
        <div className="mb-14 text-center">
          <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700">
            {t("landing.pricingBadge")}
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            {t("landing.pricingHeadline")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-slate-500 sm:text-base">
            חמש רמות מנוי — סריקות Gemini ופרימיום. תשלום חודשי בשקלים.
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
                    ? "border-blue-300 bg-blue-600 text-white shadow-blue-200/60 ring-2 ring-blue-200"
                    : "border-slate-200 bg-white text-slate-900 hover:border-blue-200"
                }`}
              >
                {popular ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-1 text-[10px] font-black text-blue-700 shadow-md ring-1 ring-blue-200">
                    ⭐ מומלץ
                  </span>
                ) : null}

                {/* Badge tier */}
                <span
                  className={`inline-block w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                    popular ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tierLabelHe(tierKey)}
                </span>

                {/* מחיר */}
                <div className="mt-5">
                  <span className={`text-4xl font-black tabular-nums ${popular ? "text-white" : "text-slate-900"}`}>
                    {price}
                  </span>
                  <span className={`text-xs font-medium ms-1 ${popular ? "text-blue-100" : "text-slate-400"}`}>
                    {tierKey === "FREE" ? "/ ניסיון חינם" : "/ חודש + מע״מ"}
                  </span>
                </div>

                {/* Features */}
                <ul className={`mt-6 flex-1 space-y-3 text-sm ${popular ? "text-blue-50" : "text-slate-600"}`}>
                  <li className="flex items-start gap-2.5">
                    <Check size={15} className={`mt-0.5 shrink-0 ${popular ? "text-blue-200" : "text-blue-500"}`} />
                    <span>
                      <strong className={popular ? "text-white" : "text-slate-800"}>{a.cheapScans}</strong> סריקות Gemini
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Zap size={15} className={`mt-0.5 shrink-0 ${popular ? "text-blue-200" : "text-indigo-500"}`} />
                    <span>
                      <strong className={popular ? "text-white" : "text-slate-800"}>{a.premiumScans}</strong> סריקות פרימיום
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={15} className={`mt-0.5 shrink-0 ${popular ? "text-blue-200" : "text-slate-400"}`} />
                    <span>
                      {a.unlimitedCompanies ? (
                        "חברות ללא הגבלה"
                      ) : (
                        <>עד <strong className={popular ? "text-white" : "text-slate-800"}>{a.maxCompanies}</strong> חברות</>
                      )}
                    </span>
                  </li>
                </ul>

                {/* CTA */}
                <Link
                  href="/register"
                  className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-black transition hover:opacity-90 ${
                    popular
                      ? "bg-white text-blue-700 shadow-sm"
                      : "border border-slate-200 bg-slate-50 text-slate-800 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {t("landing.pricingChoose")}
                </Link>
              </div>
            );
          })}
        </div>

        {/* הערת מחיר */}
        <p className="mt-8 text-center text-xs text-slate-400">
          * המחירים אינם כוללים מע״מ. תשלום באמצעות PayPal / Pay Plus. ניסיון חינמי ל-30 יום.
        </p>
      </div>
    </section>
  );
}
