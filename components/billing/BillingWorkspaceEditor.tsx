"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, Trash2, Edit3, MessageCircle, Info, Calculator, FileText } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { saveBillingWorkspaceAction } from "@/app/actions/billing-workspace";
import type { BillingWorkspaceV1, InsuranceExpenseLine } from "@/lib/billing-workspace";
import { sumInsuranceLines } from "@/lib/billing-workspace";

const REFERRAL_OPTIONS: { value: BillingWorkspaceV1["referralLevel"]; label: string }[] = [
  { value: "none", label: "ללא סיווג מעקב" },
  { value: "1", label: "רמת סבירות זניחה – ללא מעקב" },
  { value: "2", label: "2 — עניין התחלתי (מעקב רבעוני)" },
  { value: "3", label: "3 — סבירות בינונית (חמים)" },
  { value: "4", label: "4 — סבירות גבוהה מאוד לביצוע" },
  { value: "5", label: "5 — ממתין לחשבונית עסקה (סגור)" },
];

type Props = {
  initial: BillingWorkspaceV1;
};

export default function BillingWorkspaceEditor({ initial }: Props) {
  const { dir } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lines, setLines] = useState<InsuranceExpenseLine[]>(
    initial.insuranceLines.length ? initial.insuranceLines : [{ label: "", amountNis: 0 }],
  );
  const [referralLevel, setReferralLevel] = useState<BillingWorkspaceV1["referralLevel"]>(
    initial.referralLevel,
  );
  const [referralNotes, setReferralNotes] = useState(initial.referralNotes);
  const [pitch, setPitch] = useState(initial.onboardingFreePitch);
  const [msg, setMsg] = useState<string | null>(null);

  const total = sumInsuranceLines(lines.filter((l) => l.label.trim().length > 0));

  const addLine = () => setLines((prev) => [...prev, { label: "", amountNis: 0 }]);
  const removeLine = (i: number) =>
    setLines((prev) => {
      const next = prev.filter((_, j) => j !== i);
      return next.length === 0 ? [{ label: "", amountNis: 0 }] : next;
    });

  const save = () => {
    setMsg(null);
    const cleanLines = lines.filter((l) => l.label.trim().length > 0);
    const payload: BillingWorkspaceV1 = {
      v: 1,
      insuranceLines: cleanLines.map((l) => ({
        label: l.label.trim(),
        amountNis: Math.max(0, Math.round(Number(l.amountNis) * 100) / 100),
      })),
      referralLevel,
      referralNotes: referralNotes.trim(),
      onboardingFreePitch: pitch.trim(),
      quickPaymentPresets: initial.quickPaymentPresets,
    };
    startTransition(async () => {
      const r = await saveBillingWorkspaceAction(payload);
      setMsg(r.ok ? "✓ מסמך המקור נשמר בהצלחה" : r.error || "שגיאה בשמירת המסמך");
      if (r.ok) router.refresh();
    });
  };

  return (
    <section className="card-avenue bg-surface-white p-6 md:p-10" dir={dir}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
            <Edit3 size={24} aria-hidden />
          </div>
          <div>
            <h2 className="text-2xl font-black italic text-slate-900 tracking-tight">מערכת הצעות מחיר וניהול שורות חיוב</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
               מחולל הצעות אינטראקטיבי. הוסיפו שורות חיוב, קבעו רמות המרה ואוטומציות טקסטואליות.
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
           <button
             type="button"
             disabled={pending}
             onClick={save}
             className="btn-primary flex items-center gap-2 py-3 shadow-lg shadow-blue-500/20 px-8"
           >
             <Save size={18} aria-hidden />
             {pending ? "מבצע רישום מערכת..." : "שמירה אוטומטית למסד נתונים"}
           </button>
           {msg ? (
             <div className="mt-2 text-start sm:text-end">
               <span className={`text-[11px] font-black uppercase tracking-widest ${msg.startsWith("✓") ? "text-emerald-500" : "text-rose-500"}`}>
                 {msg}
               </span>
             </div>
           ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column - Financial Lines */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
             <h3 className="text-base font-black text-slate-800 flex items-center gap-2 px-1">
               <Calculator size={18} className="text-blue-500"/>
               פירוט שורות חיוב / עלויות ספק
             </h3>
             <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded">ללא מע״מ</span>
          </div>
          
          <div className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-100/80 shadow-inner">
            <div className="hidden sm:grid grid-cols-[1fr_120px_40px] gap-3 px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
               <span>תיאור השירות או המוצר</span>
               <span>סכום בסיס ב-₪</span>
               <span></span>
            </div>
            {lines.map((line, i) => (
              <div key={i} className="flex flex-col sm:grid sm:grid-cols-[1fr_120px_40px] gap-3 group relative bg-white p-2 rounded-2xl border border-slate-200/60 shadow-sm transition-colors hover:border-blue-300">
                <input
                  type="text"
                  value={line.label}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLines((prev) => prev.map((x, j) => (j === i ? { ...x, label: v } : x)));
                  }}
                  placeholder="הזן תיאור מפורט של הפריט/השירות..."
                  className="rounded-xl border-none bg-transparent px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 transition"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  value={line.amountNis === 0 ? "" : String(line.amountNis)}
                  onChange={(e) => {
                    const n = Number(e.target.value.replace(",", "."));
                    setLines((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, amountNis: Number.isFinite(n) ? n : 0 } : x,
                      ),
                    );
                  }}
                  placeholder="₪"
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-black tabular-nums text-blue-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition"
                />
                <div className="flex items-center justify-center">
                   <button
                     type="button"
                     onClick={() => removeLine(i)}
                     className="rounded-xl p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                     aria-label="מחק שורת תמחור"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
            ))}
            
            <div className="pt-2 px-1">
               <button
                 type="button"
                 onClick={addLine}
                 className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-600 transition"
               >
                 <Plus size={14} /> הוספת מק״ט/שורה
               </button>
            </div>
          </div>
          
          <div className="bg-blue-600 text-white rounded-2xl p-5 shadow-lg shadow-blue-600/30 w-full flex items-center justify-between">
            <span className="text-sm font-medium opacity-90 uppercase tracking-widest">סה״כ לתשלום (סיכום ביניים)</span>
            <span className="text-2xl font-black tabular-nums">₪{total.toLocaleString("he-IL", { maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Right Column - CRM Follow Up & Templating */}
        <div className="space-y-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-slate-100 p-1.5 rounded-lg"><Info size={16} className="text-slate-500" /></div>
              <h3 className="text-sm font-black text-slate-800">פוטנציאל עסקי ומעקב המרה (Lead Scoring)</h3>
            </div>
            
            <label className="block text-[11px] font-black uppercase text-slate-400 mb-2 tracking-widest">סטטוס מכירה קטלוגי</label>
            <div className="relative mb-5">
              <select
                value={referralLevel}
                onChange={(e) => setReferralLevel(e.target.value as BillingWorkspaceV1["referralLevel"])}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-4 py-3 text-sm font-bold outline-none ring-slate-100 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition shadow-sm text-slate-700"
              >
                {REFERRAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            
            <label className="block text-[11px] font-black uppercase text-slate-400 mb-2 tracking-widest">הערות פנימיות לפולו-אפ CRM</label>
            <textarea
              value={referralNotes}
              onChange={(e) => setReferralNotes(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-4 py-3 text-sm font-medium outline-none ring-slate-100 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition shadow-sm text-slate-700 placeholder:text-slate-400"
              placeholder="יש לחזור ללקוח לאחר קבלת אישור אשראי מהנהלה..."
            />
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-emerald-50 border border-emerald-100 p-1.5 rounded-lg"><MessageCircle size={16} className="text-emerald-600" /></div>
              <h3 className="text-sm font-black text-slate-800">תכנות תשובות ומכתבים למסמך הדיגיטלי</h3>
            </div>
            
            <label className="block text-[11px] font-black uppercase text-slate-400 mb-2 tracking-widest">טקסט הצעה (מופיע בחלקו העליון של עמוד הלקוח)</label>
            <textarea
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-4 py-3 text-sm font-medium outline-none ring-slate-100 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition shadow-sm text-slate-700 leading-relaxed placeholder:text-slate-400"
              placeholder="בהמשך לשיחתנו ולהתעניינותכם הרחבה במערכות הניהול של הפלטפורמה..."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
