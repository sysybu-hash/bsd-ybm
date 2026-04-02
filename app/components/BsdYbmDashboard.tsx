"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  Users,
  ArrowLeft,
  Sparkles,
  ScanLine,
  X,
  Inbox,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Zap,
  ChevronRight,
  BarChart3,
  Clock,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { processDocumentAction } from "@/app/actions/process-document";
import DashboardRevenueChart from "@/components/dashboard/DashboardRevenueChart";
import type { OrgDashboardHomeData } from "@/lib/dashboard-home-data";
import { formatCreditsForDisplay } from "@/lib/org-credits-display";
import { useI18n } from "@/components/I18nProvider";

type ScanResult = {
  vendor?: string;
  totalAmount?: number | string;
  docType?: string;
  summary?: string;
};

type ProcessDocumentResult = {
  success: boolean;
  data?: {
    aiData?: ScanResult;
    _usageWarnings?: ("cheap_80" | "premium_80")[];
  };
  error?: string;
  code?: string;
};

function formatMoney(n: number) {
  return `₪${n.toLocaleString("he-IL", { maximumFractionDigits: 0 })}`;
}

function statusBadge(status: string, label: string) {
  const map: Record<string, string> = {
    CLOSED_WON:  "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
    CLOSED_LOST: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    PROPOSAL:    "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
    ACTIVE:      "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
    LEAD:        "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
  };
  return (
    <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold ${map[status] ?? map.LEAD}`}>
      {label}
    </span>
  );
}

type Props = {
  homeData: OrgDashboardHomeData;
};

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
  const userInitials = userName
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase()).join("") ||
    session?.user?.email?.charAt(0)?.toUpperCase() || "?";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : "ערב טוב";

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
  const trendUp = monthChangePct !== null && monthChangePct >= 0;

  return (
    <div className="space-y-6 pb-4" dir={dir}>

      {/* ══ GREETING HEADER ══ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{greeting},</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">{firstName} 👋</h1>
          <p className="mt-1 text-sm text-slate-400">
            {new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {subscriptionTier}
          </span>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-black text-white shadow-md shadow-blue-500/30">
            {userInitials}
          </div>
        </div>
      </div>

      {/* ══ KPI CARDS ══ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* הכנסות החודש */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl shadow-blue-600/25">
          <div
            className="pointer-events-none absolute -top-8 -start-8 h-40 w-40 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
            aria-hidden
          />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-blue-200">הכנסות החודש</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
                <BarChart3 size={15} />
              </div>
            </div>
            <p className="text-[11px] text-blue-200/70 font-medium capitalize mb-1">{monthTitle}</p>
            <p className="text-4xl font-black tabular-nums tracking-tight">{formatMoney(monthGross)}</p>
            <div className="mt-3">
              {monthChangePct !== null ? (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  trendUp ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                }`}>
                  {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {Math.abs(monthChangePct).toFixed(1)}% מהחודש הקודם
                </span>
              ) : (
                <span className="text-[11px] text-blue-200/60">הנפיקו מסמכים ב-ERP לצפייה במגמה</span>
              )}
            </div>
          </div>
        </div>

        {/* משפך מכירות */}
        <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-shadow">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">משפך מכירות</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50">
              <Users size={15} className="text-violet-600" />
            </div>
          </div>
          <p className="text-4xl font-black tabular-nums text-slate-900 tracking-tight">{formatMoney(pipelineValue)}</p>
          <p className="mt-3 text-[11px] font-semibold text-violet-600">
            {pipelineDealCount > 0
              ? `${pipelineDealCount} הצעות מחיר ממתינות לחתימה`
              : "אין הצעות ממתינות — צרו מ-CRM"}
          </p>
          <Link href="/dashboard/crm" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-violet-600 transition-colors">
            לניהול לקוחות <ChevronRight size={11} />
          </Link>
        </div>

        {/* מכסות סריקה */}
        <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-shadow">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <ScanLine size={12} />
              מכסות סריקה
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50">
              <Zap size={15} className="text-sky-600" />
            </div>
          </div>
          <div className="flex gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-500 mb-1">Flash</p>
              <p className="text-3xl font-black tabular-nums text-slate-900">{formatCreditsForDisplay(cheapScansRemaining)}</p>
            </div>
            <div className="w-px bg-slate-100 self-stretch" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-violet-500 mb-1">Pro</p>
              <p className="text-3xl font-black tabular-nums text-slate-900">{formatCreditsForDisplay(premiumScansRemaining)}</p>
            </div>
          </div>
          <Link href="/dashboard/billing" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:underline">
            שדרוג מנוי <ChevronRight size={11} />
          </Link>
        </div>
      </div>

      {/* ══ SCAN CENTER ══ */}
      <section className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{ background: "radial-gradient(ellipse 70% 60% at 110% -10%, rgba(99,102,241,0.08) 0%, transparent 60%)" }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-700 ring-1 ring-indigo-100">
              <Sparkles size={10} />
              AI · Gemini · OpenAI · Claude
            </span>
            <h2 className="mt-3 text-xl font-black tracking-tight text-slate-900">מרכז הסריקה החכמה</h2>
            <p className="mt-1.5 max-w-md text-sm text-slate-500 leading-relaxed">
              פענוח מסמכים, חשבוניות וקבלות בשניות — עם בינה מלאכותית מתקדמת
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/dashboard/ai"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 transition-colors"
              >
                <Sparkles size={15} />
                פתיחת מרכז AI
              </Link>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} accept="image/*,.pdf" />
                <Upload size={15} className="text-indigo-500" />
                {isUploading ? "מעבד…" : "סריקה מהירה"}
              </label>
            </div>
          </div>

          {/* תוצאת סריקה */}
          <div className="w-full lg:max-w-[280px]">
            {scanResult ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm">
                <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <ScanLine size={11} /> תוצאת פענוח
                </p>
                <div className="space-y-2.5">
                  {[
                    { label: "ספק", value: scanResult.vendor ?? "—" },
                    { label: "סכום", value: `₪${scanResult.totalAmount ?? "—"}` },
                    { label: "סוג", value: scanResult.docType ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 text-xs">{label}</span>
                      <span className="font-bold text-slate-800 text-xs">{value}</span>
                    </div>
                  ))}
                </div>
                {scanResult.summary && (
                  <p className="mt-3 text-[11px] italic text-slate-500 leading-relaxed border-t border-slate-100 pt-3">{scanResult.summary}</p>
                )}
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors">
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} accept="image/*,.pdf" />
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <ScanLine className="text-slate-400" size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-600">גרור מסמך לכאן</p>
                  <p className="text-xs text-slate-400 mt-0.5">או לחצו לבחירת קובץ</p>
                </div>
              </label>
            )}
          </div>
        </div>
      </section>

      {/* ══ ALERTS ══ */}
      {scanUsageNotice && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <Zap size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="font-bold">⚠️ יתרת סריקות נמוכה</p>
            <p className="mt-1 text-xs text-amber-700">{scanUsageNotice}</p>
            <Link href="/dashboard/billing" className="mt-1.5 inline-block text-xs font-bold text-blue-700 hover:underline">
              שדרוג מנוי ←
            </Link>
          </div>
        </div>
      )}

      {showUploadError && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4" role="alert">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-rose-800">{uploadError}</p>
            {scanQuotaRedirect && (
              <Link href="/dashboard/billing" className="mt-1 inline-block text-xs font-bold text-blue-700 hover:underline">
                רכישת סריקות נוספות ←
              </Link>
            )}
          </div>
          <button type="button" onClick={() => setUploadErrorDismissed(true)} className="shrink-0 rounded-lg p-1.5 text-rose-400 hover:bg-rose-100 transition-colors" aria-label="סגור">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ══ BOTTOM GRID: Chart + Contacts ══ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">

        {/* Revenue chart — 3 cols */}
        <div className="lg:col-span-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">מגמת הכנסות חודשית</h2>
              <p className="text-xs text-slate-400 mt-0.5">12 החודשים האחרונים</p>
            </div>
            <Link href="/dashboard/erp" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              ERP <ChevronRight size={12} />
            </Link>
          </div>

          {monthlySeries.length > 0 ? (
            <DashboardRevenueChart data={monthlySeries} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
              <Inbox className="text-slate-300" size={32} strokeWidth={1.25} />
              <div>
                <p className="text-sm font-bold text-slate-600">אין עדיין נתוני הכנסות</p>
                <p className="mt-0.5 text-xs text-slate-400">הנפיקו חשבוניות ב-ERP</p>
              </div>
              <Link href="/dashboard/erp" className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors">
                מעבר ל-ERP
              </Link>
            </div>
          )}
        </div>

        {/* Recent contacts — 2 cols */}
        <div className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-violet-500" />
                לקוחות אחרונים
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">מה-CRM שלכם</p>
            </div>
            <Link href="/dashboard/crm" className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-1">
              כולם <ChevronRight size={12} />
            </Link>
          </div>

          {recentContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
              <Users className="text-slate-300" size={28} strokeWidth={1.25} />
              <p className="text-xs text-slate-500">אין עדיין לקוחות</p>
              <Link href="/dashboard/crm" className="text-xs font-bold text-violet-600 hover:underline">
                הוסיפו ב-CRM ←
              </Link>
            </div>
          ) : (
            <ul className="space-y-1">
              {recentContacts.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link
                    href="/dashboard/crm"
                    className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-slate-50 group"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 text-[11px] font-black text-white shadow-sm">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800 group-hover:text-slate-900">{c.name}</p>
                        <p className="truncate text-[10px] text-slate-400" dir="ltr">{c.email ?? "ללא אימייל"}</p>
                      </div>
                    </div>
                    {statusBadge(c.status, c.statusLabel)}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Quick actions */}
          <div className="mt-4 border-t border-slate-50 pt-4 grid grid-cols-2 gap-2">
            <Link href="/dashboard/crm" className="flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2.5 text-xs font-bold text-violet-700 hover:bg-violet-100 transition-colors">
              <Users size={13} /> לקוח חדש
            </Link>
            <Link href="/dashboard/erp" className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
              <FileText size={13} /> מסמך חדש
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
