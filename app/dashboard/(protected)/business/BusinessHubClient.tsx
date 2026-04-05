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
  return `\u20aa${v.toLocaleString("he-IL", { maximumFractionDigits: 0 })}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

const STATUS_LABEL: Record<string, string> = {
  LEAD: "\u05dc\u05d9\u05d3",
  ACTIVE: "\u05e4\u05e2\u05d9\u05dc",
  PROPOSAL: "\u05d4\u05e6\u05e2\u05d4",
  CLOSED_WON: "\u05e0\u05e1\u05d2\u05e8 \u2713",
  CLOSED_LOST: "\u05e0\u05e1\u05d2\u05e8 \u2717",
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

  const wonContacts = contacts.filter((c) => c.status === "CLOSED_WON");

  /* ── Tab definitions ── */
  const TABS: { key: Tab; icon: React.ReactNode; label: string; badge?: number }[] = [
    { key: "overview", icon: <LayoutDashboard size={15} />, label: "\u05e1\u05e7\u05d9\u05e8\u05d4" },
    { key: "erp", icon: <FileText size={15} />, label: "\u05de\u05e1\u05de\u05db\u05d9\u05dd & ERP", badge: docs.length },
    { key: "crm", icon: <Users size={15} />, label: "\u05dc\u05e7\u05d5\u05d7\u05d5\u05ea & CRM", badge: contacts.length },
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
            <ReceiptText size={13} /> \u05d4\u05e0\u05e4\u05e7 \u05d7\u05e9\u05d1\u05d5\u05e0\u05d9\u05ea
          </Link>
        </div>
      </div>

      {/* ══════════ OVERVIEW TAB ══════════ */}
      {tab === "overview" && (
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">\u05de\u05e8\u05db\u05d6 \u05e2\u05e1\u05e7\u05d9</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              \u05ea\u05de\u05d5\u05e0\u05ea \u05de\u05e6\u05d1 \u05de\u05d0\u05d5\u05d7\u05d3\u05ea \u2014 ERP \u05d5-CRM \u05d1\u05d7\u05dc\u05d5\u05df \u05d0\u05d7\u05d3
            </p>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={13} className="text-emerald-500" />
                <p className="text-xs font-bold text-emerald-600">\u05d4\u05db\u05e0\u05e1\u05d5\u05ea</p>
              </div>
              <p className="text-xl font-black text-emerald-700">
                {income > 0 ? fmtMoney(income) : "\u2014"}
              </p>
              <p className="text-[10px] text-emerald-500 mt-0.5">\u05d7\u05e9\u05d1\u05d5\u05e0\u05d9\u05d5\u05ea \u05de\u05d5\u05e0\u05e4\u05e7\u05d5\u05ea</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <ShoppingCart size={13} className="text-rose-500" />
                <p className="text-xs font-bold text-rose-600">\u05d4\u05d5\u05e6\u05d0\u05d5\u05ea</p>
              </div>
              <p className="text-xl font-black text-rose-700">
                {expenses > 0 ? fmtMoney(expenses) : "\u2014"}
              </p>
              <p className="text-[10px] text-rose-500 mt-0.5">{docs.length} \u05de\u05e1\u05de\u05db\u05d9\u05dd \u05e1\u05e8\u05d5\u05e7\u05d9\u05dd</p>
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
                  \u05e8\u05d5\u05d5\u05d7 \u05d2\u05d5\u05dc\u05de\u05d9
                </p>
              </div>
              <p
                className={`text-xl font-black ${
                  profit >= 0 ? "text-blue-700" : "text-orange-700"
                }`}
              >
                {income > 0 || expenses > 0 ? fmtMoney(profit) : "\u2014"}
              </p>
              <p
                className={`text-[10px] mt-0.5 ${
                  profit >= 0 ? "text-blue-500" : "text-orange-500"
                }`}
              >
                \u05d4\u05db\u05e0\u05e1\u05d5\u05ea \u05e4\u05d7\u05d5\u05ea \u05d4\u05d5\u05e6\u05d0\u05d5\u05ea
              </p>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Layers size={13} className="text-violet-500" />
                <p className="text-xs font-bold text-violet-600">\u05e4\u05d9\u05d9\u05e4\u05dc\u05d9\u05d9\u05df CRM</p>
              </div>
              <p className="text-xl font-black text-violet-700">
                {pipelineValue > 0 ? fmtMoney(pipelineValue) : "\u2014"}
              </p>
              <p className="text-[10px] text-violet-500 mt-0.5">
                {contacts.filter(
                  (c) => !["CLOSED_WON", "CLOSED_LOST"].includes(c.status),
                ).length}{" "}
                \u05e2\u05e1\u05e7\u05d0\u05d5\u05ea \u05e4\u05ea\u05d5\u05d7\u05d5\u05ea
              </p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 size={13} className="text-sky-500" />
                <p className="text-xs font-bold text-sky-600">\u05d0\u05d7\u05d5\u05d6 \u05d4\u05e6\u05dc\u05d7\u05d4</p>
              </div>
              <p className="text-xl font-black text-sky-700">
                {winRate != null ? `${winRate}%` : "\u2014"}
              </p>
              <p className="text-[10px] text-sky-500 mt-0.5">
                {wonCount} \u05de\u05ea\u05d5\u05da {closedCount} \u05e1\u05d2\u05e8\u05d5
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/erp/invoice"
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm"
            >
              <ReceiptText size={15} /> \u05d4\u05e0\u05e4\u05e7 \u05d7\u05e9\u05d1\u05d5\u05e0\u05d9\u05ea
            </Link>
            <button
              type="button"
              onClick={() => setTab("erp")}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300 bg-cyan-50 px-4 py-2.5 text-sm font-bold text-cyan-800 hover:bg-cyan-100 transition"
            >
              <ScanLine size={15} /> \u05e1\u05e8\u05d5\u05e7 \u05de\u05e1\u05de\u05da
            </button>
            <button
              type="button"
              onClick={() => setTab("crm")}
              className="inline-flex items-center gap-2 rounded-2xl border border-violet-300 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-800 hover:bg-violet-100 transition"
            >
              <Plus size={15} /> \u05dc\u05e7\u05d5\u05d7 \u05d7\u05d3\u05e9
            </button>
          </div>

          {/* Sync Alert: won deals without invoice */}
          {wonContacts.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <CheckCircle2 size={18} />
              </div>
              <div className="flex-1">
                <p className="font-black text-emerald-900">
                  {wonContacts.length} \u05e2\u05e1\u05e7\u05d0\u05d5\u05ea \u05e9\u05e0\u05e1\u05d2\u05e8\u05d5 \u2014 \u05d4\u05e0\u05e4\u05e7 \u05d7\u05e9\u05d1\u05d5\u05e0\u05d9\u05d5\u05ea
                </p>
                <p className="text-sm text-emerald-700 mt-0.5">
                  \u05dc\u05d9\u05e6\u05d5\u05e8 \u05d7\u05e9\u05d1\u05d5\u05e0\u05d9\u05ea \u05e8\u05e9\u05de\u05d9\u05ea \u05e2\u05dd \u05e4\u05e8\u05d8\u05d9 \u05d4\u05dc\u05e7\u05d5\u05d7 \u05d0\u05d5\u05d8\u05d5\u05de\u05d8\u05d9\u05ea
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                {wonContacts.slice(0, 3).map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/erp/invoice?client=${encodeURIComponent(c.name)}`}
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
                    \u05e2\u05d5\u05d3 {wonContacts.length - 3} \u05e2\u05e1\u05e7\u05d0\u05d5\u05ea...
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recent Activity grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Documents */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <FileText size={14} className="text-indigo-500" />
                  \u05de\u05e1\u05de\u05db\u05d9\u05dd \u05d0\u05d7\u05e8\u05d5\u05e0\u05d9\u05dd
                </h2>
                <button
                  type="button"
                  onClick={() => setTab("erp")}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  \u05d4\u05db\u05dc <ArrowUpRight size={11} />
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {recentDocs.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-slate-400">
                    \u05d0\u05d9\u05df \u05de\u05e1\u05de\u05db\u05d9\u05dd \u05e2\u05d3\u05d9\u05d9\u05df
                  </p>
                ) : (
                  recentDocs.map((d) => (
                    <div key={d.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900 truncate max-w-[180px]">
                          {d.fileName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {d.type} \u00b7 {fmtDate(d.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                          d.status === "DONE"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Contacts */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Users size={14} className="text-violet-500" />
                  \u05dc\u05e7\u05d5\u05d7\u05d5\u05ea \u05d0\u05d7\u05e8\u05d5\u05e0\u05d9\u05dd
                </h2>
                <button
                  type="button"
                  onClick={() => setTab("crm")}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  \u05d4\u05db\u05dc <ArrowUpRight size={11} />
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {recentContacts.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-slate-400">
                    \u05d0\u05d9\u05df \u05dc\u05e7\u05d5\u05d7\u05d5\u05ea \u05e2\u05d3\u05d9\u05d9\u05df
                  </p>
                ) : (
                  recentContacts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{c.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {c.project?.name ?? "\u05dc\u05dc\u05d0 \u05e4\u05e8\u05d5\u05d9\u05e7\u05d8"} \u00b7 {fmtDate(c.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.value != null && (
                          <span className="text-xs font-black text-emerald-600">
                            {fmtMoney(c.value)}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                            STATUS_BADGE[c.status] ?? "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {STATUS_LABEL[c.status] ?? c.status}
                        </span>
                        {c.status === "CLOSED_WON" && (
                          <Link
                            href={`/dashboard/erp/invoice?client=${encodeURIComponent(c.name)}`}
                            className="rounded-lg bg-indigo-600 px-2 py-1 text-[10px] font-black text-white hover:bg-indigo-700 transition whitespace-nowrap"
                            title="\u05d4\u05e0\u05e4\u05e7 \u05d7\u05e9\u05d1\u05d5\u05e0\u05d9\u05ea"
                          >
                            <ReceiptText size={10} />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
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
                {wonContacts.length} \u05e2\u05e1\u05e7\u05d0\u05d5\u05ea CRM \u05e9\u05e0\u05e1\u05d2\u05e8\u05d5 \u2014 \u05e6\u05d5\u05e8 \u05d7\u05e9\u05d1\u05d5\u05e0\u05d9\u05d5\u05ea \u05d1\u05e7\u05dc\u05d9\u05e7:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {wonContacts.slice(0, 4).map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/erp/invoice?client=${encodeURIComponent(c.name)}`}
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
              \u05e0\u05d9\u05d4\u05d5\u05dc ERP \u05dc\u05e4\u05d9 \u05d6\u05e8\u05d9\u05de\u05d4 \u05d1\u05e8\u05d5\u05e8\u05d4
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              \u05d1\u05e6\u05e2 \u05dc\u05e4\u05d9 \u05d4\u05e1\u05d3\u05e8: \u05e1\u05e8\u05d9\u05e7\u05d4, \u05ea\u05de\u05d7\u05d5\u05e8, \u05d3\u05d5\u05d7\u05d5\u05ea, \u05d0\u05e8\u05db\u05d9\u05d5\u05df \u05de\u05e1\u05de\u05db\u05d9\u05dd.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/dashboard/erp/invoice"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition"
              >
                <ReceiptText size={15} />
                \u05d4\u05e0\u05e4\u05e7\u05ea \u05d7\u05e9\u05d1\u05d5\u05e0\u05d9\u05ea
              </Link>
            </div>
          </section>

          {!geminiConfigured && (
            <div
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
              role="alert"
            >
              <strong>\u05e9\u05d9\u05dd \u05dc\u05d1</strong>: \u05de\u05e4\u05ea\u05d7 Gemini \u05d7\u05e1\u05e8. \u05e1\u05e8\u05d9\u05e7\u05ea AI \u05dc\u05d0 \u05ea\u05e2\u05d1\u05d5\u05d3 \u05dc\u05dc\u05d0{" "}
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
        <p className="text-sm font-bold text-slate-500">\u05d8\u05d5\u05e2\u05df \u05de\u05e8\u05db\u05d6 \u05e2\u05e1\u05e7\u05d9...</p>
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