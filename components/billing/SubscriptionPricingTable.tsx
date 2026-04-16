"use client";

import { useI18n } from "@/components/I18nProvider";
import { tierAllowance, tierLabelHe, type SubscriptionTierKey } from "@/lib/subscription-tier-config";
import { Check, Star, Zap, Building, Crown } from "lucide-react";

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

// UI mappings for icons & colors based on tiers
const TIER_META: Record<SubscriptionTierKey, { icon: any; color: string; bg: string; badge: string }> = {
  FREE: { icon: Check, color: "text-slate-500", bg: "bg-slate-50", badge: "border-slate-200 text-slate-600" },
  HOUSEHOLD: { icon: Zap, color: "text-blue-500", bg: "bg-blue-50", badge: "border-blue-200 text-blue-700" },
  DEALER: { icon: Star, color: "text-teal-500", bg: "bg-teal-50", badge: "bg-teal-600 text-white border-transparent shadow-md" },
  COMPANY: { icon: Building, color: "text-emerald-500", bg: "bg-emerald-50", badge: "border-emerald-200 text-emerald-700" },
  CORPORATE: { icon: Crown, color: "text-amber-500", bg: "bg-amber-50", badge: "bg-slate-900 border-slate-800 text-amber-300" },
};

export default function SubscriptionPricingTable({ tierPricesIls }: Props) {
  const { dir } = useI18n();

  return (
    <section className="card-avenue rounded-3xl bg-surface-white p-6 md:p-12" dir={dir}>
      <div className="mb-14 text-center">
        <span className="inline-block rounded-full bg-blue-50 border border-blue-100 px-3 py-1 mb-4 text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm">
          מודל פיננסי שקוף
        </span>
        <h2 className="text-3xl font-black italic tracking-tight text-slate-900 md:text-5xl">תצוגת ניהול מנויים ומחירון</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-slate-500 leading-relaxed">
          בחר את חבילת הענן המושלמת לעסק שלך. הסנכרון, הטמעת מודלי הבינה המלאכותית (Gemini/OpenAI/Claude)
          ותעבורת הנתונים מגובים במערכת חיוב אוטומטית שקופה לחלוטין ברמת האגורה.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 items-stretch">
        {ORDER.map((tier) => {
          const a = tierAllowance(tier);
          const price = tierPricesIls[tier] ?? a.monthlyPriceIls ?? (tier === "FREE" ? 0 : null);
          const highlight = a.recommended === true;
          const meta = TIER_META[tier];
          const IconComponent = meta.icon;

          return (
            <article
              key={tier}
              className={`relative flex flex-col rounded-[2rem] border p-6 transition-all duration-300 ${
                highlight
                  ? "border-blue-400 bg-white shadow-xl shadow-blue-900/10 ring-4 ring-blue-50 -translate-y-2 z-10"
                  : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-lg"
              }`}
            >
              {highlight ? (
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-[2]">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 px-4 py-1 text-[11px] font-black text-white shadow-lg shadow-blue-500/30 tracking-widest">
                      <Star size={12} className="fill-white"/> הפופולרי ביותר
                    </span>
                 </div>
              ) : null}
              
              <div className="flex items-center gap-3 mb-6">
                 <div className={`p-2.5 rounded-xl border ${meta.bg} ${meta.color} bg-opacity-50 border-white/50 shadow-sm`}>
                    <IconComponent size={20} strokeWidth={2.5}/>
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-slate-900 leading-none mb-1">{tierLabelHe(tier)}</h3>
                    <span className={`inline-block border px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${meta.badge}`}>
                       {tier}
                    </span>
                 </div>
              </div>

              <div className="mb-6 flex-1">
                {price != null ? (
                  <div className="flex items-end">
                    <span className="text-3xl font-black tabular-nums text-slate-900 tracking-tight">₪{price.toFixed(0)}</span>
                    <span className="text-xs font-bold text-slate-400 mb-1 ml-1 leading-none ms-1"> / ללא מע״מ</span>
                  </div>
                ) : (
                  <p className="text-2xl font-black text-slate-900">Custom</p>
                )}
                {price != null && price > 0 && <p className="text-[10px] text-slate-400 mt-2 font-medium">החיוב מתבצע אוטומטית בכרטיס האשראי או ההוראת קבע שהוגדרה למערכת.</p>}
                {tier === "FREE" && <p className="text-[10px] text-slate-400 mt-2 font-medium">ללא התחייבות, ללא חשיפת כרטיס אשראי. כניסה מידית להתנסות.</p>}
              </div>

              <div className="border-t border-slate-200 pt-6">
                 <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">תכולת המנוי המעודכנת</p>
                <ul className="space-y-4 text-sm font-medium text-slate-600">
                  <li className="flex items-center justify-between">
                    <span className="text-slate-500">מנועי ענן בסיסיים</span>
                    <span className="font-black text-slate-900 tabular-nums bg-slate-100 px-2 py-0.5 rounded">{a.cheapScans.toLocaleString()} שאילתות</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-slate-500">מנועי פרמיום (OpenAI)</span>
                    <span className="font-black text-slate-900 tabular-nums bg-teal-50 text-teal-700 px-2 py-0.5 rounded">{a.premiumScans.toLocaleString()} שאילתות</span>
                  </li>
                  <li className="flex flex-col gap-1 mt-2">
                    <span className="text-slate-500">מספר ישויות (חברות)</span>
                    <div className="flex items-center gap-2">
                       <Check size={14} className="text-emerald-500"/> 
                       <span className="font-bold text-slate-800">
                         {a.unlimitedCompanies ? "חברות עסקיות ללא הגבלה" : `עד ${a.maxCompanies} חברות בו-זמנית`}
                       </span>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="mt-8">
                 <button className={`w-full py-3 px-4 rounded-xl text-sm font-black transition-all ${
                    highlight ? "btn-primary shadow-lg shadow-blue-500/20" : "btn-secondary bg-white border-slate-200 hover:border-slate-300"
                 }`}>
                    {price != null ? (tier === "FREE" ? "התנסות בחינם מיד" : "המשך לשדרוג במערכת") : "תיאום הדגמה איתנו"}
                 </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
