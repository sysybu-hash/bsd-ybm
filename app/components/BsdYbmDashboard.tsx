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
  const { dir } = useI18n();
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

  /* Quick-action cards for bento grid */
  const quickCards = [
    { href: "/dashboard/crm", icon: <Users size={20} />, label: "לקוחות", desc: "ניהול CRM", gradient: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/25" },
    { href: "/dashboard/erp", icon: <FileText size={20} />, label: "מסמכים", desc: "חשבוניות והצעות", gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/25" },
    { href: "/dashboard/ai", icon: <Brain size={20} />, label: "AI", desc: "סריקה חכמה", gradient: "from-indigo-500 to-indigo-600", shadow: "shadow-indigo-500/25" },
    { href: "/dashboard/settings", icon: <Settings size={20} />, label: "הגדרות", desc: "ניהול חשבון", gradient: "from-gray-500 to-gray-700", shadow: "shadow-gray-500/25" },
  ];

  return (
    <div className="space-y-5 pb-6" dir={dir}>

      {/* ═══════════════════════════════════════════
          HERO — Greeting + Subscription
      ═══════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 md:p-10"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        }}
      >
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-20 -end-20 h-60 w-60 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-16 -start-16 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute top-1/2 start-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/10 blur-2xl" aria-hidden />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-300">{subscriptionTier}</span>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
              {greeting}, {firstName}
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              {new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Mini stats in hero */}
          <div className="flex gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 backdrop-blur-sm min-w-[130px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">הכנסות</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-white">
                <span className="text-lg text-indigo-300">&#8362;</span>{fmt(animatedRevenue)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 backdrop-blur-sm min-w-[130px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300">צנרת</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-white">
                <span className="text-lg text-violet-300">&#8362;</span>{fmt(animatedPipeline)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          BENTO GRID — Quick actions
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickCards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${c.gradient} text-white shadow-lg ${c.shadow}`}>
              {c.icon}
            </div>
            <p className="text-sm font-black text-gray-900">{c.label}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{c.desc}</p>
            <ArrowUpRight size={14} className="absolute top-4 end-4 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          MAIN GRID — Revenue + Pipeline + Scan
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

        {/* Revenue card — 5 cols */}
        <div className="lg:col-span-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                <BarChart3 size={15} className="text-indigo-600" />
              </div>
              <p className="text-sm font-black text-gray-900">הכנסות</p>
            </div>
            <Link href="/dashboard/erp" className="text-[11px] font-bold text-indigo-600 hover:underline">
              ERP
            </Link>
          </div>
          <p className="text-[10px] text-gray-400 mb-4">{monthTitle}</p>

          <div className="mb-5">
            <p className="text-4xl font-black tabular-nums text-gray-900 tracking-tight">
              &#8362;{fmt(animatedRevenue)}
            </p>
            {monthChangePct !== null ? (
              <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                trendUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}>
                {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {Math.abs(monthChangePct).toFixed(1)}%
              </span>
            ) : (
              <p className="mt-1 text-[11px] text-gray-400">הנפיקו מסמכים ב-ERP</p>
            )}
          </div>

          {monthlySeries.length > 0 ? (
            <DashboardRevenueChart data={monthlySeries} />
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center">
              <PieChart className="text-gray-300" size={28} strokeWidth={1.25} />
              <p className="text-xs text-gray-500">עוד אין נתונים</p>
            </div>
          )}
        </div>

        {/* Right column — 7 cols: Scan + Contacts stacked */}
        <div className="lg:col-span-7 flex flex-col gap-4">

          {/* AI Scan — compact */}
          <div
            className="relative overflow-hidden rounded-2xl p-6"
            style={{
              background: "linear-gradient(135deg, #312e81 0%, #4338ca 50%, #3730a3 100%)",
            }}
          >
            <div className="pointer-events-none absolute -top-10 -end-10 h-40 w-40 rounded-full bg-indigo-400/20 blur-2xl" aria-hidden />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-indigo-300" />
                  <span className="text-xs font-black text-indigo-200 uppercase tracking-widest">AI Scanner</span>
                </div>
                <h3 className="text-lg font-black text-white leading-tight">סריקה חכמה</h3>
                <p className="text-xs text-indigo-200/70 mt-1 max-w-xs">
                  העלו מסמך לפענוח מיידי עם בינה מלאכותית
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-lg shadow-indigo-900/20 hover:bg-indigo-50 transition-colors">
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} accept="image/*,.pdf" />
                    <Upload size={15} />
                    {isUploading ? "מעבד..." : "העלאת מסמך"}
                  </label>
                  <Link href="/dashboard/ai" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20 transition-colors">
                    מרכז AI
                    <ChevronLeft size={14} />
                  </Link>
                </div>
              </div>

              {/* Scan credits mini */}
              <div className="flex gap-2 sm:flex-col">
                <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm text-center min-w-[90px]">
                  <p className="text-[9px] font-black uppercase tracking-wider text-indigo-200">Flash</p>
                  <p className="text-xl font-black text-white">{formatCreditsForDisplay(cheapScansRemaining)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm text-center min-w-[90px]">
                  <p className="text-[9px] font-black uppercase tracking-wider text-violet-200">Pro</p>
                  <p className="text-xl font-black text-white">{formatCreditsForDisplay(premiumScansRemaining)}</p>
                </div>
              </div>
            </div>

            {/* Scan result */}
            {scanResult && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">תוצאת פענוח</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "ספק", value: scanResult.vendor ?? "—" },
                    { label: "סכום", value: `₪${scanResult.totalAmount ?? "—"}` },
                    { label: "סוג", value: scanResult.docType ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[9px] text-indigo-300">{label}</p>
                      <p className="text-sm font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>
                {scanResult.summary && (
                  <p className="mt-2 text-[11px] text-indigo-200/80 border-t border-white/10 pt-2">{scanResult.summary}</p>
                )}
              </div>
            )}
          </div>

          {/* Recent contacts */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                  <Users size={15} className="text-violet-600" />
                </div>
                <p className="text-sm font-black text-gray-900">לקוחות אחרונים</p>
              </div>
              <Link href="/dashboard/crm" className="text-[11px] font-bold text-violet-600 hover:underline">
                הכל
              </Link>
            </div>

            {recentContacts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center">
                <Users className="text-gray-300" size={24} strokeWidth={1.25} />
                <p className="text-xs text-gray-500">אין לקוחות עדיין</p>
                <Link href="/dashboard/crm" className="text-xs font-bold text-violet-600 hover:underline">
                  הוספת לקוח
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {recentContacts.slice(0, 5).map((c) => (
                  <Link
                    key={c.id}
                    href="/dashboard/crm"
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 text-[11px] font-black text-white">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-800">{c.name}</p>
                        <p className="truncate text-[10px] text-gray-400" dir="ltr">{c.email ?? "—"}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                      c.status === "CLOSED_WON" ? "bg-emerald-50 text-emerald-700" :
                      c.status === "CLOSED_LOST" ? "bg-gray-100 text-gray-500" :
                      c.status === "PROPOSAL" ? "bg-indigo-50 text-indigo-700" :
                      "bg-violet-50 text-violet-700"
                    }`}>{c.statusLabel}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ ALERTS ═══ */}
      {scanUsageNotice && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <Zap size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="font-bold">יתרת סריקות נמוכה</p>
            <p className="mt-1 text-xs text-amber-700">{scanUsageNotice}</p>
          </div>
        </div>
      )}
      {showUploadError && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4" role="alert">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-rose-800">{uploadError}</p>
            {scanQuotaRedirect && (
              <Link href="/dashboard/billing" className="mt-1 inline-block text-xs font-bold text-indigo-700 hover:underline">שדרוג מנוי</Link>
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
