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
  return (
    <section
      className="rounded-[2rem] border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white p-6 md:p-10 shadow-2xl shadow-slate-200/50"
      dir="rtl"
    >
      <div className="text-center mb-10">
        <p className="text-xs font-black uppercase tracking-[0.25em] mb-2 text-blue-600">מחירון</p>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">השוואת מנויים</h2>
        <p className="mt-2 font-medium max-w-2xl mx-auto text-sm text-slate-500">
          חמש רמות — מנוע Gemini כסריקה „זולה”, OpenAI ו־Claude כפרימיום. התשלום ב־PayPal בשקלים.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
        {ORDER.map((tier) => {
          const a = tierAllowance(tier);
          const price =
            tierPricesIls[tier] ?? a.monthlyPriceIls ?? (tier === "FREE" ? 0 : null);
          const highlight = a.recommended === true;
          const cardBase = highlight
            ? "border-amber-300/90 bg-gradient-to-b from-amber-50/95 via-white to-slate-50/90 shadow-xl shadow-amber-200/50 ring-2 ring-amber-400/45 scale-[1.02] z-[1]"
            : "border-slate-100 bg-white/90 shadow-lg shadow-slate-200/30 hover:shadow-xl hover:border-slate-200";
          return (
            <article
              key={tier}
              className={`relative flex flex-col rounded-[1.75rem] border p-5 md:p-6 transition-shadow ${cardBase}`}
            >
              {highlight ? (
                <span className="absolute -top-3 left-1/2 z-[2] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-amber-700 px-3 py-0.5 text-[10px] font-black text-white shadow-lg shadow-amber-600/40">
                  מומלץ
                </span>
              ) : null}
              <h3 className="text-lg font-black mb-1 text-slate-900">{tierLabelHe(tier)}</h3>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-4 text-slate-400">{tier}</p>
              <div className="mb-4">
                {price != null ? (
                  <p className="text-3xl font-black tabular-nums text-slate-900">
                    ₪{price.toFixed(1)}
                    <span className="text-sm font-semibold text-slate-500"> /חודש</span>
                  </p>
                ) : (
                  <p className="text-lg font-black text-slate-700">צור קשר</p>
                )}
              </div>
              <table className="mb-4 w-full flex-1 border-collapse text-sm text-slate-600">
                <tbody>
                  <tr className="border-b border-slate-200/80">
                    <td className="py-2.5 ps-0 pe-2 font-semibold text-sky-600">זול (Flash)</td>
                    <td className="py-2.5 text-end font-black tabular-nums text-slate-900">{a.cheapScans}</td>
                  </tr>
                  <tr className="border-b border-slate-200/80">
                    <td className="py-2.5 ps-0 pe-2 font-semibold text-violet-600">פרימיום (Pro)</td>
                    <td className="py-2.5 text-end font-black tabular-nums text-slate-900">{a.premiumScans}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 ps-0 pe-2 font-semibold text-slate-500">חברות</td>
                    <td className="py-2.5 text-end font-bold text-slate-900">
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
