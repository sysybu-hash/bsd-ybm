"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
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
      className="relative z-30 mx-4 mb-24 rounded-[4rem] border border-slate-100 bg-slate-50 p-16 text-right shadow-2xl shadow-slate-200/40 md:mx-10 md:p-24"
    >
      <div className="text-center mb-16">
        <span className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
          {t("landing.pricingBadge")}
        </span>
        <h3 className="text-5xl font-black text-slate-900 tracking-tighter mt-4">
          {t("landing.pricingHeadline")}
        </h3>
        <p className="mt-4 text-slate-500 font-medium max-w-2xl mx-auto text-sm">
          חמש רמות מנוי — סריקות זולות (Gemini) ופרימיום (OpenAI / Claude). תשלום חודשי ב־PayPal בשקלים.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-8 mt-12 items-stretch">
        {ADMIN_SUBSCRIPTION_TIER_OPTIONS.map((tierKey) => {
          const a = tierAllowance(tierKey);
          const price =
            a.monthlyPriceIls != null ? `₪${a.monthlyPriceIls.toFixed(2)}` : "₪0";
          const popular = a.recommended === true;
          return (
            <div
              key={tierKey}
              className={`relative flex flex-col rounded-[3rem] p-10 border shadow-xl transition-all ${
                popular
                  ? "bg-white border-violet-200 ring-4 ring-violet-100 scale-[1.02] z-[1]"
                  : "bg-white border-slate-100 hover:border-blue-100"
              }`}
            >
              {popular ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-4 py-1 text-[10px] font-black text-white uppercase tracking-widest shadow-md">
                  מומלץ
                </span>
              ) : null}
              <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-700">
                {tierLabelHe(tierKey)}
              </span>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">{tierKey}</p>
              <h4 className="text-4xl font-black text-slate-900 mt-4 leading-none tabular-nums">{price}</h4>
              <p className="text-sm text-slate-400 mt-1 font-medium">
                {tierKey === "FREE" ? "ניסיון חודש · ללא חיוב" : "לחודש + מע״מ לפי סיווג"}
              </p>
              <ul className="mt-8 space-y-4 text-slate-600 font-medium text-base flex-1">
                <li className="flex items-start gap-3">
                  <Zap size={16} className="shrink-0 text-sky-500 mt-1" />
                  <span>
                    <strong className="text-slate-800">{a.cheapScans}</strong> סריקות זולות
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap size={16} className="shrink-0 text-violet-500 mt-1" />
                  <span>
                    <strong className="text-slate-800">{a.premiumScans}</strong> סריקות פרימיום
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap size={16} className="shrink-0 text-slate-400 mt-1" />
                  <span>
                    {a.unlimitedCompanies ? (
                      <>חברות ללא הגבלה (מעשית)</>
                    ) : (
                      <>
                        עד <strong className="text-slate-800">{a.maxCompanies}</strong> חברות / ישויות
                      </>
                    )}
                  </span>
                </li>
              </ul>
              <Link
                href="/register"
                className={`mt-10 w-full block text-center px-8 py-4 rounded-2xl font-black text-lg transition-all ${
                  popular
                    ? "bg-gradient-to-tr from-violet-700 to-indigo-600 text-white shadow-lg shadow-violet-200/50 hover:scale-[1.02]"
                    : "bg-gradient-to-tr from-slate-700 to-indigo-600 text-white shadow-lg shadow-slate-300/50 hover:scale-[1.02]"
                }`}
              >
                {t("landing.pricingChoose")}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
