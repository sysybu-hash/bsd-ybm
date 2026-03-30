"use client";

import { useMemo } from "react";
import { CompanyType, DocType, DocStatus } from "@prisma/client";
import { Receipt, Building2, User2, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { VAT_RATE } from "@/lib/billing-calculations";
import { getDocumentHeader } from "@/lib/document-header";

export type IssuedDocumentPrintModel = {
  type: DocType;
  number: number;
  date: string | Date;
  clientName: string;
  status: DocStatus;
  amount: number;
  vat: number;
  total: number;
  items: unknown;
};

export type OrganizationPrintModel = {
  name: string;
  address: string | null;
  taxId: string | null;
  companyType: CompanyType;
  /** false = מזכר פנימי ללא דיווח מס */
  isReportable: boolean;
};

const DOC_TYPE_TITLE: Record<DocType, string> = {
  INVOICE: "חשבונית מס",
  RECEIPT: "קבלה",
  INVOICE_RECEIPT: "חשבונית מס קבלה",
  CREDIT_NOTE: "חשבונית זיכוי",
};

const DOC_STATUS_LABEL: Record<DocStatus, string> = {
  PAID: "שולם במלואו",
  PENDING: "בהמתנה לתשלום",
  CANCELLED: "מבוטל",
};

function lineItemsFromJson(items: unknown): { desc: string; qty: number; price: number }[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const o = raw as Record<string, unknown>;
      const desc = String(o.desc ?? "");
      const qty = Number(o.qty);
      const price = Number(o.price);
      return {
        desc,
        qty: Number.isFinite(qty) ? qty : 0,
        price: Number.isFinite(price) ? price : 0,
      };
    })
    .filter((x): x is { desc: string; qty: number; price: number } => x !== null);
}

function statusBadge(status: DocStatus): { className: string; icon: typeof CheckCircle } {
  if (status === DocStatus.PAID) {
    return { className: "bg-green-100 text-green-800", icon: CheckCircle };
  }
  if (status === DocStatus.CANCELLED) {
    return { className: "bg-slate-200 text-slate-800", icon: XCircle };
  }
  return { className: "bg-orange-100 text-orange-800", icon: AlertTriangle };
}

const money = (n: number) =>
  n.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Props = {
  doc: IssuedDocumentPrintModel;
  org: OrganizationPrintModel;
};

