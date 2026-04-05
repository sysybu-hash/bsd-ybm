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
  CANCELLED: "bg-gray-100 text-gray-600",
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
  return "bg-gray-100 text-gray-600";
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
    <div className="space-y-8 text-start" dir={dir}>

      {/* ── Page header ── */}
      <section className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white px-6 py-7 shadow-sm md:px-8">
        <div className="absolute inset-y-0 start-0 w-1.5 bg-indigo-600" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-700">
              <ShieldCheck size={11} /> מרכז פיננסי
            </span>
            <h1 className="mt-2.5 text-2xl font-black tracking-tight text-gray-900">מסמכים ותשלומים</h1>
            <p className="mt-1 text-sm text-gray-500">
              {organizationName}
              {taxId ? <span className="ms-2 text-gray-400">· ח.פ {taxId}</span> : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/settings?tab=billing"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50"
            >
              הגדרות חשבונאיות
            </Link>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-600/25 transition hover:bg-indigo-700"
            >
              <FilePlus size={17} aria-hidden />
              הפקת מסמך
            </button>
          </div>
        </div>
      </section>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "הכנסות ברוטו (חודשי)", value: formatMoney(stats.monthGross), sub: "סה״כ מסמכים שהונפקו החודש", color: "text-indigo-600", iconBg: "bg-indigo-50", icon: <TrendingUp size={20} /> },
          { title: "מע״מ (מסמכים החודש)", value: formatMoney(stats.monthVat), sub: vatHint, color: "text-indigo-600", iconBg: "bg-indigo-50", icon: <ShieldCheck size={20} /> },
          { title: "תשלומים בהמתנה", value: formatMoney(stats.pendingAmount), sub: stats.pendingInvoiceCount > 0 ? `${stats.pendingInvoiceCount} חשבוניות פתוחות` : "אין ממתינות", color: "text-orange-600", iconBg: "bg-orange-50", icon: <History size={20} /> },
          { title: "שולם החודש (גולמי)", value: formatMoney(stats.paidMonthGross), sub: "לפני עמלות PayPal", color: "text-emerald-600", iconBg: "bg-emerald-50", icon: <CheckCircle2 size={20} /> },
        ].map((card, i) => (
          <div key={i} className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.color}`}>
                {card.icon}
              </div>
              <p className="text-xs font-bold text-gray-500">{card.title}</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{card.value}</p>
            <p className="mt-1.5 text-xs text-gray-400">{card.sub}</p>
          </div>
        ))}
      </div>

      <ReportingCenter />

      <div className="flex justify-end">
        <button type="button" onClick={() => handleExportAccountantCsv()} disabled={exportPending} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50">
          <Download size={16} aria-hidden />
          {exportPending ? "מייצא…" : "ייצוא לרואה חשבון (CSV)"}
        </button>
      </div>

      {/* ── Documents table ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {/* Table toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} aria-hidden />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לקוח או מסמך..."
              className="rounded-xl border border-gray-200 bg-gray-50 py-2.5 ps-4 pe-9 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
          <div className="flex gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
            {([["all", "הכל"], ["invoices", "חשבוניות"], ["receipts", "קבלות"], ["credits", "זיכויים"]] as const).map(([key, label]) => (
              <button key={key} type="button" onClick={() => setTab(key)}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${tab === key ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-start">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-5 py-3 text-start text-[10px] font-bold uppercase tracking-wider text-gray-400">סוג / מספר</th>
                <th className="px-5 py-3 text-start text-[10px] font-bold uppercase tracking-wider text-gray-400">לקוח</th>
                <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">סטטוס</th>
                <th className="px-5 py-3 text-end text-[10px] font-bold uppercase tracking-wider text-gray-400">סכום</th>
                <th className="w-20 px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <FilePlus size={28} strokeWidth={1.5} />
                      </div>
                      <p className="font-bold text-gray-700">{!hasAnyRows ? "אין עדיין מסמכים" : "אין תוצאות לסינון"}</p>
                      <p className="text-sm text-gray-500">{!hasAnyRows ? "הפיקו מסמך ראשון דרך הכפתור למעלה." : "נסו חיפוש אחר."}</p>
                      {!hasAnyRows ? (
                        <button type="button" onClick={() => setCreateOpen(true)} className="mt-1 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90" style={{ backgroundColor: "var(--primary-color, #2563eb)" }}>
                          <FilePlus size={15} /> הפקת מסמך
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) =>
                  row.kind === "issued" ? (
                    <tr key={`i-${row.doc.id}`} className="group transition-colors hover:bg-gray-50/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-black text-indigo-600">
                            #{row.doc.number}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{DOC_TYPE_LABEL[row.doc.docType]}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{COMPANY_BADGE[companyType]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-bold text-gray-700">{row.doc.clientName}</p>
                        <p className="text-xs text-gray-400">{row.doc.dateLabel}</p>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-block rounded-lg border px-3 py-1 text-[10px] font-bold ${STATUS_STYLE[row.doc.status]} border-current/20`}>
                          {STATUS_LABEL[row.doc.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-end font-black text-gray-900">{formatMoney(row.doc.total)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button type="button" title="הדפסה" onClick={() => setPrintRow(row.doc)} className="rounded-lg border border-gray-100 bg-white p-2 text-gray-500 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600">
                            <Download size={15} />
                          </button>
                          <button type="button" title="עוד" className="rounded-lg border border-gray-100 bg-white p-2 text-gray-400 shadow-sm transition hover:bg-gray-100">
                            <MoreVertical size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={`p-${row.inv.id}`} className="group transition-colors hover:bg-gray-50/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-black text-indigo-600">
                            #{row.inv.number}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{row.inv.description}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">PayPal</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-bold text-gray-700">{row.inv.customerName}</p>
                        <p className="text-xs text-gray-400">{row.inv.date}</p>
                        {row.inv.customerEmail ? <p className="text-[11px] font-mono text-gray-400" dir="ltr">{row.inv.customerEmail}</p> : null}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-block rounded-lg px-3 py-1 text-[10px] font-bold ${paypalStatusClass(row.inv.status)}`}>
                          {paypalStatusLabel(row.inv.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-end font-black text-gray-900">{formatMoney(row.inv.amount)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col items-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                          {row.inv.status !== "PAID" && paypalMeSlug?.trim() ? (
                            <a href={paypalMeUrlWithAmount(paypalMeSlug.trim(), row.inv.amount)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-indigo-700">
                              <ExternalLink size={12} /> תשלום
                            </a>
                          ) : null}
                          {row.inv.status !== "PAID" && paypalMerchantEmail?.trim() && !paypalMeSlug?.trim() ? (
                            <span className="max-w-[140px] text-right text-[10px] text-gray-500" dir="ltr">{paypalMerchantEmail.trim()}</span>
                          ) : null}
                          {!paypalMeSlug?.trim() && !paypalMerchantEmail?.trim() ? (
                            <Link href="/dashboard/settings?tab=billing" className="text-[10px] font-bold text-indigo-600 underline">הגדרת PayPal</Link>
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
          className="fixed inset-0 z-[200] overflow-y-auto bg-gray-200/60 print:static print:bg-white print:overflow-visible"
          role="dialog"
          aria-modal="true"
          aria-label="תצוגת הדפסה"
        >
          <div className="sticky top-0 z-10 print:hidden flex flex-wrap justify-center gap-3 border-b border-gray-200 bg-white p-4 shadow-sm">
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
