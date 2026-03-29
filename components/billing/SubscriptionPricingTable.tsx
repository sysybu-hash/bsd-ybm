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
  /** מצב זכוכית כהה לדף billing */
  variant?: "light" | "glass";
};

export default function SubscriptionPricingTable({
  tierPricesIls,
  variant = "light",
}: Props) {
  const glass = variant === "glass";
  return (
    <section
      className={
        glass
          ? "rounded-[2rem] border border-white/10 bg-white/[0.06] backdrop-blur-xl p-6 md:p-10 shadow-2xl shadow-black/40"
          : "rounded-[2rem] border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white p-6 md:p-10 shadow-2xl shadow-slate-200/50"
      }
      dir="rtl"
    >
      <div className="text-center mb-10">
        <p
          className={`text-xs font-black uppercase tracking-[0.25em] mb-2 ${glass ? "text-sky-400" : "text-blue-600"}`}
        >
          מחירון
        </p>
        <h2
          className={`text-3xl md:text-4xl font-black tracking-tight ${glass ? "text-white" : "text-slate-900"}`}
        >
          השוואת מנויים
        </h2>
        <p
          className={`mt-2 font-medium max-w-2xl mx-auto text-sm ${glass ? "text-slate-400" : "text-slate-500"}`}
        >
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
          const highlight = a.recommended === true;
          const cardBase = glass
            ? highlight
              ? "border-violet-400/80 bg-gradient-to-b from-violet-500/20 to-white/[0.04] shadow-xl shadow-violet-900/30 ring-2 ring-violet-400/40 scale-[1.02] z-[1]"
              : "border-white/10 bg-white/[0.07] shadow-lg shadow-black/20 hover:border-white/20"
            : highlight
              ? "border-violet-400 bg-gradient-to-b from-violet-50/90 to-white shadow-xl shadow-violet-200/40 ring-2 ring-violet-400/30 scale-[1.02] z-[1]"
              : "border-slate-100 bg-white/90 shadow-lg shadow-slate-200/30 hover:shadow-xl hover:border-slate-200";
          return (
            <article
              key={tier}
              className={`relative flex flex-col rounded-[1.75rem] border p-5 md:p-6 transition-shadow ${cardBase}`}
            >
              {highlight ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-0.5 text-[10px] font-black text-white shadow-md">
                  מומלץ
                </span>
              ) : null}
              <h3
                className={`text-lg font-black mb-1 ${glass ? "text-white" : "text-slate-900"}`}
              >
                {tierLabelHe(tier)}
              </h3>
              <p
                className={`text-[10px] font-bold uppercase tracking-wider mb-4 ${glass ? "text-slate-500" : "text-slate-400"}`}
              >
                {tier}
              </p>
              <div className="mb-4">
                {price != null ? (
                  <p
                    className={`text-3xl font-black tabular-nums ${glass ? "text-white" : "text-slate-900"}`}
                  >
                    ₪{price.toFixed(1)}
                    <span
                      className={`text-sm font-semibold ${glass ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {" "}
                      /חודש
                    </span>
                  </p>
                ) : (
                  <p className={`text-lg font-black ${glass ? "text-slate-200" : "text-slate-700"}`}>
                    צור קשר
                  </p>
                )}
              </div>
              <ul
                className={`space-y-2 text-sm flex-1 mb-4 ${glass ? "text-slate-300" : "text-slate-600"}`}
              >
                <li className="flex gap-2">
                  <span className="text-sky-500 font-black">·</span>
                  <span>
                    <strong className={glass ? "text-white" : "text-slate-800"}>{a.cheapScans}</strong>{" "}
                    סריקות זולות (Gemini)
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-violet-500 font-black">·</span>
                  <span>
                    <strong className={glass ? "text-white" : "text-slate-800"}>{a.premiumScans}</strong>{" "}
                    סריקות פרימיום
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className={`font-black ${glass ? "text-slate-500" : "text-slate-400"}`}>·</span>
                  <span>
                    {a.unlimitedCompanies ? (
                      <>
                        <strong className={glass ? "text-white" : "text-slate-800"}>
                          חברות ללא הגבלה
                        </strong>{" "}
                        (מעשית)
                      </>
                    ) : (
                      <>
                        עד{" "}
                        <strong className={glass ? "text-white" : "text-slate-800"}>{a.maxCompanies}</strong>{" "}
                        חברות / ישויות
                      </>
                    )}
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
