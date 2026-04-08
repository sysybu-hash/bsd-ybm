"use client";

import { useMemo } from "react";
import { CompanyType, DocType, DocStatus } from "@prisma/client";
import { Receipt, Building2, CheckCircle, AlertTriangle, XCircle, Signature, Link as LinkIcon, Handshake } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
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
  INVOICE: "חשבונית מס קבלה (מקור)",
  RECEIPT: "קבלה (מקור)",
  INVOICE_RECEIPT: "חשבונית מס קבלה (מקור)",
  CREDIT_NOTE: "חשבונית זיכוי (מקור)",
};

const DOC_STATUS_LABEL: Record<DocStatus, string> = {
  PAID: "שולם במלואו",
  PENDING: "ממתין לתשלום",
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

function statusBadge(status: DocStatus): { className: string; icon: typeof CheckCircle; textCls: string } {
  if (status === DocStatus.PAID) {
    return { className: "border-emerald-500 text-emerald-600 bg-emerald-50/50", icon: CheckCircle, textCls: "text-emerald-700" };
  }
  if (status === DocStatus.CANCELLED) {
    return { className: "border-slate-300 text-slate-500 bg-slate-50/50", icon: XCircle, textCls: "text-slate-600" };
  }
  return { className: "border-amber-500 text-amber-600 bg-amber-50/50", icon: AlertTriangle, textCls: "text-amber-700" };
}

const money = (n: number) =>
  n.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Props = {
  doc: IssuedDocumentPrintModel;
  org: OrganizationPrintModel;
};

export default function DocumentPrintTemplate({ doc, org }: Props) {
  const { dir } = useI18n();
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
      className="card-avenue relative mx-auto max-w-[900px] overflow-hidden bg-white text-start font-sans shadow-xl print:border-none print:shadow-none print:max-w-none print:m-0 print:w-full min-h-[1100px] flex flex-col"
      dir={dir}
      id={`print-doc-${doc.number}`}
    >
      {/* Top Graphic Border Line */}
      <div className="h-4 w-full bg-gradient-to-l from-blue-600 to-sky-400 print:bg-blue-700" />
      
      <div className="p-10 md:p-14 flex-1 flex flex-col">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b-2 border-slate-900 pb-10 mb-10">
            <div className="flex items-start gap-5 min-w-0">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-blue-600 shadow-sm shrink-0">
                <Building2 size={40} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 pt-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight break-words">
                  {org.name}
                </h1>
                <p className="text-base font-bold text-slate-500 mt-2">
                  {org.address?.trim() || "כתובת העסק לא הוזנה במערכת"}
                </p>
                <div className="mt-2 inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                   <span className="text-xs font-black uppercase text-slate-400">מספר תאגיד / ע.ורשה</span>
                   <span className="text-sm text-slate-700 font-bold">{org.taxId?.trim() || "—"}</span>
                </div>
              </div>
            </div>
            <div className="text-start md:text-end">
              <h2 className="text-4xl font-black text-blue-600 tracking-tight mb-2">
                {internalMemo ? headerMeta.title : DOC_TYPE_TITLE[doc.type]}
              </h2>
              {internalMemo ? (
                <p className="text-sm font-bold text-slate-400 mb-4">{headerMeta.subTitle}</p>
              ) : null}
              
              <div className="flex flex-col gap-1 text-base border-r-4 border-blue-500 pr-4 mt-4">
                 <p className="font-medium text-slate-500">מספר מסמך הסימוכין: <span className="font-black text-slate-900">#{doc.number}</span></p>
                 <p className="font-medium text-slate-500">תאריך הפקה: <span className="font-black text-slate-900">{dateLabel}</span></p>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-8 shadow-sm">
              <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Handshake size={14}/> מסמך מונפק עבור:</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight break-words">
                {doc.clientName}
              </h3>
            </div>
            <div className={`rounded-3xl border-2 flex flex-col justify-center items-center text-center p-8 shadow-sm ${badge.className}`}>
               <StatusIcon size={28} className="mb-2" />
               <h4 className={`text-2xl font-black tracking-tight ${badge.textCls}`}>{DOC_STATUS_LABEL[doc.status]}</h4>
               {!internalMemo && doc.status === DocStatus.PAID && (
                  <p className="text-sm font-bold opacity-75 mt-1">המסמך הופק כדין ומאשר תשלום של ₪{money(doc.total)}</p>
               )}
            </div>
          </div>

          {/* Table Section */}
          <div className="mb-12 overflow-hidden rounded-3xl border border-slate-200">
            <table className="w-full min-w-[500px] border-collapse text-start">
              <thead className="bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-widest border-b border-slate-200">
                <tr>
                  <th className="p-4 text-start w-16 text-center">#</th>
                  <th className="p-4 text-start">תיאור השירות / המוצר / שורת החיוב</th>
                  <th className="p-4 text-center">כמות</th>
                  <th className="p-4 text-center">מחיר יח׳ בעסקה</th>
                  <th className="p-4 text-end">סה״כ שורה (₪)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 text-sm">
                      <Receipt size={32} className="mx-auto mb-2 text-slate-200"/>
                      אין נתוני חיוב במערכת על מסמך זה.
                    </td>
                  </tr>
                ) : (
                  lines.map((item, i) => (
                    <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                      <td className="p-4 text-center text-sm font-bold text-slate-400">{i + 1}</td>
                      <td className="p-4 font-bold text-slate-900">{item.desc || "סעיף כללי"}</td>
                      <td className="p-4 text-center text-sm font-bold text-slate-600">{item.qty}</td>
                      <td className="p-4 text-center text-sm font-bold text-slate-600">₪{money(item.price)}</td>
                      <td className="p-4 text-end font-black text-lg tracking-tight tabular-nums">
                        ₪{money(item.qty * item.price)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Totals Section */}
          <div className="flex justify-end mb-16">
            <div className="w-full md:w-96 rounded-3xl border-2 border-slate-100 bg-slate-50 p-8 shadow-sm">
              <div className="flex justify-between items-center text-slate-600 font-medium mb-4">
                <span>סה״כ עסקת בסיס לפני מע״מ:</span>
                <span className="font-bold tabular-nums">₪{money(doc.amount)}</span>
              </div>
              {!internalMemo && !isExempt ? (
                <div className="flex justify-between items-center text-slate-600 font-medium mb-4">
                  <span>תוספת מע״מ כדין כפי שנקבע ({vatPercentLabel}):</span>
                  <span className="font-bold tabular-nums">₪{money(doc.vat)}</span>
                </div>
              ) : null}
              <div className="border-t-2 border-slate-200 mt-4 pt-6">
                 <div className="flex justify-between items-end">
                   <span className="text-xl font-black text-slate-900 tracking-tight leading-none">סה״כ לתשלום:</span>
                   <span className="text-4xl font-black italic text-blue-600 tabular-nums leading-none">₪{money(doc.total)}</span>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="mt-auto">
             <div className="flex justify-between items-end border-t border-slate-200 pt-8 pb-4">
                <div>
                   <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">הופק ונחתם אלקטרונית באמצעות</p>
                   <p className="text-sm font-black text-slate-800 flex items-center gap-2 italic">
                     <LinkIcon size={14} className="text-blue-500" /> BSD-YBM Enterprise Cloud OS
                   </p>
                </div>
                <div className="text-center">
                   <Signature size={48} strokeWidth={1} className="text-blue-900/30 mx-auto mb-2" />
                   <div className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 font-bold rounded">
                     {internalMemo ? "מזכר פנימי לא לצרכי מס" : "מסמך ממוחשב - נא לשמור לצרכי מס"}
                   </div>
                </div>
             </div>
          </div>
      </div>
    </div>
  );
}
