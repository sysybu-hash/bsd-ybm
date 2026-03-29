"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Save, Plus, Trash2 } from "lucide-react";
import { saveBillingWorkspaceAction } from "@/app/actions/billing-workspace";
import type { BillingWorkspaceV1, InsuranceExpenseLine } from "@/lib/billing-workspace";
import { sumInsuranceLines } from "@/lib/billing-workspace";

const REFERRAL_OPTIONS: { value: BillingWorkspaceV1["referralLevel"]; label: string }[] = [
  { value: "none", label: "לא משויך" },
  { value: "1", label: "קריר — נכחו, מעט עניין" },
  { value: "2", label: "2 — עניין בסיסי" },
  { value: "3", label: "3 — חמים" },
  { value: "4", label: "4 — חמים מאוד" },
  { value: "5", label: "5 — ממליץ / מוכן להירשם" },
];

type Props = {
  initial: BillingWorkspaceV1;
};

export default function BillingWorkspaceEditor({ initial }: Props) {
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
    };
    startTransition(async () => {
      const r = await saveBillingWorkspaceAction(payload);
      setMsg(r.ok ? "✓ נשמר" : r.error || "שגיאה");
      if (r.ok) router.refresh();
    });
  };

  return (
    <section
      className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-200/30"
      dir="rtl"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-xl bg-slate-900 p-2.5 text-white">
          <ClipboardList size={22} aria-hidden />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">ביטוח, המלצות וטקסט לחברים</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            טיוטה לשימושכם — סיכום הוצאות להצגה לחברת ביטוח, רמת חום של חברים מהמופע, והודעה לפני הרשמה.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-black text-slate-800 mb-2">טיוטת הוצאות (להערכת ביטוח)</h3>
          <p className="text-xs text-slate-500 mb-3">
            הזינו שורות (למשל: מנוי תוכנה, רואה חשבון, ציוד). הסכום הוא ב־₪ לשנה או לתקופה — לפי מה שתרצו להציג
            למבטח.
          </p>
          <div className="space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  value={line.label}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLines((prev) => prev.map((x, j) => (j === i ? { ...x, label: v } : x)));
                  }}
                  placeholder="תיאור הוצאה"
                  className="flex-1 min-w-[160px] rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
                  className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="p-2 rounded-xl text-red-600 hover:bg-red-50"
                  aria-label="מחק שורה"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline"
            >
              <Plus size={18} /> שורה נוספת
            </button>
            <p className="text-sm font-black text-slate-900">
              סה״כ טיוטה:{" "}
              <span className="text-indigo-600">₪{total.toLocaleString("he-IL", { maximumFractionDigits: 2 })}</span>
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black text-slate-800 mb-2">חברים שראו את המופע — רמת המלצה</h3>
          <select
            value={referralLevel}
            onChange={(e) => setReferralLevel(e.target.value as BillingWorkspaceV1["referralLevel"])}
            className="w-full max-w-md rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium bg-white"
          >
            {REFERRAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="block text-xs font-bold text-slate-500 mt-3 mb-1">הערות (שמות, מועד מעקב…)</label>
          <textarea
            value={referralNotes}
            onChange={(e) => setReferralNotes(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="למשל: דני — יחזור אחרי החגים"
          />
        </div>

        <div>
          <h3 className="text-sm font-black text-slate-800 mb-2">טקסט &quot;חינם + PayPal&quot; לפני הרשמה</h3>
          <textarea
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-relaxed"
          />
          <p className="text-xs text-slate-400 mt-1">
            מוצג למעלה בכרטיס &quot;מה לומר לחבר&quot; — עדכנו לפי הסגנון שלכם.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-6 py-3 text-sm font-black hover:bg-slate-800 disabled:opacity-50"
        >
          <Save size={18} aria-hidden />
          {pending ? "שומר…" : "שמור הכל"}
        </button>
        {msg ? (
          <span className={`text-sm font-bold ${msg.startsWith("✓") ? "text-emerald-700" : "text-red-600"}`}>
            {msg}
          </span>
        ) : null}
      </div>
    </section>
  );
}
