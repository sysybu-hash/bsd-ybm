"use client";

import { useMemo, useState, useTransition } from "react";
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
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import CreateIssuedDocumentModal, {
  type CrmContactOption,
} from "@/components/billing/CreateIssuedDocumentModal";
import DocumentPrintTemplate from "@/components/billing/DocumentPrintTemplate";
import ReportingCenter from "@/components/billing/ReportingCenter";
import type { PayPalInvoiceRow } from "@/components/billing/PayPalInvoicesSection";
import { exportAccountantMonthCsvAction } from "@/app/dashboard/billing/export-accountant-csv";
import { paypalMeUrlWithAmount } from "@/lib/paypal-me-payment";
import { useI18n } from "@/components/I18nProvider";

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

type UnifiedRow =
  | { kind: "issued"; doc: IssuedDocRow; sortTs: number }
  | { kind: "paypal"; inv: PayPalInvoiceRow; sortTs: number };

function rowMatchesTab(row: UnifiedRow, tab: TabKey): boolean {
  if (row.kind === "paypal") {
    return tab === "all" || tab === "invoices";
  }
  return docMatchesTab(row.doc.docType, tab);
}

function rowMatchesSearch(row: UnifiedRow, q: string): boolean {
  if (!q) return true;
  if (row.kind === "issued") {
    const d = row.doc;
    const num = String(d.number);
    return (
      d.clientName.toLowerCase().includes(q) ||
      num.includes(q) ||
      DOC_TYPE_LABEL[d.docType].toLowerCase().includes(q)
    );
  }
  const inv = row.inv;
  return (
    inv.customerName.toLowerCase().includes(q) ||
    inv.description.toLowerCase().includes(q) ||
    String(inv.number).toLowerCase().includes(q) ||
    inv.customerEmail.toLowerCase().includes(q)
  );
}

function paypalStatusClass(status: string) {
  if (status === "PAID") return "bg-emerald-100 text-emerald-700";
  if (status === "PENDING") return "bg-orange-100 text-orange-700";
  return "bg-slate-100 text-slate-600";
}

function paypalStatusLabel(status: string) {
  if (status === "PAID") return "שולם";
  if (status === "PENDING") return "בהמתנה";
  return status;
}

type Props = {
  organizationName: string;
  orgAddress: string | null;
  companyType: CompanyType;
  taxId: string | null;
  /** false = מסמכים כמזכר פנימי ללא מע״מ */
  isReportable: boolean;
  issuedRows: IssuedDocRow[];
  /** חשבוניות עסקה / גבייה PayPal (מודל Invoice) */
  paypalRows?: PayPalInvoiceRow[];
  paypalMeSlug?: string | null;
  paypalMerchantEmail?: string | null;
  stats: BillingHubStats;
  contacts: CrmContactOption[];
};

