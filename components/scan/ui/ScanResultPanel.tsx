"use client";

import { CheckCircle2, Database, Loader2, Users } from "lucide-react";
import type { ScanExtractionV5 } from "@/lib/scan-schema-v5";
import type { SaveTarget } from "@/components/scan/state/scan-machine";

type Props = {
  aiData: Record<string, unknown> | null;
  v5: ScanExtractionV5 | null;
  saving: boolean;
  saveTarget: SaveTarget | null;
  onSave: (target: SaveTarget) => void;
  onReset: () => void;
};

function pickString(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  return "—";
}

function pickNumber(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return value.toLocaleString("he-IL", { maximumFractionDigits: 2 });
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n.toLocaleString("he-IL", { maximumFractionDigits: 2 });
  }
  return "—";
}

export default function ScanResultPanel({ aiData, v5, saving, saveTarget, onSave, onReset }: Props) {
  if (!aiData) return null;

  const lineItems = Array.isArray(aiData.lineItems)
    ? (aiData.lineItems as Array<Record<string, unknown>>)
    : Array.isArray(aiData.items)
      ? (aiData.items as Array<Record<string, unknown>>)
      : [];

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            <span className="text-[11px] font-black uppercase tracking-[0.22em]">פענוח הושלם</span>
          </div>
          <h3 className="mt-1 text-base font-black text-slate-950">{pickString(aiData.vendor)}</h3>
          <p className="text-xs font-semibold text-slate-500">
            סך: ₪{pickNumber(aiData.total)} · {lineItems.length} שורות
            {v5?.documentMetadata.documentDate ? ` · ${v5.documentMetadata.documentDate}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-9 items-center rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-600 transition hover:border-slate-300"
        >
          סריקה חדשה
        </button>
      </div>

      {lineItems.length > 0 ? (
        <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 text-start text-[11px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-2 py-1.5 text-start">פריט</th>
                <th className="px-2 py-1.5 text-end">כמות</th>
                <th className="px-2 py-1.5 text-end">מחיר</th>
                <th className="px-2 py-1.5 text-end">סה״כ</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.slice(0, 50).map((item, index) => (
                <tr key={index} className="border-t border-slate-100">
                  <td className="px-2 py-1.5 font-semibold text-slate-800">
                    {pickString(item.description ?? item.name)}
                  </td>
                  <td className="px-2 py-1.5 text-end font-semibold text-slate-700">{pickNumber(item.quantity)}</td>
                  <td className="px-2 py-1.5 text-end font-semibold text-slate-700">{pickNumber(item.unitPrice ?? item.price)}</td>
                  <td className="px-2 py-1.5 text-end font-black text-slate-900">{pickNumber(item.lineTotal ?? item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onSave("ERP")}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && saveTarget === "ERP" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Database className="h-4 w-4" aria-hidden />
          )}
          שמור ל-ERP
        </button>
        <button
          type="button"
          onClick={() => onSave("CRM")}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && saveTarget === "CRM" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Users className="h-4 w-4" aria-hidden />
          )}
          שמור ל-CRM
        </button>
      </div>
    </div>
  );
}
