"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Users,
  LayoutDashboard,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  ReceiptText,
  ScanLine,
  Plus,
  Layers,
  ShoppingCart,
  Loader2,
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
import type { InvoiceRow, ErpSummary } from "../crm/CrmClient";
import type { PriceSpikeAlert } from "@/lib/erp-price-spikes";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type Tab = "overview" | "erp" | "crm";

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
  LEAD: "bg-violet-100 text-violet-700",
  ACTIVE: "bg-sky-100 text-sky-700",
  PROPOSAL: "bg-blue-100 text-blue-700",
  CLOSED_WON: "bg-emerald-100 text-emerald-700",
  CLOSED_LOST: "bg-rose-100 text-rose-600",
};

/* ─── Inner component (uses useSearchParams) ─────────────────────────────── */
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
  } = props;

  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get("tab") ?? "overview") as Tab;

  const setTab = (t: Tab) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", t);
    router.push(`?${p.toString()}`, { scroll: false });
  };

  /* ── Combined KPIs ── */
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

  const recentDocs = docs.slice(0, 6);
  const recentContacts = [...contacts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const wonContacts = contacts.filter((c) => c.status === "CLOSED_WON" && !(c.erp?.invoiceCount));

  const recentIssuedDocs = contacts
    .flatMap((c) => c.issuedDocuments ?? [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  /* ── Tab definitions ── */
  const TABS: { key: Tab; icon: React.ReactNode; label: string; badge?: number }[] = [
    { key: "overview", icon: <LayoutDashboard size={15} />, label: "מבט מאוחד" },
    { key: "erp", icon: <FileText size={15} />, label: "מסמכים & ERP", badge: docs.length },
    { key: "crm", icon: <Users size={15} />, label: "לקוחות & CRM", badge: contacts.length },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]" dir="rtl">
      {/* ── Sticky tab bar ── */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-0.5 py-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                  tab === t.key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
                {t.badge != null && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                      tab === t.key
                        ? "bg-white/25 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
          {/* Quick action always visible */}
          <Link
            href="/dashboard/erp/invoice"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm"
          >
            <ReceiptText size={13} /> הנפק חשבונית
          </Link>
        </div>
      </div>

      {/* ══════════ OVERVIEW TAB ══════════ */}
      {tab === "overview" && (
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-slate-900">מרכז עסקי</h1>
              <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                CRM ו-ERP מסונכרנים — מבט מאוחד בזמן אמת
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/erp/invoice"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm"
              >
                <ReceiptText size={14} /> הנפק חשבונית
              </Link>
              <button
                type="button"
                onClick={() => setTab("erp")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-800 hover:bg-cyan-100 transition"
              >
                <ScanLine size={14} /> סרוק מסמך
              </button>
              <button
                type="button"
                onClick={() => setTab("crm")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-800 hover:bg-violet-100 transition"
              >
                <Plus size={14} /> לקוח חדש
              </button>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={13} className="text-emerald-500" />
                <p className="text-xs font-bold text-emerald-600">הכנסות</p>
              </div>
              <p className="text-xl font-black text-emerald-700">
                {income > 0 ? fmtMoney(income) : "—"}
              </p>
              <p className="text-[10px] text-emerald-500 mt-0.5">חשבוניות מונפקות</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <ShoppingCart size={13} className="text-rose-500" />
                <p className="text-xs font-bold text-rose-600">הוצאות</p>
              </div>
              <p className="text-xl font-black text-rose-700">
                {expenses > 0 ? fmtMoney(expenses) : "—"}
              </p>
              <p className="text-[10px] text-rose-500 mt-0.5">{docs.length} מסמכים סרוקים</p>
            </div>
            <div
              className={`rounded-2xl border p-4 ${
                profit >= 0
                  ? "border-blue-100 bg-blue-50"
                  : "border-orange-100 bg-orange-50"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2
                  size={13}
                  className={profit >= 0 ? "text-blue-500" : "text-orange-500"}
                />
                <p
                  className={`text-xs font-bold ${
                    profit >= 0 ? "text-blue-600" : "text-orange-600"
                  }`}
                >
                  רווח גולמי
                </p>
              </div>
              <p
                className={`text-xl font-black ${
                  profit >= 0 ? "text-blue-700" : "text-orange-700"
                }`}
              >
                {income > 0 || expenses > 0 ? fmtMoney(profit) : "—"}
              </p>
              <p
                className={`text-[10px] mt-0.5 ${
                  profit >= 0 ? "text-blue-500" : "text-orange-500"
                }`}
              >
                הכנסות פחות הוצאות
              </p>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Layers size={13} className="text-violet-500" />
                <p className="text-xs font-bold text-violet-600">פייפליין CRM</p>
              </div>
              <p className="text-xl font-black text-violet-700">
                {pipelineValue > 0 ? fmtMoney(pipelineValue) : "—"}
              </p>
              <p className="text-[10px] text-violet-500 mt-0.5">
                {contacts.filter(
                  (c) => !["CLOSED_WON", "CLOSED_LOST"].includes(c.status),
                ).length}{" "}
                עסקאות פתוחות
              </p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 size={13} className="text-sky-500" />
                <p className="text-xs font-bold text-sky-600">אחוז הצלחה</p>
              </div>
              <p className="text-xl font-black text-sky-700">
                {winRate != null ? `${winRate}%` : "—"}
              </p>
              <p className="text-[10px] text-sky-500 mt-0.5">
                {wonCount} מתוך {closedCount} סגרו
              </p>
            </div>
          </div>

          {/* Sync Alert: won deals without invoice */}
          {wonContacts.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <CheckCircle2 size={18} />
              </div>
              <div className="flex-1">
                <p className="font-black text-emerald-900">
                  {wonContacts.length} עסקאות שנסגרו — הנפק חשבוניות
                </p>
                <p className="text-sm text-emerald-700 mt-0.5">
                  ליצור חשבונית רשמית עם פרטי הלקוח אוטומטית
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                {wonContacts.slice(0, 3).map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/erp/invoice?client=${encodeURIComponent(c.name)}&contactId=${c.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition whitespace-nowrap"
                  >
                    <ReceiptText size={11} /> {c.name}
                  </Link>
                ))}
                {wonContacts.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setTab("crm")}
                    className="rounded-xl border border-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                  >
                    עוד {wonContacts.length - 3} עסקאות...
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Synergy main grid: CRM × ERP ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* LEFT 2/3: unified CRM × ERP contacts table */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100" style={{background: 'linear-gradient(to right, #f5f3ff80, #eef2ff80)'}}>
                <h2 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Users size={13} className="text-violet-500" />
                  <span className="text-violet-700">CRM</span>
                  <span className="text-slate-300 font-normal text-base">×</span>
                  <FileText size={13} className="text-indigo-500" />
                  <span className="text-indigo-700">ERP</span>
                  <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">— מצב חיוב לפי לקוח</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setTab("crm")}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  ניהול מלא <ArrowUpRight size={11} />
                </button>
              </div>
              {contacts.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <Users size={32} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm text-slate-400">אין לקוחות עדיין</p>
                  <button
                    type="button"
                    onClick={() => setTab("crm")}
                    className="mt-3 text-xs font-bold text-blue-600 hover:underline"
                  >
                    + הוסף לקוח ראשון
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-right">
                        <th className="px-4 py-2.5 text-[11px] font-black text-slate-500">לקוח</th>
                        <th className="px-4 py-2.5 text-[11px] font-black text-slate-500">סטטוס CRM</th>
                        <th className="px-4 py-2.5 text-[11px] font-black text-slate-500 hidden md:table-cell">שווי עסקה</th>
                        <th className="px-4 py-2.5 text-[11px] font-black text-indigo-600">ERP — חויב</th>
                        <th className="px-4 py-2.5 text-[11px] font-black text-amber-600">פתוח לתשלום</th>
                        <th className="px-3 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {contacts.slice(0, 12).map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-2.5">
                            <p className="font-bold text-slate-900 leading-tight">{c.name}</p>
                            {c.project && (
                              <p className="text-[10px] text-slate-400">{c.project.name}</p>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                                STATUS_BADGE[c.status] ?? "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {STATUS_LABEL[c.status] ?? c.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 hidden md:table-cell">
                            {c.value != null ? (
                              <span className="text-sm font-black text-emerald-600">
                                {fmtMoney(c.value)}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {c.erp.invoiceCount > 0 ? (
                              <div>
                                <p className="text-sm font-black text-indigo-700">
                                  {fmtMoney(c.erp.totalBilled)}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {c.erp.invoiceCount} חשבוניות
                                </p>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {c.erp.invoiceCount > 0 ? (
                              c.erp.totalPending > 0 ? (
                                <span className="text-sm font-black text-amber-600">
                                  {fmtMoney(c.erp.totalPending)}
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                                  <CheckCircle2 size={10} /> שולם
                                </span>
                              )
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {c.status === "CLOSED_WON" && c.erp.invoiceCount === 0 && (
                              <Link
                                href={`/dashboard/erp/invoice?client=${encodeURIComponent(c.name)}&contactId=${c.id}`}
                                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-[10px] font-black text-white hover:bg-emerald-700 transition whitespace-nowrap shadow-sm"
                                title="הנפק חשבונית"
                              >
                                <ReceiptText size={10} /> הנפק
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {contacts.length > 12 && (
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-right">
                      <button
                        type="button"
                        onClick={() => setTab("crm")}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        + עוד {contacts.length - 12} לקוחות...
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT 1/3: ERP financial snapshot */}
            <div className="space-y-4">
              {/* Financial summary */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div
                  className="px-5 py-3.5 border-b border-slate-100"
                  style={{background: 'linear-gradient(to right, #eef2ff80, #eff6ff80)'}}
                >
                  <h2 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <TrendingUp size={13} className="text-indigo-500" />
                    תמונה פיננסית
                  </h2>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">הכנסות (ERP)</span>
                    <span className="text-sm font-black text-emerald-600">
                      {income > 0 ? fmtMoney(income) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">הוצאות (ERP)</span>
                    <span className="text-sm font-black text-rose-600">
                      {expenses > 0 ? fmtMoney(expenses) : "—"}
                    </span>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">רווח גולמי</span>
                    <span
                      className={`text-sm font-black ${
                        profit >= 0 ? "text-blue-700" : "text-orange-700"
                      }`}
                    >
                      {income > 0 || expenses > 0 ? fmtMoney(profit) : "—"}
                    </span>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">פייפליין CRM</span>
                    <span className="text-sm font-black text-violet-600">
                      {pipelineValue > 0 ? fmtMoney(pipelineValue) : "—"}
                    </span>
                  </div>
                  {winRate != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">אחוז הצלחה</span>
                      <span className="text-sm font-black text-sky-600">{winRate}%</span>
                    </div>
                  )}
                </div>
                <div className="px-4 pb-4">
                  <button
                    type="button"
                    onClick={() => setTab("erp")}
                    className="w-full rounded-xl border border-indigo-200 bg-indigo-50 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition flex items-center justify-center gap-1.5"
                  >
                    <FileText size={12} /> פתח ERP מלא
                  </button>
                </div>
              </div>

              {/* Recent issued invoices */}
              {recentIssuedDocs.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                    <h2 className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <ReceiptText size={13} className="text-indigo-500" />
                      חשבוניות אחרונות
                    </h2>
                    <Link
                      href="/dashboard/erp/invoice"
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      הנפק <ArrowUpRight size={11} />
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {recentIssuedDocs.map((d) => (
                      <div key={d.id} className="px-5 py-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
                            {d.clientName}
                          </p>
                          <p className="text-[10px] text-slate-400">{fmtDate(d.createdAt)}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-indigo-700">{fmtMoney(d.total)}</p>
                          <span
                            className={`text-[10px] font-bold ${
                              d.status === "PAID" ? "text-emerald-600" : "text-amber-600"
                            }`}
                          >
                            {d.status === "PAID" ? "שולם ✓" : "ממתין"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                  <ReceiptText size={24} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400">אין חשבוניות עדיין</p>
                  <Link
                    href="/dashboard/erp/invoice"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                  >
                    <ReceiptText size={11} /> הנפק ראשונה
                  </Link>
                </div>
              )}

              {/* Scanned expense docs summary */}
              {docs.length > 0 && (
                <div
                  className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
                  onClick={() => setTab("erp")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setTab("erp")}
                >
                  <div className="flex items-center gap-2">
                    <ScanLine size={14} className="text-cyan-500" />
                    <div>
                      <p className="text-xs font-black text-slate-700">{docs.length} מסמכים סרוקים</p>
                      <p className="text-[10px] text-slate-400">הוצאות ERP</p>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ ERP TAB ══════════ */}
      {tab === "erp" && (
        <div
          className="animate-in fade-in duration-300 rounded-2xl bg-slate-50/60 text-slate-900 p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto"
          dir="rtl"
        >
          {/* Sync banner: won CRM deals */}
          {wonContacts.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 flex flex-wrap items-center gap-3">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <p className="text-sm font-bold text-emerald-800 flex-1">
                {wonContacts.length} עסקאות CRM שנסגרו — צור חשבוניות בקליק:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {wonContacts.slice(0, 4).map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/erp/invoice?client=${encodeURIComponent(c.name)}&contactId=${c.id}`}
                    className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ERP Wizard */}
          <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
            <p className="mb-1 inline-flex rounded-full border border-cyan-300 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-700">
              ERP Wizard
            </p>
            <h1 className="text-lg font-black text-slate-900">
              ניהול ERP לפי זרימה ברורה
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              בצע לפי הסדר: סריקה, תמחור, דוחות, ארכיון מסמכים.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/dashboard/erp/invoice"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition"
              >
                <ReceiptText size={15} />
                הנפקת חשבונית
              </Link>
            </div>
          </section>

          {!geminiConfigured && (
            <div
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
              role="alert"
            >
              <strong>שים לב</strong>: מפתח Gemini חסר. סריקת AI לא תעבוד ללא{" "}
              <code className="bg-red-100 px-1 rounded">GOOGLE_GENERATIVE_AI_API_KEY</code>.
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

          <section id="erp-scanner">
            <MultiEngineScanner variant="light" />
          </section>

          <section className="space-y-6">
            <SupplierPriceBoard />
            {priceComparison && (
              <PriceComparisonChart
                data={priceComparison.data}
                productName={priceComparison.productName}
              />
            )}
          </section>

          <section>
            <FinancialCharts
              data={docs as unknown as any[]}
              variant="light"
            />
          </section>

          <section>
            <div className="w-full">
              <ErpDocumentsManager initialDocs={docs} />
            </div>
          </section>
        </div>
      )}

      {/* ══════════ CRM TAB ══════════ */}
      {tab === "crm" && (
        <div className="animate-in fade-in duration-300">
          <CrmClient
            contacts={contacts}
            projects={projects}
            hasOrganization={hasOrganization}
            organizations={organizations}
            showUnifiedBillingLinks={showUnifiedBillingLinks}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Export with Suspense wrapper ───────────────────────────────────────── */
function FallbackLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={36} className="animate-spin text-blue-600" />
        <p className="text-sm font-bold text-slate-500">טוען מרכז עסקי...</p>
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