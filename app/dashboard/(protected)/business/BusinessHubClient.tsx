"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Users,
  TrendingUp,
  CheckCircle2,
  ReceiptText,
  ShoppingCart,
  Loader2,
  ChevronDown,
  Layers,
  AlertTriangle,
} from "lucide-react";
import ERPDashboard, {
  type ErpStatCard,
  type ErpFlowSummary,
} from "@/components/ERPDashboard";
import ErpDocumentsManager from "@/components/ErpDocumentsManager";
import SupplierPriceBoard from "@/components/SupplierPriceBoard";
import FinancialCharts from "@/components/FinancialCharts";
import PriceComparisonChart from "@/components/PriceComparisonChart";
import MultiEngineScanner from "@/components/MultiEngineScanner";
import ErpHistoricalImportCallout from "@/components/ErpHistoricalImportCallout";
import CrmClient from "../crm/CrmClient";
import type { CrmAdminOrganizationRow } from "../crm/CrmOrganizationsAdminTable";
import type { InvoiceRow, ErpSummary, OrgBillingInfo } from "../crm/CrmClient";
import type { PriceSpikeAlert } from "@/lib/erp-price-spikes";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type ContactRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  value: number | null;
  status: string;
  project: { id: string; name: string } | null;
  createdAt: string;
  issuedDocuments?: InvoiceRow[];
  erp: ErpSummary;
};

type ProjectRow = {
  id: string;
  name: string;
  isActive: boolean;
  activeFrom: string | null;
  activeTo: string | null;
};

type ErpDocRow = {
  id: string;
  fileName: string;
  type: string;
  status: string;
  createdAt: string;
  aiData: any;
};

