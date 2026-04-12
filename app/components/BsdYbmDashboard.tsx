"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  Users,
  Sparkles,
  ScanLine,
  X,
  TrendingUp,
  TrendingDown,
  Zap,
  ChevronLeft,
  BarChart3,
  ArrowUpRight,
  Wallet,
  Brain,
  Settings,
  PieChart,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { processDocumentAction } from "@/app/actions/process-document";
import DashboardRevenueChart from "@/components/dashboard/DashboardRevenueChart";
import type { OrgDashboardHomeData } from "@/lib/dashboard-home-data";
import { formatCreditsForDisplay } from "@/lib/org-credits-display";
import { useI18n } from "@/components/I18nProvider";
import { useIndustryConfig } from "@/hooks/use-industry-config";
import { motion } from "framer-motion";
import { Loader2, Users as UsersIcon } from "lucide-react";

/* ─── types ─── */
type ScanResult = {
  vendor?: string;
  totalAmount?: number | string;
  docType?: string;
  summary?: string;
};
type ProcessDocumentResult = {
  success: boolean;
  data?: { aiData?: ScanResult; _usageWarnings?: ("cheap_80" | "premium_80")[] };
  error?: string;
  code?: string;
};

/* ─── helpers ─── */
function fmt(n: number) {
  return n.toLocaleString("he-IL", { maximumFractionDigits: 0 });
}

/* Animated counter hook */
function useAnimatedNumber(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    }
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);
  return value;
}

/* ─── component ─── */
type Props = { homeData: OrgDashboardHomeData };

