"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw, Save, Trash2, Zap } from "lucide-react";
import { saveBillingWorkspaceAction } from "@/app/actions/billing-workspace";
import type { BillingWorkspaceV1, QuickPaymentPreset } from "@/lib/billing-workspace";
import { defaultQuickPaymentPresets } from "@/lib/billing-workspace";

type Props = {
  workspace: BillingWorkspaceV1;
};

export default function QuickPaymentPresetsSettings({ workspace }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [presets, setPresets] = useState<QuickPaymentPreset[]>(() => [...workspace.quickPaymentPresets]);
  const [msg, setMsg] = useState<string | null>(null);

  const addRow = () =>
    setPresets((prev) => [...prev, { label: "כפתור חדש", amountNis: 10, invoiceDescription: "" }].slice(0, 10));

  const removeRow = (i: number) => setPresets((prev) => prev.filter((_, j) => j !== i));

  const updateRow = (i: number, patch: Partial<QuickPaymentPreset>) =>
    setPresets((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  const restoreDefaults = () => {
    setPresets(defaultQuickPaymentPresets());
    setMsg(null);
  };

  const save = () => {
    setMsg(null);
    const payload: BillingWorkspaceV1 = {
      ...workspace,
      quickPaymentPresets: presets,
    };
    startTransition(async () => {
      const r = await saveBillingWorkspaceAction(payload);
      setMsg(r.ok ? "✓ נשמר — יעודכן גם בדף החיוב" : r.error || "שגיאה");
      if (r.ok) router.refresh();
    });
  };

  return (
    <div className="p-6 md:p-8 rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 to-white">
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-xl bg-indigo-600 p-2.5 text-white shrink-0">
          <Zap size={20} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-bold text-slate-900">כפתורי תשלום מהיר (דף החיוב)</h4>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            עד 10 כפתורים. כל כפתור יוצר <strong>בקשת גבייה</strong> (לא מנוי חודשי). ריק = אין כפתורים מותאמים אישית —
            אפשר למחוק הכל ולשמור כדי להסיר את הרשימה (או להשתמש ב&quot;שחזר ברירת מחדל&quot;).
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {presets.length === 0 ? (
          <p className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            אין כפתורים — בדף החיוב יוצגו רק &quot;מנוי חודשי&quot; ו&quot;סכום מותאם&quot;. לחצו &quot;שחזר ברירת מחדל&quot; או
            &quot;שורה נוספת&quot;.
          </p>
        ) : null}
        {presets.map((row, i) => (
          <div
            key={i}
            className="flex flex-col lg:flex-row gap-2 lg:items-end p-3 rounded-xl bg-white border border-slate-100"
          >
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-bold text-slate-500 uppercase">תווית בכפתור</label>
              <input
                type="text"
                value={row.label}
                onChange={(e) => updateRow(i, { label: e.target.value })}
                className="w-full mt-0.5 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="w-full lg:w-28">
              <label className="text-[10px] font-bold text-slate-500 uppercase">סכום ₪</label>
              <input
                type="text"
                inputMode="decimal"
                dir="ltr"
                value={row.amountNis === 0 ? "" : String(row.amountNis)}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(",", "."));
                  updateRow(i, { amountNis: Number.isFinite(n) ? n : 0 });
                }}
                className="w-full mt-0.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div className="flex-1 min-w-0 lg:min-w-[200px]">
              <label className="text-[10px] font-bold text-slate-500 uppercase">תיאור בחשבונית (אופציונלי)</label>
              <input
                type="text"
                value={row.invoiceDescription ?? ""}
                onChange={(e) => updateRow(i, { invoiceDescription: e.target.value })}
                placeholder="ברירת מחדל: לפי התווית"
                className="w-full mt-0.5 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="p-2 rounded-lg text-red-600 hover:bg-red-50 self-end"
              aria-label="מחק"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={addRow}
          disabled={pending || presets.length >= 10}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          <Plus size={18} /> שורה נוספת
        </button>
        <button
          type="button"
          onClick={restoreDefaults}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw size={18} /> שחזר ברירת מחדל
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-5 py-2 text-sm font-black hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save size={18} /> שמור כפתורים
        </button>
        {msg ? (
          <span className={`text-sm font-bold ${msg.startsWith("✓") ? "text-emerald-700" : "text-red-600"}`}>
            {msg}
          </span>
        ) : null}
      </div>
    </div>
  );
}