type Props = {
  geminiConfigured: boolean;
  scanQuotaSummary: string | null;
  stats: ErpStatCard[];
  chartData: { name: string; value: number }[];
  flowSummary: ErpFlowSummary | null;
  priceSpikes: PriceSpikeAlert[];
  docs: ErpDocRow[];
  priceComparison: { data: any; productName: string } | null;
  contacts: ContactRow[];
  projects: ProjectRow[];
  hasOrganization: boolean;
  organizations: CrmAdminOrganizationRow[];
  showUnifiedBillingLinks: boolean;
  orgBilling: OrgBillingInfo | null;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function fmtMoney(v: number) {
  return `₪${v.toLocaleString("he-IL", { maximumFractionDigits: 0 })}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

const STATUS_LABEL: Record<string, string> = {
  LEAD: "ליד",
  ACTIVE: "פעיל",
  PROPOSAL: "הצעה",
  CLOSED_WON: "נסגר ✓",
  CLOSED_LOST: "נסגר ✗",
};
const STATUS_BADGE: Record<string, string> = {
  LEAD:        "bg-indigo-500/[0.12] text-indigo-300",
  ACTIVE:      "bg-sky-500/[0.12] text-sky-300",
  PROPOSAL:    "bg-violet-500/[0.12] text-violet-300",
  CLOSED_WON:  "bg-emerald-500/[0.12] text-emerald-300",
  CLOSED_LOST: "bg-rose-500/[0.12] text-rose-300",
};

/* ─── Inner component ────────────────────────────────────────────────────── */
function HubContent(props: Props) {
  const {
    geminiConfigured,
    scanQuotaSummary,
    stats,
    chartData,
    flowSummary,
    priceSpikes,
    docs,
    priceComparison,
    contacts,
    projects,
    hasOrganization,
    organizations,
    showUnifiedBillingLinks,
    orgBilling,
  } = props;

  const [erpOpen, setErpOpen] = useState(false);

  /* ── KPIs ── */
  const income = flowSummary?.totalIssued ?? 0;
  const expenses = flowSummary?.totalExpenses ?? 0;
  const profit = income - expenses;
  const pipelineValue = contacts
    .filter((c) => !["CLOSED_WON", "CLOSED_LOST"].includes(c.status))
    .reduce((s, c) => s + (c.value ?? 0), 0);
  const wonCount = contacts.filter((c) => c.status === "CLOSED_WON").length;
  const closedCount = contacts.filter(
    (c) => c.status === "CLOSED_WON" || c.status === "CLOSED_LOST",
  ).length;
  const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : null;

  const wonContacts = contacts.filter((c) => c.status === "CLOSED_WON" && !(c.erp?.invoiceCount));

  const recentIssuedDocs = contacts
    .flatMap((c) => c.issuedDocuments ?? [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-[#050508]" dir="rtl">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 border-b border-white/[0.07] bg-black/80 shadow-sm" style={{ backdropFilter: "blur(12px)" }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 shadow-sm">
              <Layers size={14} className="text-white" />
            </div>
            <h1 className="font-black text-lg text-white">מרכז עסקי</h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.10] px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              CRM × ERP
            </span>
          </div>
          <Link
            href="/dashboard/erp/invoice"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-indigo-500/25 hover:bg-indigo-400 transition-all"
          >
            <ReceiptText size={14} /> הנפק חשבונית
          </Link>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-5 space-y-5">

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all hover:-translate-y-0.5 hover:bg-white/[0.05]">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                <TrendingUp size={13} />
              </div>
              <p className="text-xs font-bold text-white/55">הכנסות</p>
            </div>
            <p className="text-2xl font-black text-white">{income > 0 ? fmtMoney(income) : "—"}</p>
            <p className="text-[10px] text-white/35 mt-1">חשבוניות מונפקות</p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all hover:-translate-y-0.5 hover:bg-white/[0.05]">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm">
                <ShoppingCart size={13} />
              </div>
              <p className="text-xs font-bold text-white/55">הוצאות</p>
            </div>
            <p className="text-2xl font-black text-white">{expenses > 0 ? fmtMoney(expenses) : "—"}</p>
            <p className="text-[10px] text-white/35 mt-1">{docs.length} מסמכים סרוקים</p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all hover:-translate-y-0.5 hover:bg-white/[0.05]">
            <div className="flex items-center gap-1.5 mb-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-xl text-white shadow-sm ${profit >= 0 ? "bg-indigo-500" : "bg-amber-500"}`}>
                <CheckCircle2 size={13} />
              </div>
              <p className="text-xs font-bold text-white/55">רווח גולמי</p>
            </div>
            <p className={`text-2xl font-black ${profit >= 0 ? "text-indigo-300" : "text-amber-300"}`}>
              {income > 0 || expenses > 0 ? fmtMoney(profit) : "—"}
            </p>
            <p className="text-[10px] text-white/35 mt-1">הכנסות פחות הוצאות</p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all hover:-translate-y-0.5 hover:bg-white/[0.05]">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm">
                <Layers size={13} />
              </div>
              <p className="text-xs font-bold text-white/55">פייפליין CRM</p>
            </div>
            <p className="text-2xl font-black text-indigo-300">{pipelineValue > 0 ? fmtMoney(pipelineValue) : "—"}</p>
            <p className="text-[10px] text-white/35 mt-1">
              {contacts.filter((c) => !["CLOSED_WON", "CLOSED_LOST"].includes(c.status)).length} עסקאות פתוחות
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all hover:-translate-y-0.5 hover:bg-white/[0.05]">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm">
                <CheckCircle2 size={13} />
              </div>
              <p className="text-xs font-bold text-white/55">אחוז הצלחה</p>
            </div>
            <p className="text-2xl font-black text-sky-300">{winRate != null ? `${winRate}%` : "—"}</p>
            <p className="text-[10px] text-white/35 mt-1">{wonCount} מתוך {closedCount} סגרו</p>
          </div>
        </div>

        {/* ── Alert: עסקאות שנסגרו ללא חשבונית ── */}
        {wonContacts.length > 0 && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] px-5 py-4 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white">
              <CheckCircle2 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-emerald-200">{wonContacts.length} עסקאות נסגרו — ממתינות לחשבונית</p>
              <p className="text-sm text-emerald-400 mt-0.5">לחץ על שם הלקוח להנפקה מהירה עם הפרטים מולאו אוטומטית</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {wonContacts.slice(0, 3).map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/erp/invoice?client=${encodeURIComponent(c.name)}&contactId=${c.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-400 transition whitespace-nowrap"
                >
                  <ReceiptText size={11} /> {c.name}
                </Link>
              ))}
              {wonContacts.length > 3 && (
                <span className="rounded-xl border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300">
                  + עוד {wonContacts.length - 3}...
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── CRM עם ERP — הלב של הדף ── */}
        <CrmClient
          contacts={contacts}
          projects={projects}
          hasOrganization={hasOrganization}
          organizations={organizations}
          showUnifiedBillingLinks={showUnifiedBillingLinks}
          orgBilling={orgBilling}
        />

        {/* ── כלי ERP — מקופלים כברירת מחדל ── */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <button
            type="button"
            onClick={() => setErpOpen((v) => !v)}
            className="w-full px-5 py-4 flex items-center justify-between text-sm font-bold text-white/65 hover:bg-white/[0.04] transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/[0.15]">
                <FileText size={14} className="text-indigo-400" />
              </span>
              <span>
                <span className="font-black text-white">כלי ERP</span>
                <span className="text-white/40 ms-2 text-xs">סריקת מסמכים, דוחות וארכיון</span>
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-bold text-white/40">
                {docs.length} מסמכים
              </span>
            </span>
            <ChevronDown
              size={14}
              className={`text-white/35 transition-transform duration-200 ${erpOpen ? "rotate-180" : ""}`}
            />
          </button>
          {erpOpen && (
            <div className="border-t border-white/[0.07] space-y-6 p-5">
              {!geminiConfigured && (
                <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3 text-sm text-rose-200" role="alert">
                  <AlertTriangle size={16} className="shrink-0 text-rose-400" />
                  <span><strong>שים לב</strong>: מפתח Gemini חסר. סריקת AI לא תעבוד ללא <code className="bg-rose-500/[0.15] px-1 rounded">GOOGLE_GENERATIVE_AI_API_KEY</code>.</span>
                </div>
              )}
              <ERPDashboard
                stats={stats}
                chartData={chartData}
                scanQuotaSummary={scanQuotaSummary}
                flowSummary={flowSummary}
                priceSpikes={priceSpikes}
              />
              <ErpHistoricalImportCallout />
              <MultiEngineScanner variant="dark" />
              <SupplierPriceBoard />
              {priceComparison && (
                <PriceComparisonChart
                  data={priceComparison.data}
                  productName={priceComparison.productName}
                />
              )}
              <FinancialCharts data={docs as unknown as any[]} variant="dark" />
              <ErpDocumentsManager initialDocs={docs} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ─── Export with Suspense wrapper ───────────────────────────────────────── */
function FallbackLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#050508]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={36} className="animate-spin text-indigo-400" />
        <p className="text-sm font-bold text-white/35">טוען מרכז עסקי...</p>
      </div>
    </div>
  );
}

export default function BusinessHubClient(props: Props) {
  return (
    <Suspense fallback={<FallbackLoader />}>
      <HubContent {...props} />
    </Suspense>
  );
}