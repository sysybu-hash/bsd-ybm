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
  Eye,
  Edit3,
  ReceiptText,
  CreditCard,
  Building2,
  FileDigit,
  Wallet,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import CreateIssuedDocumentModal, {
  type CrmContactOption,
} from "@/components/billing/CreateIssuedDocumentModal";
import DocumentPrintTemplate from "@/components/billing/DocumentPrintTemplate";
import EditIssuedDocumentModal from "@/components/billing/EditIssuedDocumentModal";
import DocumentPreviewModal from "@/components/billing/DocumentPreviewModal";
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
  paidMonthGross: number;
};

const DOC_TYPE_LABEL: Record<DocType, string> = {
  INVOICE: "חשבונית מס",
  RECEIPT: "קבלה",
  INVOICE_RECEIPT: "חשבונית מס קבלה",
  CREDIT_NOTE: "זיכוי",
};

const COMPANY_BADGE: Record<CompanyType, string> = {
  EXEMPT_DEALER: "עוסק פטור",
  LICENSED_DEALER: "עוסק מורשה",
  LTD_COMPANY: "חברה בע״מ",
};

const STATUS_LABEL: Record<DocStatus, string> = {
  PAID: "שולם בהצלחה",
  PENDING: "ממתין לתשלום",
  CANCELLED: "מבוטל",
};

const STATUS_STYLE: Record<DocStatus, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
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
  if (status === "PAID") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "PENDING") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-500 border-slate-200";
}

function paypalStatusLabel(status: string) {
  if (status === "PAID") return "שולם בהצלחה";
  if (status === "PENDING") return "ממתין לתשלום";
  return status;
}

