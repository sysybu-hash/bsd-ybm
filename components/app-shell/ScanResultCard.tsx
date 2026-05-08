"use client";

import Link from "next/link";
import { AlertTriangle, FileText, TrendingUp, UserPlus, Users, X } from "lucide-react";
import type { ScanSyncSummary } from "@/lib/scan-sync-summary";

type Props = {
  summary: ScanSyncSummary;
  onClose: () => void;
  onAskAi?: (prompt: string) => void;
};

function formatCurrency(value: number | null, currency: string | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₪";
  return `${symbol}${value.toLocaleString("he-IL", { maximumFractionDigits: 2 })}`;
}

export default function ScanResultCard({ summary, onClose, onAskAi }: Props) {
  const { erp, crm, alerts } = summary;
  const topAlert = alerts[0];

  const askPrompt = topAlert
    ? `הסבר לי את קפיצת המחיר של "${topAlert.description}" שזוהתה בסריקה האחרונה.`
    : `סכם בקצרה את הסריקה האחרונה: ${erp.vendor ?? "ספק"} בסך ${formatCurrency(erp.total, erp.currency)}.`;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-600">סריקה הושלמה</p>
          <h3 className="mt-0.5 text-base font-black text-slate-950">סנכרון אוטומטי הסתיים</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900"
          aria-label="סגור סיכום"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </header>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
        <div className="flex items-center gap-2 text-emerald-800">
          <FileText className="h-4 w-4" aria-hidden />
          <span className="text-xs font-black uppercase tracking-wider">ERP</span>
        </div>
        <p className="mt-1 truncate text-sm font-black text-slate-950">
          {erp.vendor ?? "ספק כללי"} · {formatCurrency(erp.total, erp.currency)}
        </p>
        <p className="text-xs font-semibold text-slate-600">
          {erp.lineItemCount} שורות · {erp.docType ?? "מסמך"}
        </p>
        <Link
          href={`/app/documents/erp#doc-${erp.documentId}`}
          className="mt-2 inline-flex text-xs font-black text-emerald-700 hover:underline"
        >
          פתח את ההוצאה ←
        </Link>
      </section>

      {crm ? (
        <section className="rounded-xl border border-sky-200 bg-sky-50/60 p-3">
          <div className="flex items-center gap-2 text-sky-800">
            {crm.isNew ? <UserPlus className="h-4 w-4" aria-hidden /> : <Users className="h-4 w-4" aria-hidden />}
            <span className="text-xs font-black uppercase tracking-wider">
              CRM · {crm.isNew ? "ספק חדש" : "ספק קיים"}
            </span>
          </div>
          <p className="mt-1 truncate text-sm font-black text-slate-950">{crm.contactName}</p>
          <p className="text-xs font-semibold text-slate-600">
            {crm.totalDocumentsThisYear} מסמכים השנה
            {crm.email ? ` · ${crm.email}` : ""}
            {crm.phone ? ` · ${crm.phone}` : ""}
          </p>
          <Link
            href={`/app/clients?focus=${crm.contactId}`}
            className="mt-2 inline-flex text-xs font-black text-sky-700 hover:underline"
          >
            פתח את הכרטיס ←
          </Link>
        </section>
      ) : null}

      {alerts.length > 0 ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50/70 p-3">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            <span className="text-xs font-black uppercase tracking-wider">חריגת מחיר</span>
          </div>
          <p className="mt-1 truncate text-sm font-black text-slate-950">
            {topAlert!.description}
            <span className="ms-2 inline-flex items-center gap-1 rounded-full bg-amber-200/80 px-2 py-0.5 text-[11px] font-black text-amber-900">
              <TrendingUp className="h-3 w-3" aria-hidden />
              +{topAlert!.changePercent.toFixed(1)}%
            </span>
          </p>
          <p className="text-xs font-semibold text-slate-600">
            ₪{topAlert!.previousPrice.toFixed(2)} → ₪{topAlert!.latestPrice.toFixed(2)}
            {alerts.length > 1 ? ` · ועוד ${alerts.length - 1} פריטים` : ""}
          </p>
        </section>
      ) : null}

      {onAskAi ? (
        <button
          type="button"
          onClick={() => onAskAi(askPrompt)}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
        >
          שאל את ה-AI על הסריקה
        </button>
      ) : null}
    </div>
  );
}