export default function BsdYbmDashboard({ homeData }: Props) {
  const { dir, t, locale } = useI18n();
  const industry = useIndustryConfig();
  const { data: session, status } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadErrorDismissed, setUploadErrorDismissed] = useState(false);
  const [scanQuotaRedirect, setScanQuotaRedirect] = useState(false);
  const [scanUsageNotice, setScanUsageNotice] = useState<string | null>(null);

  const {
    monthTitle,
    monthGross,
    monthChangePct,
    pipelineValue,
    pipelineDealCount,
    recentContacts,
    monthlySeries,
    cheapScansRemaining,
    premiumScansRemaining,
    subscriptionTier,
  } = homeData;

  const userName = session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "שלום";
  const firstName = userName.split(/\s+/)[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : "ערב טוב";
  const trendUp = monthChangePct !== null && monthChangePct >= 0;

  const animatedRevenue = useAnimatedNumber(monthGross);
  const animatedPipeline = useAnimatedNumber(pipelineValue);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadErrorDismissed(false);
    setScanQuotaRedirect(false);
    setScanUsageNotice(null);
    try {
      if (status !== "authenticated" || !session?.user?.id || !session?.user?.organizationId) {
        setUploadError("נדרשת התחברות כדי להעלות ולפענח מסמכים.");
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      const result = (await processDocumentAction(
        formData, session.user.id, session.user.organizationId,
      )) as ProcessDocumentResult;
      if (!result.success) {
        setScanResult(null);
        setScanQuotaRedirect(result.code === "QUOTA_EXCEEDED");
        setUploadError(result.error ?? "אירעה שגיאה בפענוח המסמך.");
        return;
      }
      setScanResult(result.data?.aiData ?? null);
      const w = result.data?._usageWarnings;
      if (w?.length) {
        const parts: string[] = [];
        if (w.includes("cheap_80")) parts.push("ניצלתם ~80% ממכסת הסריקות הזולות.");
        if (w.includes("premium_80")) parts.push("ניצלתם ~80% ממכסת הסריקות הפרימיום.");
        setScanUsageNotice(parts.join(" "));
      }
    } catch {
      setScanResult(null);
      setUploadError("אירעה תקלה בזמן העלאת הקובץ. נסה שוב.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const showUploadError = uploadError && !uploadErrorDismissed;

  return (
    <div className="space-y-5 pb-6" dir={dir}>

      {/* ═══════════════════════════════════════════
          HERO — Dynamic Greeting
      ═══════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm md:p-10">
        <div className="absolute inset-y-0 start-0 w-1.5 bg-indigo-600" aria-hidden />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-indigo-300">{subscriptionTier}</span>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            {greeting}, {firstName}
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            {new Date().toLocaleDateString(locale === "he" ? "he-IL" : "en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          BENTO GRID — Pro Action Cards
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { href: "/dashboard/crm", icon: <Users size={20} />, label: industry.vocabulary.client, desc: t("dashboard.crm"), color: "indigo" },
          { href: "/dashboard/erp", icon: <FileText size={20} />, label: industry.vocabulary.document, desc: t("dashboard.erp"), color: "emerald" },
          { href: "/dashboard/ai", icon: <Brain size={20} />, label: t("nav.solutions"), desc: t("dashboard.aiHub"), color: "indigo" },
          { href: "/dashboard/settings", icon: <Settings size={20} />, label: t("dashboard.settings"), desc: t("marketingDrawer.navAria"), color: "gray" },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-indigo-200 hover:shadow-md h-full"
          >
            <div>
              <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-gray-400 group-hover:bg-indigo-500/15 group-hover:text-indigo-400 transition-colors`}>
                {c.icon}
              </div>
              <p className="text-sm font-black text-gray-900">{c.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{c.desc}</p>
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase text-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity">
              <span>ניתוב</span>
              <ArrowUpRight size={14} />
            </div>
          </Link>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          INTELLIGENCE GRID — Data & Actions
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

        {/* Revenue insight card — 5 cols */}
        <div className="lg:col-span-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
                <BarChart3 size={15} className="text-emerald-400" />
              </div>
              <p className="text-sm font-black text-gray-900">{t("dashboard.stats.revenue")}</p>
            </div>
            {monthChangePct !== null && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                trendUp ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-50 text-rose-700"
              }`}>
                {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {Math.abs(monthChangePct).toFixed(1)}%
              </span>
            )}
          </div>
          
          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-1">{monthTitle}</p>
            <p className="text-4xl font-black tabular-nums text-gray-900 tracking-tight">
              &#8362;{fmt(animatedRevenue)}
            </p>
          </div>

          <div className="mb-6">
            <DashboardRevenueChart data={monthlySeries} />
          </div>

          <Link href="/dashboard/erp" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-50 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors">
            {t("dashboard.quickActions.erp")}
            <ChevronLeft size={14} />
          </Link>
        </div>

        {/* Action column — 7 cols */}
        <div className="lg:col-span-7 flex flex-col gap-4">

          {/* AI Scan card */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-indigo-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Pulse AI</span>
                </div>
                <h3 className="text-lg font-black leading-tight text-gray-900">{t("scanner.title")}</h3>
                <p className="mt-1 max-w-sm text-xs text-gray-400">
                  {t("erpDash.scannerDesc")}
                </p>
                
                <div className="mt-6 flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-indigo-500/20 active:scale-95">
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} accept="image/*,.pdf" />
                    {isUploading ? <Loader2 className="animate-spin" size={17} /> : <Upload size={17} />}
                    {isUploading ? t("scanner.processing") : t("erpDash.scannerCta")}
                  </label>
                  <Link href="/dashboard/ai" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50">
                    {t("dashboard.aiHub")}
                    <ChevronLeft size={15} />
                  </Link>
                </div>
              </div>

              {/* Quota indicators */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Standard</p>
                  <p className="text-2xl font-black text-gray-900">{formatCreditsForDisplay(cheapScansRemaining)}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-center ring-1 ring-indigo-500/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Premium</p>
                  <p className="text-2xl font-black text-indigo-600">{formatCreditsForDisplay(premiumScansRemaining)}</p>
                </div>
              </div>
            </div>

            {/* AI Results placeholder/list */}
            {scanResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 ring-1 ring-white/50">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-black uppercase tracking-tighter text-indigo-400">תוצאות סריקה אחרונה</p>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-500">נשמר בהצלחה</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "ספק", value: scanResult.vendor ?? "—" },
                    { label: "סכום", value: `₪${scanResult.totalAmount ?? "—"}` },
                    { label: "סיווג", value: scanResult.docType ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] text-indigo-300 font-bold">{label}</p>
                      <p className="mt-1 text-sm font-black text-gray-900 truncate">{value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Activity column */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 flex-1">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15">
                  <UsersIcon size={15} className="text-indigo-400" />
                </div>
                <p className="text-sm font-black text-gray-900">{industry.vocabulary.client} {t("dashboard.stats.clients")}</p>
              </div>
              <Link href="/dashboard/crm" className="text-[11px] font-bold text-indigo-400 hover:underline">
                {t("executive.linkIntelligence")}
              </Link>
            </div>

            {recentContacts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-10 text-center">
                <UsersIcon className="text-gray-300" size={32} strokeWidth={1} />
                <div>
                  <p className="text-sm font-bold text-gray-500">{t("dashboard.stats.clients")} — אין נתונים</p>
                  <Link href="/dashboard/crm" className="mt-2 inline-flex text-xs font-black text-indigo-600 hover:underline">
                     צפו בניהול {industry.vocabulary.client}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentContacts.slice(0, 5).map((c) => (
                  <Link
                    key={c.id}
                    href="/dashboard/crm"
                    className="flex items-center justify-between gap-4 rounded-xl border border-transparent p-2.5 transition-all hover:border-gray-100 hover:bg-gray-50 group"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white shadow-sm shadow-indigo-200">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900">{c.name}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          c.status === "CLOSED_LOST" ? "bg-gray-50 text-gray-400" :
                          c.status === "PROPOSAL" ? "bg-indigo-500/15 text-indigo-300" :
                          "bg-indigo-500/15 text-indigo-300"
                        }`}>{c.statusLabel}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ ALERTS ═══ */}
      {scanUsageNotice && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-500/15 px-5 py-4 text-sm text-amber-900">
          <Zap size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="font-bold">יתרת סריקות נמוכה</p>
            <p className="mt-1 text-xs text-amber-400">{scanUsageNotice}</p>
          </div>
        </div>
      )}
      {showUploadError && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4" role="alert">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-rose-800">{uploadError}</p>
            {scanQuotaRedirect && (
              <Link href="/dashboard/billing" className="mt-1 inline-block text-xs font-bold text-indigo-300 hover:underline">שדרוג מנוי</Link>
            )}
          </div>
          <button type="button" onClick={() => setUploadErrorDismissed(true)} className="shrink-0 rounded-lg p-1.5 text-rose-400 hover:bg-rose-100 transition-colors" aria-label="סגור">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
