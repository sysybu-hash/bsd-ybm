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
        <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600 mb-2">מחירון</p>
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">השוואת מנויים</h2>
        <p className="mt-2 text-slate-500 font-medium max-w-2xl mx-auto text-sm">
          חמש רמות — מנוע Gemini כסריקה „זולה”, OpenAI ו־Claude כפרימיום. התשלום ב־PayPal בשקלים.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
        {ORDER.map((tier) => {
          const a = tierAllowance(tier);
          const price =
            tierPricesIls[tier] ??
            a.monthlyPriceIls ??
            (tier === "FREE" ? 0 : null);
          const highlight = tier === "COMPANY";
          return (
            <article
              key={tier}
              className={`relative flex flex-col rounded-[1.75rem] border p-5 md:p-6 transition-shadow ${
                highlight
                  ? "border-blue-400 bg-gradient-to-b from-blue-50/90 to-white shadow-xl shadow-blue-200/40 ring-2 ring-blue-400/30 scale-[1.02] z-[1]"
                  : "border-slate-100 bg-white/90 shadow-lg shadow-slate-200/30 hover:shadow-xl hover:border-slate-200"
              }`}
            >
              {highlight ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-black text-white shadow-md">
                  פופולרי
                </span>
              ) : null}
              <h3 className="text-lg font-black text-slate-900 mb-1">{tierLabelHe(tier)}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">{tier}</p>
              <div className="mb-4">
                {price != null ? (
                  <p className="text-3xl font-black text-slate-900 tabular-nums">
                    ₪{price.toFixed(1)}
                    <span className="text-sm font-semibold text-slate-500"> /חודש</span>
                  </p>
                ) : (
                  <p className="text-lg font-black text-slate-700">צור קשר</p>
                )}
              </div>
              <ul className="space-y-2 text-sm text-slate-600 flex-1 mb-4">
                <li className="flex gap-2">
                  <span className="text-sky-500 font-black">·</span>
                  <span>
                    <strong className="text-slate-800">{a.cheapScans}</strong> סריקות זולות (Gemini)
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-violet-500 font-black">·</span>
                  <span>
                    <strong className="text-slate-800">{a.premiumScans}</strong> סריקות פרימיום
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-slate-400 font-black">·</span>
                  <span>
                    עד <strong className="text-slate-800">{a.maxCompanies}</strong> חברות / ישויות
                  </span>
                </li>
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
