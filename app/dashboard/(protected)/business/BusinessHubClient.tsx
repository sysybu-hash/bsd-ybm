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
import { PriceSpikeAlert } from "@/lib/erp-price-spikes";
import { useIndustryConfig } from "@/hooks/use-industry-config";

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
  LEAD:        "bg-indigo-50 text-indigo-700 border-indigo-200",
  ACTIVE:      "bg-sky-50 text-sky-700 border-sky-200",
  PROPOSAL:    "bg-violet-50 text-violet-700 border-violet-200",
  CLOSED_WON:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED_LOST: "bg-rose-50 text-rose-700 border-rose-200",
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
  const industry = useIndustryConfig();

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
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 shadow-sm" style={{ backdropFilter: "blur(12px)" }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 shadow-sm">
              <Layers size={14} className="text-white" />
            </div>
            <h1 className="font-black text-lg text-gray-900">{industry.label}</h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              CRM × ERP
            </span>
          </div>
          <Link
                    href="/app/documents/issue"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all"
          >
            <ReceiptText size={14} /> הנפק {industry.vocabulary.document}
          </Link>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-5 space-y-5">

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp size={13} />
              </div>
              <p className="text-xs font-bold text-gray-500">הכנסות</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{income > 0 ? fmtMoney(income) : "—"}</p>
            <p className="text-[10px] text-gray-400 mt-1">חשבוניות מונפקות</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <ShoppingCart size={13} />
              </div>
              <p className="text-xs font-bold text-gray-500">הוצאות</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{expenses > 0 ? fmtMoney(expenses) : "—"}</p>
            <p className="text-[10px] text-gray-400 mt-1">{docs.length} מסמכים סרוקים</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-1.5 mb-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-xl ${profit >= 0 ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"}`}>
                <CheckCircle2 size={13} />
              </div>
              <p className="text-xs font-bold text-gray-500">רווח גולמי</p>
            </div>
            <p className={`text-2xl font-black ${profit >= 0 ? "text-indigo-600" : "text-amber-600"}`}>
              {income > 0 || expenses > 0 ? fmtMoney(profit) : "—"}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">הכנסות פחות הוצאות</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Layers size={13} />
              </div>
              <p className="text-xs font-bold text-gray-500">פייפליין {industry.vocabulary.client}</p>
            </div>
            <p className="text-2xl font-black text-indigo-600">{pipelineValue > 0 ? fmtMoney(pipelineValue) : "—"}</p>
            <p className="text-[10px] text-gray-400 mt-1">
              {contacts.filter((c) => !["CLOSED_WON", "CLOSED_LOST"].includes(c.status)).length} עסקאות פתוחות
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <CheckCircle2 size={13} />
              </div>
              <p className="text-xs font-bold text-gray-500">אחוז הצלחה</p>
            </div>
            <p className="text-2xl font-black text-sky-600">{winRate != null ? `${winRate}%` : "—"}</p>
            <p className="text-[10px] text-gray-400 mt-1">{wonCount} מתוך {closedCount} סגרו</p>
          </div>
        </div>

        {/* ── Alert: עסקאות שנסגרו ללא חשבונית ── */}
        {wonContacts.length > 0 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white">
              <CheckCircle2 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-emerald-800">{wonContacts.length} עסקאות נסגרו — ממתינות לחשבונית</p>
              <p className="text-sm text-emerald-600 mt-0.5">לחץ על שם הלקוח להנפקה מהירה עם הפרטים מולאו אוטומטית</p>
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
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setErpOpen((v) => !v)}
            className="w-full px-5 py-4 flex items-center justify-between text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50">
                <FileText size={14} className="text-indigo-600" />
              </span>
              <span>
                <span className="font-black text-gray-900">כלי ERP</span>
                <span className="text-gray-400 ms-2 text-xs">סריקת מסמכים, דוחות וארכיון</span>
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-500">
                {docs.length} מסמכים
              </span>
            </span>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200 ${erpOpen ? "rotate-180" : ""}`}
            />
          </button>
          {erpOpen && (
            <div className="border-t border-gray-100 space-y-6 p-5">
              {!geminiConfigured && (
                <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                  <AlertTriangle size={16} className="shrink-0 text-rose-500" />
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
              <MultiEngineScanner />
              <SupplierPriceBoard />
              {priceComparison && (
                <PriceComparisonChart
                  data={priceComparison.data}
                  productName={priceComparison.productName}
                />
              )}
              <FinancialCharts data={docs as unknown as any[]} variant="light" />
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
    <div className="flex min-h-[60vh] items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={36} className="animate-spin text-indigo-500" />
        <p className="text-sm font-bold text-gray-400">טוען מרכז עסקי...</p>
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
