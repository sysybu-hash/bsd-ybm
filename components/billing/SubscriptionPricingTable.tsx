"use client";

import { useI18n } from "@/components/I18nProvider";
import { tierAllowance, tierLabelHe, type SubscriptionTierKey } from "@/lib/subscription-tier-config";

const ORDER: SubscriptionTierKey[] = [
  "FREE",
  "HOUSEHOLD",
  "DEALER",
  "COMPANY",
  "CORPORATE",
];

type PriceMap = Partial<Record<SubscriptionTierKey, number | null>>;

type Props = {
  tierPricesIls: PriceMap;
};

export default function SubscriptionPricingTable({ tierPricesIls }: Props) {
  const { dir } = useI18n();

  return (
    <section className="card-avenue bg-white p-6 shadow-sm md:p-10" dir={dir}>
      <div className="mb-10 text-center">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-indigo-400">מחירון</p>
        <h2 className="text-2xl font-black italic tracking-tight text-white md:text-3xl">השוואת מנויים</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm font-medium text-gray-400">
          חמש רמות — מנוע Gemini כסריקה „זולה”, OpenAI ו־Claude כפרימיום. התשלום ב־PayPal בשקלים.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5">
        {ORDER.map((tier) => {
          const a = tierAllowance(tier);
          const price =
            tierPricesIls[tier] ?? a.monthlyPriceIls ?? (tier === "FREE" ? 0 : null);
          const highlight = a.recommended === true;
          const cardBase = highlight
            ? "border-indigo-500/30 bg-white shadow-sm ring-1 ring-indigo-100"
            : "border-gray-200/90 bg-white shadow-sm hover:border-indigo-500/30/60 hover:shadow-md"
          return (
            <article
              key={tier}
              className={`relative flex flex-col rounded-2xl border p-5 transition-shadow md:p-6 ${cardBase}`}
            >
              {highlight ? (
                <span className="absolute -top-3 left-1/2 z-[2] -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-[10px] font-black text-white shadow-md shadow-indigo-600/30">
                  מומלץ
                </span>
              ) : null}
              <h3 className="mb-1 text-lg font-black text-white">{tierLabelHe(tier)}</h3>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">{tier}</p>
              <div className="mb-4">
                {price != null ? (
                  <p className="text-3xl font-black tabular-nums text-white">
                    ₪{price.toFixed(1)}
                    <span className="text-sm font-semibold text-gray-400"> /חודש</span>
                  </p>
                ) : (
                  <p className="text-lg font-black text-gray-600">צור קשר</p>
                )}
              </div>
              <table className="mb-4 w-full flex-1 border-collapse text-sm text-gray-500">
                <tbody>
                  <tr className="border-b border-gray-200/80">
                    <td className="py-2.5 pe-2 ps-0 font-semibold text-indigo-400">זול (Flash)</td>
                    <td className="py-2.5 text-end font-black tabular-nums text-white">{a.cheapScans}</td>
                  </tr>
                  <tr className="border-b border-gray-200/80">
                    <td className="py-2.5 pe-2 ps-0 font-semibold text-gray-600">פרימיום (Pro)</td>
                    <td className="py-2.5 text-end font-black tabular-nums text-white">{a.premiumScans}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pe-2 ps-0 font-semibold text-gray-400">חברות</td>
                    <td className="py-2.5 text-end font-bold text-white">
                      {a.unlimitedCompanies ? (
                        <>ללא הגבלה (מעשית)</>
                      ) : (
                        <>עד {a.maxCompanies}</>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </article>
          );
        })}
      </div>
    </section>
  );
}
