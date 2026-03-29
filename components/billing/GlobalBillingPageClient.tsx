"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { CompanyType, DocType, type DocStatus } from "@prisma/client";
import { VAT_RATE } from "@/lib/billing-calculations";
import {
  FilePlus,
  Download,
  Search,
  TrendingUp,
  ShieldCheck,
  History,
  MoreVertical,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import CreateIssuedDocumentModal, {
  type CrmContactOption,
} from "@/components/billing/CreateIssuedDocumentModal";
import DocumentPrintTemplate from "@/components/billing/DocumentPrintTemplate";
import ReportingCenter from "@/components/billing/ReportingCenter";
import { exportAccountantMonthCsvAction } from "@/app/dashboard/billing/export-accountant-csv";

export type IssuedDocRow = {
  id: string;
  docType: DocType;
  number: number;
  dateLabel: string;
  dateIso: string;
  clientName: string;
  status: DocStatus;
  total: number;
  amount: number;
  vat: number;
  items: unknown;
};

export type BillingHubStats = {
  monthGross: number;
  monthVat: number;
  pendingAmount: number;
  pendingInvoiceCount: number;
  /** סכום גולמי של חשבוניות שסומנו כשולמו החודש */
  paidMonthGross: number;
};

const DOC_TYPE_LABEL: Record<DocType, string> = {
  INVOICE: "חשבונית מס",
  RECEIPT: "קבלה",
  INVOICE_RECEIPT: "חשבונית מס קבלה",
  CREDIT_NOTE: "זיכוי",
};

const COMPANY_BADGE: Record<CompanyType, string> = {
  EXEMPT_DEALER: "EXEMPT / פטור",
  LICENSED_DEALER: "LICENSED / מורשה",
  LTD_COMPANY: "LTD / חברה בע״מ",
};

const STATUS_LABEL: Record<DocStatus, string> = {
  PAID: "שולם",
  PENDING: "בהמתנה",
  CANCELLED: "בוטל",
};

const STATUS_STYLE: Record<DocStatus, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

function formatMoney(n: number) {
  return `₪${n.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type TabKey = "all" | "invoices" | "receipts" | "credits";

function docMatchesTab(type: DocType, tab: TabKey): boolean {
  if (tab === "all") return true;
  if (tab === "invoices") return type === DocType.INVOICE || type === DocType.INVOICE_RECEIPT;
  if (tab === "receipts") return type === DocType.RECEIPT;
  if (tab === "credits") return type === DocType.CREDIT_NOTE;
  return true;
}

type Props = {
  organizationName: string;
  orgAddress: string | null;
  companyType: CompanyType;
  taxId: string | null;
  /** false = מסמכים כמזכר פנימי ללא מע״מ */
  isReportable: boolean;
  issuedRows: IssuedDocRow[];
  stats: BillingHubStats;
  contacts: CrmContactOption[];
  paymentBlock?: ReactNode;
};

export default function GlobalBillingPageClient({
  organizationName,
  orgAddress,
  companyType,
  taxId,
  isReportable,
  issuedRows,
  stats,
  contacts,
  paymentBlock,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<TabKey>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [printRow, setPrintRow] = useState<IssuedDocRow | null>(null);
  const [exportPending, startExport] = useTransition();

  const handleExportAccountantCsv = () => {
    startExport(async () => {
      const r = await exportAccountantMonthCsvAction();
      if (!r.ok) {
        window.alert(r.error);
        return;
      }
      const blob = new Blob([r.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = r.filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return issuedRows.filter((row) => {
      if (!docMatchesTab(row.docType, tab)) return false;
      if (!q) return true;
      const num = String(row.number);
      return (
        row.clientName.toLowerCase().includes(q) ||
        num.includes(q) ||
        DOC_TYPE_LABEL[row.docType].toLowerCase().includes(q)
      );
    });
  }, [issuedRows, searchTerm, tab]);

  const vatHint = !isReportable
    ? "ארגון אישי — מזכר פנימי ללא מע״מ"
    : companyType === CompanyType.EXEMPT_DEALER
      ? "עוסק פטור — ללא מע״מ"
      : `מבוסס על ${Math.round(VAT_RATE * 100)}% (מורשה / חברה)`;

  return (
    <div className="min-h-0 max-w-[1600px] mx-auto p-4 sm:p-8 md:p-10 text-right space-y-10" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-10">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter">
            מרכז פיננסי <span className="text-blue-600 italic">BSD-YBM</span>
          </h1>
          <p className="text-slate-500 font-medium text-base sm:text-lg mt-2">
            ניהול חשבוניות, הפקדות ודיווח מע״מ — {organizationName}
            {taxId ? (
              <span className="block text-sm text-slate-400 mt-1">ח.פ / ע.מ {taxId}</span>
            ) : null}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Link
            href="/dashboard/settings?tab=billing"
            className="flex-1 md:flex-none bg-slate-100 text-slate-600 px-8 py-4 rounded-[1.5rem] font-bold hover:bg-slate-200 transition-all text-center inline-flex items-center justify-center"
          >
            הגדרות חשבונאיות
          </Link>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex-1 md:flex-none bg-gradient-to-tr from-blue-700 to-indigo-600 text-white px-10 py-4 rounded-[1.5rem] font-black shadow-2xl shadow-blue-200 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            <FilePlus size={22} /> הפקת מסמך
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          {
            title: "הכנסות ברוטו (חודשי)",
            value: formatMoney(stats.monthGross),
            sub: "סה״כ מסמכים שהונפקו החודש",
            color: "text-blue-600",
            bg: "bg-blue-50/50",
            icon: <TrendingUp className="w-6 h-6" />,
          },
          {
            title: "מע״מ (מסמכים החודש)",
            value: formatMoney(stats.monthVat),
            sub: vatHint,
            color: "text-purple-600",
            bg: "bg-purple-50/50",
            icon: <ShieldCheck className="w-6 h-6" />,
          },
          {
            title: "תשלומים בהמתנה (PayPal)",
            value: formatMoney(stats.pendingAmount),
            sub:
              stats.pendingInvoiceCount > 0
                ? `${stats.pendingInvoiceCount} חשבוניות פתוחות`
                : "אין חשבוניות ממתינות",
            color: "text-orange-600",
            bg: "bg-orange-50/50",
            icon: <History className="w-6 h-6" />,
          },
          {
            title: "שולם החודש (גולמי)",
            value: formatMoney(stats.paidMonthGross),
            sub: "סכום חשבוניות שסומנו כשולמו — לפני עמלות PayPal",
            color: "text-emerald-600",
            bg: "bg-emerald-50/50",
            icon: <CheckCircle2 className="w-6 h-6" />,
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`${card.bg} p-8 rounded-[3rem] border border-white shadow-xl shadow-slate-200/20 flex flex-col justify-between group hover:scale-[1.02] transition-all cursor-default`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 bg-white rounded-2xl shadow-sm ${card.color}`}>{card.icon}</div>
              <span className="text-[10px] font-black text-slate-400 bg-white/50 px-3 py-1 rounded-full uppercase italic">
                עדכני
              </span>
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm">{card.title}</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 break-words">{card.value}</h2>
              <p className="text-xs text-slate-400 mt-2">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <ReportingCenter />

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => handleExportAccountantCsv()}
          disabled={exportPending}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <Download size={18} aria-hidden />
          {exportPending ? "מייצא…" : "ייצוא לרואה חשבון (CSV)"}
        </button>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/40 border border-slate-50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-wrap justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={20} />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לקוח או מספר מסמך..."
              className="w-full pr-12 pl-4 py-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 gap-1 flex-wrap">
            {(
              [
                ["all", "הכל"],
                ["invoices", "חשבוניות"],
                ["receipts", "קבלות"],
                ["credits", "זיכויים"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  tab === key
                    ? "text-blue-600 bg-white shadow-sm"
                    : "text-slate-500 hover:text-blue-600 hover:bg-white/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[720px]">
            <thead className="bg-slate-50/30 text-slate-400 text-[11px] font-black uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="p-6 sm:p-8">סוג מסמך #</th>
                <th className="p-6 sm:p-8">לקוח / חברה</th>
                <th className="p-6 sm:p-8 text-center">סטטוס</th>
                <th className="p-6 sm:p-8 text-left">סה״כ (כולל מע״מ)</th>
                <th className="p-6 sm:p-8 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500 font-medium">
                    {issuedRows.length === 0
                      ? "אין עדיין מסמכים שהונפקו — לחצו על ״הפקת מסמך״ למעלה."
                      : "אין תוצאות לסינון הנוכחי."}
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6 sm:p-8">
                      <div className="flex items-center gap-4 sm:gap-5">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 rounded-[1.25rem] flex items-center justify-center text-blue-600 font-black shadow-sm italic shrink-0 text-sm sm:text-base">
                          #{doc.number}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-base sm:text-lg">{DOC_TYPE_LABEL[doc.docType]}</p>
                          <p className="text-[10px] text-blue-400 font-black uppercase tracking-wider leading-none mt-1">
                            {COMPANY_BADGE[companyType]}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 sm:p-8">
                      <p className="font-bold text-slate-700">{doc.clientName}</p>
                      <p className="text-xs text-slate-400">{doc.dateLabel}</p>
                    </td>
                    <td className="p-6 sm:p-8 text-center">
                      <span
                        className={`${STATUS_STYLE[doc.status]} px-4 sm:px-5 py-2 rounded-full text-[11px] font-black uppercase shadow-sm tracking-tighter inline-block`}
                      >
                        {STATUS_LABEL[doc.status]}
                      </span>
                    </td>
                    <td className="p-6 sm:p-8 text-left font-black text-slate-900 text-lg sm:text-xl tracking-tight italic">
                      {formatMoney(doc.total)}
                    </td>
                    <td className="p-6 sm:p-8">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          title="הדפסה / תצוגה להדפסה"
                          onClick={() => setPrintRow(doc)}
                          className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm text-slate-600"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          type="button"
                          title="עוד"
                          className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-100 transition-all shadow-sm text-slate-400"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {paymentBlock ? <div className="space-y-6">{paymentBlock}</div> : null}

      <CreateIssuedDocumentModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        contacts={contacts}
        companyType={companyType}
        isReportable={isReportable}
      />

      {printRow ? (
        <div
          className="fixed inset-0 z-[200] overflow-y-auto bg-slate-900/70 print:static print:bg-white print:overflow-visible"
          role="dialog"
          aria-modal="true"
          aria-label="תצוגת הדפסה"
        >
          <div className="sticky top-0 z-10 print:hidden flex flex-wrap justify-center gap-3 p-4 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700/50">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-2xl bg-white px-6 py-3 font-black text-slate-900 shadow-lg hover:bg-slate-100"
            >
              הדפס
            </button>
            <button
              type="button"
              onClick={() => setPrintRow(null)}
              className="rounded-2xl border border-white/30 bg-transparent px-6 py-3 font-bold text-white hover:bg-white/10"
            >
              סגור
            </button>
          </div>
          <div className="flex justify-center p-4 pb-16 print:p-0 print:block">
            <DocumentPrintTemplate
              doc={{
                type: printRow.docType,
                number: printRow.number,
                date: printRow.dateIso,
                clientName: printRow.clientName,
                status: printRow.status,
                amount: printRow.amount,
                vat: printRow.vat,
                total: printRow.total,
                items: printRow.items,
              }}
              org={{
                name: organizationName,
                address: orgAddress,
                taxId,
                companyType,
                isReportable,
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