export default function GlobalBillingPageClient({
  organizationName,
  orgAddress,
  companyType,
  taxId,
  isReportable,
  issuedRows,
  paypalRows = [],
  paypalMeSlug = null,
  paypalMerchantEmail = null,
  stats,
  contacts,
}: Props) {
  const { dir } = useI18n();
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

  const unifiedRows = useMemo((): UnifiedRow[] => {
    const paypal: UnifiedRow[] = paypalRows.map((inv) => ({
      kind: "paypal",
      inv,
      sortTs: new Date(inv.createdAtIso).getTime(),
    }));
    const issued: UnifiedRow[] = issuedRows.map((doc) => ({
      kind: "issued",
      doc,
      sortTs: new Date(doc.dateIso).getTime(),
    }));
    return [...paypal, ...issued].sort((a, b) => b.sortTs - a.sortTs);
  }, [paypalRows, issuedRows]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return unifiedRows.filter(
      (row) => rowMatchesTab(row, tab) && rowMatchesSearch(row, q),
    );
  }, [unifiedRows, searchTerm, tab]);

  const hasAnyRows = issuedRows.length > 0 || paypalRows.length > 0;

  const vatHint = !isReportable
    ? "ארגון אישי — מזכר פנימי ללא מע״מ"
    : companyType === CompanyType.EXEMPT_DEALER
      ? "עוסק פטור — ללא מע״מ"
      : `מבוסס על ${Math.round(VAT_RATE * 100)}% (מורשה / חברה)`;

  return (
    <div className="mx-auto min-h-0 max-w-[1600px] space-y-10 p-4 text-start sm:p-8 md:p-10" dir={dir}>
      <div className="flex flex-col gap-6 border-b border-slate-200/80 pb-10 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black italic tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
            מרכז פיננסי <span className="text-blue-600">BSD-YBM</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            ניהול חשבוניות, הפקדות ודיווח מע״מ — {organizationName}
            {taxId ? (
              <span className="block text-sm text-slate-400 mt-1">ח.פ / ע.מ {taxId}</span>
            ) : null}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <Link
            href="/dashboard/settings?tab=billing"
            className="btn-secondary flex-1 justify-center py-3.5 sm:flex-none md:px-8"
          >
            הגדרות חשבונאיות
          </Link>
          <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary flex-1 gap-2 py-3.5 sm:flex-none md:px-10">
            <FilePlus size={22} aria-hidden />
            הפקת מסמך
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
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
            className={`card-avenue flex cursor-default flex-col justify-between p-6 transition-shadow hover:shadow-md ${card.bg}`}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className={`rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 ${card.color}`}>{card.icon}</div>
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase italic text-slate-400 ring-1 ring-slate-100">
                עדכני
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">{card.title}</p>
              <p className="mt-1 break-words text-2xl font-black text-slate-900 sm:text-3xl">{card.value}</p>
              <p className="mt-2 text-xs text-slate-400">{card.sub}</p>
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
          className="btn-secondary text-sm disabled:opacity-50"
        >
          <Download size={18} aria-hidden />
          {exportPending ? "מייצא…" : "ייצוא לרואה חשבון (CSV)"}
        </button>
      </div>

      <div className="card-avenue overflow-hidden shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6 md:p-8">
          <div className="relative w-full md:w-96">
            <Search
              className="pointer-events-none absolute top-1/2 text-slate-400 -translate-y-1/2 end-3.5"
              size={20}
              aria-hidden
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לקוח או מספר מסמך..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 ps-4 pe-11 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-100 bg-slate-50 p-1.5">
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
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all sm:px-6 ${
                  tab === key
                    ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-200/60"
                    : "text-slate-500 hover:bg-white/80 hover:text-blue-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-start">
            <thead className="border-b border-slate-100 bg-blue-50/90 text-[11px] font-black uppercase tracking-widest text-blue-900">
              <tr>
                <th className="p-6 sm:p-8">סוג / מקור #</th>
                <th className="p-6 sm:p-8">לקוח / חברה</th>
                <th className="p-6 sm:p-8 text-center">סטטוס</th>
                <th className="p-6 text-end sm:p-8">סכום</th>
                <th className="p-6 sm:p-8 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12">
                    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
                      <div className="rounded-2xl bg-blue-50 p-4 text-blue-600 ring-1 ring-blue-100">
                        <FilePlus size={36} strokeWidth={1.25} aria-hidden />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">
                          {!hasAnyRows ? "אין עדיין מסמכים" : "אין תוצאות לסינון"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {!hasAnyRows
                            ? "הפיקו מסמך או צרו חשבונית PayPal — כפתור „הפקת מסמך” למעלה."
                            : "נסו חיפוש אחר או בחרו טאב אחר."}
                        </p>
                      </div>
                      {!hasAnyRows ? (
                        <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary text-sm">
                          הפקת מסמך
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) =>
                  row.kind === "issued" ? (
                    <tr key={`i-${row.doc.id}`} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-6 sm:p-8">
                        <div className="flex items-center gap-4 sm:gap-5">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 rounded-[1.25rem] flex items-center justify-center text-blue-600 font-black shadow-sm italic shrink-0 text-sm sm:text-base">
                            #{row.doc.number}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-base sm:text-lg">
                              {DOC_TYPE_LABEL[row.doc.docType]}
                            </p>
                            <p className="text-[10px] text-blue-400 font-black uppercase tracking-wider leading-none mt-1">
                              {COMPANY_BADGE[companyType]}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 sm:p-8">
                        <p className="font-bold text-slate-700">{row.doc.clientName}</p>
                        <p className="text-xs text-slate-400">{row.doc.dateLabel}</p>
                      </td>
                      <td className="p-6 sm:p-8 text-center">
                        <span
                          className={`${STATUS_STYLE[row.doc.status]} px-4 sm:px-5 py-2 rounded-full text-[11px] font-black uppercase shadow-sm tracking-tighter inline-block`}
                        >
                          {STATUS_LABEL[row.doc.status]}
                        </span>
                      </td>
                      <td className="p-6 text-end font-black text-lg text-slate-900 italic tracking-tight sm:p-8 sm:text-xl">
                        {formatMoney(row.doc.total)}
                      </td>
                      <td className="p-6 sm:p-8">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            title="הדפסה / תצוגה להדפסה"
                            onClick={() => setPrintRow(row.doc)}
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
                  ) : (
                    <tr key={`p-${row.inv.id}`} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-6 sm:p-8">
                        <div className="flex items-center gap-4 sm:gap-5">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#0070ba]/10 rounded-[1.25rem] flex items-center justify-center text-[#0070ba] font-black shadow-sm italic shrink-0 text-xs sm:text-sm">
                            #{row.inv.number}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-base sm:text-lg">{row.inv.description}</p>
                            <p className="text-[10px] text-[#0070ba] font-black uppercase tracking-wider leading-none mt-1">
                              PayPal · בקשת תשלום
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 sm:p-8">
                        <p className="font-bold text-slate-700">{row.inv.customerName}</p>
                        <p className="text-xs text-slate-400">{row.inv.date}</p>
                        {row.inv.customerEmail ? (
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5" dir="ltr">
                            {row.inv.customerEmail}
                          </p>
                        ) : null}
                      </td>
                      <td className="p-6 sm:p-8 text-center">
                        <span
                          className={`${paypalStatusClass(row.inv.status)} px-4 sm:px-5 py-2 rounded-full text-[11px] font-black uppercase shadow-sm tracking-tighter inline-block`}
                        >
                          {paypalStatusLabel(row.inv.status)}
                        </span>
                      </td>
                      <td className="p-6 text-end font-black text-lg text-slate-900 italic tracking-tight sm:p-8 sm:text-xl">
                        {formatMoney(row.inv.amount)}
                      </td>
                      <td className="p-6 sm:p-8">
                        <div className="flex flex-col items-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {row.inv.status !== "PAID" && paypalMeSlug?.trim() ? (
                            <a
                              href={paypalMeUrlWithAmount(paypalMeSlug.trim(), row.inv.amount)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0070ba] px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-[#005ea6]"
                            >
                              <ExternalLink size={14} aria-hidden />
                              תשלום
                            </a>
                          ) : null}
                          {row.inv.status !== "PAID" &&
                          paypalMerchantEmail?.trim() &&
                          !paypalMeSlug?.trim() ? (
                            <span className="text-[10px] text-slate-500 max-w-[140px] text-right" dir="ltr">
                              {paypalMerchantEmail.trim()}
                            </span>
                          ) : null}
                          {!paypalMeSlug?.trim() && !paypalMerchantEmail?.trim() ? (
                            <Link
                              href="/dashboard/settings?tab=billing"
                              className="text-[10px] font-bold text-[#0070ba] underline"
                            >
                              הגדרת PayPal
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateIssuedDocumentModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        contacts={contacts}
        companyType={companyType}
        isReportable={isReportable}
      />

      {printRow ? (
        <div
          className="fixed inset-0 z-[200] overflow-y-auto bg-slate-200/60 print:static print:bg-white print:overflow-visible"
          role="dialog"
          aria-modal="true"
          aria-label="תצוגת הדפסה"
        >
          <div className="sticky top-0 z-10 print:hidden flex flex-wrap justify-center gap-3 p-4 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
            <button type="button" onClick={() => window.print()} className="btn-primary px-6 py-3">
              הדפס
            </button>
            <button type="button" onClick={() => setPrintRow(null)} className="btn-secondary px-6 py-3">
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