type Props = {
  organizationName: string;
  orgAddress: string | null;
  companyType: CompanyType;
  taxId: string | null;
  isReportable: boolean;
  issuedRows: IssuedDocRow[];
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
  const [editRow, setEditRow] = useState<IssuedDocRow | null>(null);
  const [previewRow, setPreviewRow] = useState<IssuedDocRow | null>(null);
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
      : `מע"מ מחושב באופן דינמי כ-${Math.round(VAT_RATE * 100)}%`;

  return (
    <div className="w-full min-w-0 space-y-8 text-start pb-16" dir={dir}>

      {/* ── Page header (Enterprise Bento Style) ── */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-surface-white px-6 py-6 md:px-8 shadow-sm">
        <div className="absolute inset-y-0 start-0 w-2 bg-gradient-to-b from-blue-600 to-sky-400" />
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-blue-700 shadow-sm">
              <ShieldCheck size={13} className="text-blue-600" /> מרכז סליקה ופיננסים (הנהלת חשבונות)
            </span>
            <h1 className="mt-3 text-3xl font-black italic text-slate-900 drop-shadow-sm flex items-center gap-3">
               דשבורד כספים כללי
               {isReportable && <span className="bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider not-italic mb-1">מוכר למס</span>}
            </h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm font-medium text-slate-500">
               <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md"><Building2 size={14}/> {organizationName}</span>
               {taxId && <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md"><FileDigit size={14}/> ח.פ/עוסק: {taxId} | {COMPANY_BADGE[companyType]}</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/app/settings?tab=billing"
              className="btn-secondary flex items-center gap-2 border-slate-200 bg-white"
            >
              הגדרות חשבונאיות המערכת
            </Link>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="btn-primary flex items-center gap-2 shadow-lg shadow-blue-500/20 py-2.5 px-6"
            >
              <FilePlus size={18} aria-hidden />
              הפקת מסמך עסקי מדגם ישראל
            </button>
          </div>
        </div>
      </section>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "מחזור עסקאות ברוטו (החודש)", value: formatMoney(stats.monthGross), sub: "סה״כ כלל המסמכים שהונפקו החודש", color: "text-blue-700", border: "border-blue-200", bg: "bg-blue-50", icon: <TrendingUp size={22} className="text-blue-600" /> },
          { title: "הפרשת מע״מ צפי (החודש)", value: formatMoney(stats.monthVat), sub: vatHint, color: "text-slate-700", border: "border-slate-200", bg: "bg-slate-50", icon: <ReceiptText size={22} className="text-slate-600" /> },
          { title: "חובות פתוחים צפי תזרים", value: formatMoney(stats.pendingAmount), sub: stats.pendingInvoiceCount > 0 ? `${stats.pendingInvoiceCount} תנועות פתוחות לתשלום מלקוחות` : "אין ממתינות – עבודה מצוינת!", color: "text-amber-700", border: "border-amber-200", bg: "bg-amber-50", icon: <Wallet size={22} className="text-amber-600"/> },
          { title: "תזרימי מזומנים - נכנס בפועל", value: formatMoney(stats.paidMonthGross), sub: "שולם באופן וודאי החודש (כולל סליקה)", color: "text-emerald-700", border: "border-emerald-200", bg: "bg-emerald-50", icon: <CheckCircle2 size={22} className="text-emerald-600"/> },
        ].map((card, i) => (
          <div key={i} className="card-avenue rounded-3xl p-6 flex flex-col justify-between group">
            <div className="mb-4 flex items-center justify-between">
               <div className={`p-2.5 rounded-xl border shadow-inner ${card.bg} ${card.border}`}>
                 {card.icon}
               </div>
               <ArrowUpRight size={20} className="text-slate-300 group-hover:text-slate-800 transition" />
            </div>
            <div>
               <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest mb-1.5">{card.title}</p>
               <p className={`text-3xl font-black ${card.color} tracking-tight`}>{card.value}</p>
               <p className="mt-2 text-xs font-bold text-slate-400">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card-avenue rounded-3xl p-2 w-full mt-2">
         {/* Embedded reporting center without looking disconnected */}
         <ReportingCenter />
      </div>

      <div className="flex justify-end mt-2">
        <button type="button" onClick={() => handleExportAccountantCsv()} disabled={exportPending} className="btn-secondary border-blue-200 bg-blue-50 text-blue-700 font-black px-6 py-2.5 flex items-center gap-2 hover:bg-blue-100 transition shadow-sm border">
          <Download size={18} aria-hidden />
          {exportPending ? "מייצא דוח מסכם..." : "הורד קובץ הנהלת חשבונות לרו״ח (במבנה פקודות חשבשבת)"}
        </button>
      </div>

      {/* ── Documents table ── */}
      <div className="card-avenue rounded-3xl overflow-hidden mt-2">
        {/* Table toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 bg-slate-50/50">
          <div className="relative flex-1 min-w-[250px] max-w-sm">
            <Search className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="איתור מסמך לפי: שם לקוח, מוצר, סכום או מספר חשבונית..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 ps-4 pe-11 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm"
            />
          </div>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            {([["all", "תצוגת כלל המסמכים"], ["invoices", "חשבוניות לתשלום"], ["receipts", "רשומות קבלה"], ["credits", "זיכויים צרכניים"]] as const).map(([key, label]) => (
              <button key={key} type="button" onClick={() => setTab(key)}
                className={`rounded-xl px-5 py-2 text-sm font-bold transition-all ${tab === key ? "bg-white text-blue-700 shadow-sm border border-slate-200 ring-1 ring-slate-900/5" : "text-slate-500 hover:text-slate-800"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full min-w-[900px] text-start">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-6 py-4 text-start text-[11px] font-black uppercase tracking-widest text-slate-500">סוג מסמך ומספר מזהה</th>
                <th className="px-6 py-4 text-start text-[11px] font-black uppercase tracking-widest text-slate-500">ישות ומועד הפקה</th>
                <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest text-slate-500">סטטוס מסמך פיננסי</th>
                <th className="px-6 py-4 text-end text-[11px] font-black uppercase tracking-widest text-slate-500">סך בשקלים (כולל מע״מ)</th>
                <th className="w-28 px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 bg-white">
                    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 border border-dashed border-blue-200 text-blue-500">
                        <FilePlus size={36} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl font-black italic text-slate-900">{!hasAnyRows ? "לא הופק תיעוד פנימי עדיין" : "לא מצאנו מה שחיפשת"}</h3>
                      <p className="text-sm font-medium text-slate-500 max-w-sm">{!hasAnyRows ? "סביבת הנהלת החשבונות שלכם מוכנה! הפיקו את החשבונית הראשונה שלכם בלחיצת כפתור כדי להתחיל לקבל תשלומים מאובטחים מלקוחותיכם." : "נסו לבדוק שוב את הסינון או את מילות החיפוש שהוזנו."}</p>
                      {!hasAnyRows ? (
                        <button type="button" onClick={() => setCreateOpen(true)} className="mt-4 btn-primary flex items-center gap-2 py-3 px-8 shadow-lg shadow-blue-500/20">
                          <FilePlus size={18} /> הפק חשבונית מס או קבלה ממוספשת
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) =>
                  row.kind === "issued" ? (
                    <tr key={`i-${row.doc.id}`} className="group transition-colors hover:bg-blue-50/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 shadow-sm border border-blue-100 text-sm font-black text-blue-600">
                            #{row.doc.number}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{DOC_TYPE_LABEL[row.doc.docType]}</p>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-0.5">{COMPANY_BADGE[companyType]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-700">{row.doc.clientName}</p>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">{row.doc.dateLabel}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-[11px] font-black tracking-wide uppercase shadow-sm w-fit ${STATUS_STYLE[row.doc.status]}`}>
                          {STATUS_LABEL[row.doc.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-end">
                         <span className="text-base font-black text-slate-900 tabular-nums">
                            {formatMoney(row.doc.total)}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button type="button" title="תצוגה מקדימה עותק דיגיטלי" onClick={() => setPreviewRow(row.doc)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-400 shadow-sm transition hover:border-blue-300 hover:text-blue-500">
                            <Eye size={16} />
                          </button>
                          <button type="button" title="הורדת מסמך חתום" onClick={() => setPrintRow(row.doc)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-400 shadow-sm transition hover:border-blue-300 hover:text-blue-500">
                            <Download size={16} />
                          </button>
                          <button type="button" title="עריכת סעיפי החשבון" onClick={() => setEditRow(row.doc)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-400 shadow-sm transition hover:border-blue-300 hover:text-blue-500">
                            <Edit3 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={`p-${row.inv.id}`} className="group transition-colors hover:bg-teal-50/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 shadow-sm border border-teal-100 text-sm font-black text-teal-600">
                            #{row.inv.number}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 max-w-[200px] truncate">{row.inv.description}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-teal-500 mt-0.5 flex items-center gap-1"><CreditCard size={10}/> PAYPAL</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-700">{row.inv.customerName}</p>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">{row.inv.date}</p>
                        {row.inv.customerEmail ? <p className="text-[11px] font-mono font-medium text-slate-400 mt-1" dir="ltr">{row.inv.customerEmail}</p> : null}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-[11px] font-black tracking-wide uppercase shadow-sm w-fit ${paypalStatusClass(row.inv.status)}`}>
                          {paypalStatusLabel(row.inv.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-end">
                         <span className="text-base font-black text-slate-900 tabular-nums">
                            {formatMoney(row.inv.amount)}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          {row.inv.status !== "PAID" && paypalMeSlug?.trim() ? (
                            <a href={paypalMeUrlWithAmount(paypalMeSlug.trim(), row.inv.amount)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-teal-700 shadow-sm">
                              <ExternalLink size={14} /> גישה לדף סליקה
                            </a>
                          ) : null}
                          {row.inv.status !== "PAID" && paypalMerchantEmail?.trim() && !paypalMeSlug?.trim() ? (
                            <span className="max-w-[140px] text-right text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded" dir="ltr">{paypalMerchantEmail.trim()}</span>
                          ) : null}
                          {!paypalMeSlug?.trim() && !paypalMerchantEmail?.trim() ? (
                            <Link href="/app/settings?tab=billing" className="text-[10px] font-bold text-teal-500 underline underline-offset-2">קנפג קבלת תשלומים (PayPal)</Link>
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

      {editRow && (
        <EditIssuedDocumentModal
          doc={editRow}
          companyType={companyType}
          isReportable={isReportable}
          onClose={() => setEditRow(null)}
          onSaved={() => { setEditRow(null); }}
        />
      )}

      {previewRow && (
        <DocumentPreviewModal
          doc={previewRow}
          org={{ name: organizationName, address: orgAddress, taxId, companyType, isReportable }}
          onClose={() => setPreviewRow(null)}
        />
      )}

      {printRow && (
        <DocumentPreviewModal
          doc={printRow}
          org={{ name: organizationName, address: orgAddress, taxId, companyType, isReportable }}
          onClose={() => setPrintRow(null)}
        />
      )}
    </div>
  );
}