export default function DocumentPrintTemplate({ doc, org }: Props) {
  const internalMemo = !org.isReportable;
  const headerMeta = useMemo(
    () =>
      getDocumentHeader({
        isReportable: org.isReportable,
        companyType: org.companyType,
        taxId: org.taxId,
      }),
    [org.isReportable, org.companyType, org.taxId],
  );
  const isExempt = org.companyType === CompanyType.EXEMPT_DEALER;
  const lines = useMemo(() => lineItemsFromJson(doc.items), [doc.items]);
  const badge = statusBadge(doc.status);
  const StatusIcon = badge.icon;

  const dateLabel =
    doc.date instanceof Date
      ? doc.date.toLocaleDateString("he-IL")
      : new Date(doc.date).toLocaleDateString("he-IL");

  const vatPercentLabel = `${Math.round(VAT_RATE * 100)}%`;

  return (
    <div
      className="bg-white p-12 max-w-[850px] mx-auto border shadow-xl shadow-slate-200/50 rounded-[3rem] print:shadow-none print:rounded-none print:border-none text-right font-sans relative overflow-hidden"
      dir="rtl"
      id={`print-doc-${doc.number}`}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 rounded-full -mr-32 -mt-32 z-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-2 border-slate-900 pb-10 mb-10">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-4 bg-slate-100 rounded-2xl text-slate-600 shadow-sm shrink-0">
            <Building2 size={32} />
          </div>
          <div className="min-w-0">
            <h1 className="text-4xl font-black text-slate-950 tracking-tighter break-words">
              {org.name}
            </h1>
            <p className="text-base font-bold text-slate-700 mt-1">
              {org.address?.trim() || "כתובת העסק"}
            </p>
            <p className="text-sm text-slate-500 font-medium">
              ח.פ / ע.מ: {org.taxId?.trim() || "—"}
            </p>
          </div>
        </div>
        <div className="text-left bg-slate-50 p-6 rounded-3xl border border-slate-100 min-w-[12rem] shrink-0 w-full md:w-auto">
          <h2 className="text-3xl font-black text-blue-600 tracking-tight">
            {internalMemo ? headerMeta.title : DOC_TYPE_TITLE[doc.type]}
          </h2>
          {internalMemo ? (
            <p className="text-sm font-bold text-amber-700 mt-2">{headerMeta.subTitle}</p>
          ) : null}
          <p className="text-xl font-bold text-slate-800 mt-1">מספר: {doc.number}</p>
          <p className="text-sm text-slate-500 italic mt-1 font-medium">תאריך: {dateLabel}</p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex gap-4 items-start">
          <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 mt-1 shrink-0">
            <User2 size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">לכבוד:</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight break-words">
              {doc.clientName}
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-1">אימייל / טלפון הלקוח</p>
          </div>
        </div>
        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center">
          <div
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-black shadow-sm ${badge.className}`}
          >
            <StatusIcon size={14} />
            {DOC_STATUS_LABEL[doc.status]}
          </div>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            {internalMemo ? "מסמך פנימי — ללא ערך לדיווח מס" : "אנא שמרו מסמך זה לצרכי מס"}
          </p>
        </div>
      </div>

      <div className="relative z-10 bg-slate-50/50 rounded-3xl p-6 border border-slate-100 mb-12 overflow-x-auto">
        <table className="w-full min-w-[520px] text-right border-collapse">
          <thead className="text-slate-500 text-[11px] font-black uppercase tracking-widest border-b-2 border-slate-200">
            <tr>
              <th className="p-5 text-right align-middle">
                <span className="inline-flex items-center gap-2">
                  <Receipt size={14} className="shrink-0" />
                  תיאור השירות / מוצר
                </span>
              </th>
              <th className="p-5 text-center align-middle">כמות</th>
              <th className="p-5 text-center align-middle">מחיר יח׳</th>
              <th className="p-5 text-left align-middle font-black">סה״כ (₪)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
            {lines.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400 text-sm">
                  אין פירוט שורות
                </td>
              </tr>
            ) : (
              lines.map((item, i) => (
                <tr key={i} className="hover:bg-white transition-colors">
                  <td className="p-5 font-bold">{item.desc || "—"}</td>
                  <td className="p-5 text-center font-bold text-slate-600">{item.qty}</td>
                  <td className="p-5 text-center font-bold text-slate-600">₪{money(item.price)}</td>
                  <td className="p-5 text-left font-black text-lg tracking-tight">
                    ₪{money(item.qty * item.price)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="relative z-10 flex justify-end">
        <div className="w-full md:w-80 space-y-3 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 shadow-lg shadow-slate-200/40 text-slate-800">
          <div className="flex justify-between text-slate-600 font-medium">
            <span>סה״כ לפני מע״מ:</span>
            <span>₪{money(doc.amount)}</span>
          </div>
          {!internalMemo && !isExempt ? (
            <div className="flex justify-between text-slate-500 font-medium">
              <span>מע״מ ({vatPercentLabel}):</span>
              <span>₪{money(doc.vat)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-2xl font-black text-slate-900 pt-3 border-t border-slate-200 leading-none tracking-tight">
            <span>סה״כ לתשלום:</span>
            <span className="italic text-blue-700">₪{money(doc.total)}</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-20 text-center border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 px-6">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic flex items-center gap-2">
          BSD-YBM Intelligence System | השדרה שמחברת בין כולם
        </p>
        <p className="text-[11px] text-slate-500 font-bold bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
          {internalMemo
            ? "מזכר פנימי — לשימוש ארגוני בלבד"
            : "מסמך ממוחשב — שמירה לצרכי תיעוד ומס באחריות המוציא"}
        </p>
      </div>
    </div>
  );
}
