"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  Users,
  Search,
  Languages,
  ArrowLeft,
  Sparkles,
  ScanLine,
  LayoutDashboard,
  X,
  Inbox,
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

function contactStatusClass(status: string) {
  switch (status) {
    case "CLOSED_WON":
      return "bg-emerald-100 text-emerald-800";
    case "CLOSED_LOST":
      return "bg-slate-200 text-slate-700";
    case "PROPOSAL":
      return "bg-blue-100 text-blue-700";
    case "ACTIVE":
      return "bg-sky-100 text-sky-800";
    default:
      return "bg-violet-100 text-violet-800";
  }
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

  const userInitials =
    session?.user?.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") ||
    session?.user?.email?.charAt(0)?.toUpperCase() ||
    "?";

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
        formData,
        session.user.id,
        session.user.organizationId,
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
        if (w.includes("cheap_80")) {
          parts.push("ניצלתם כ־80% ממכסת הסריקות הזולות — שקלו בנדל או שדרוג בדף החיוב.");
        }
        if (w.includes("premium_80")) {
          parts.push("ניצלתם כ־80% ממכסת הסריקות הפרימיום — שקלו בנדל או שדרוג.");
        }
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

  const changeLabel =
    monthChangePct !== null ? (
      <span
        className={`text-xs font-medium ${monthChangePct >= 0 ? "text-emerald-600" : "text-rose-600"}`}
      >
        {monthChangePct >= 0 ? "↑" : "↓"} {Math.abs(monthChangePct).toFixed(1)}% מהחודש הקודם
      </span>
    ) : monthGross > 0 ? (
      <span className="text-xs font-medium text-slate-500">אין נתוני השוואה לחודש קודם</span>
    ) : (
      <span className="text-xs font-medium text-slate-500">הנפיקו מסמכים ב־ERP כדי לראות מגמה</span>
    );

  const pipelineSub =
    pipelineDealCount > 0
      ? `${pipelineDealCount} הצעות מחיר ממתינות לחתימה`
      : "אין הצעות ממתינות — צרו הצעה מ־CRM";

  const showUploadError = uploadError && !uploadErrorDismissed;

  return (
    <div className=”space-y-6” dir={dir}>

      {/* ── Page header ── */}
      <div className=”flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between”>
        <div>
          <h1 className=”text-2xl font-black tracking-tight text-slate-900”>לוח בקרה</h1>
          <p className=”mt-0.5 text-sm text-slate-500”>סיכום הכנסות, משפך מכירות וסריקות</p>
        </div>
        <div
          className=”flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-full text-sm font-black text-white shadow-md ring-2 ring-white sm:self-auto”
          style={{ backgroundColor: “var(--primary-color, #2563eb)” }}
          aria-hidden
        >
          {userInitials}
        </div>
      </div>

      {/* ── Quick nav ── */}
      <div className=”flex flex-wrap gap-2”>
        {[
          { href: “/dashboard/crm”, label: “CRM”, icon: <Users size={14} /> },
          { href: “/dashboard/erp”, label: “ERP”, icon: <FileText size={14} /> },
          { href: “/dashboard/billing”, label: “מנוי ותשלומים”, icon: null },
          { href: “/dashboard/ai”, label: “מרכז AI”, icon: <Sparkles size={14} />, primary: true },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              item.primary
                ? “text-white shadow-sm hover:opacity-90”
                : “border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700”
            }`}
            style={item.primary ? { backgroundColor: “var(--primary-color, #2563eb)” } : {}}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>

      {/* ── KPI cards ── */}
      <div className=”grid grid-cols-1 gap-4 sm:grid-cols-3”>
        {/* Revenue */}
        <div className=”relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg shadow-blue-600/20”>
          <div className=”pointer-events-none absolute inset-0 opacity-10” style={{ backgroundImage: “radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)” }} aria-hidden />
          <p className=”text-xs font-bold uppercase tracking-wider text-blue-100”>הכנסות החודש</p>
          <p className=”text-[10px] text-blue-200/80 capitalize mt-0.5”>{monthTitle}</p>
          <p className=”mt-3 text-3xl font-black tabular-nums”>{formatMoney(monthGross)}</p>
          <div className=”mt-2”>
            {monthChangePct !== null ? (
              <span className={`text-xs font-semibold ${monthChangePct >= 0 ? “text-emerald-300” : “text-rose-300”}`}>
                {monthChangePct >= 0 ? “↑” : “↓”} {Math.abs(monthChangePct).toFixed(1)}% מהחודש הקודם
              </span>
            ) : (
              <span className=”text-xs text-blue-200/70”>הנפיקו מסמכים ב-ERP לצפייה במגמה</span>
            )}
          </div>
        </div>

        {/* Pipeline */}
        <div className=”rounded-2xl border border-slate-100 bg-white p-6 shadow-sm”>
          <p className=”text-xs font-bold uppercase tracking-wider text-slate-400”>משפך מכירות</p>
          <p className=”mt-3 text-3xl font-black tabular-nums text-slate-900”>{formatMoney(pipelineValue)}</p>
          <p className=”mt-2 text-xs font-medium text-blue-600”>{pipelineSub}</p>
        </div>

        {/* Scans quota */}
        <div className=”rounded-2xl border border-slate-100 bg-white p-6 shadow-sm”>
          <p className=”text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5”>
            <ScanLine size={13} aria-hidden />
            מכסות סריקה
          </p>
          <div className=”mt-3 flex gap-4”>
            <div>
              <p className=”text-[10px] font-bold text-blue-600 uppercase”>Flash</p>
              <p className=”text-2xl font-black tabular-nums text-slate-900”>{formatCreditsForDisplay(cheapScansRemaining)}</p>
            </div>
            <div className=”w-px bg-slate-100” />
            <div>
              <p className=”text-[10px] font-bold text-violet-600 uppercase”>Pro</p>
              <p className=”text-2xl font-black tabular-nums text-slate-900”>{formatCreditsForDisplay(premiumScansRemaining)}</p>
            </div>
          </div>
          <Link href=”/dashboard/billing” className=”mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline”>
            שדרוג מנוי
            <ArrowLeft size={12} aria-hidden />
          </Link>
        </div>
      </div>

      {/* ── AI Scan section ── */}
      <section className=”relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8”>
        <div className=”pointer-events-none absolute inset-0 opacity-40” style={{ background: “radial-gradient(ellipse 60% 80% at 100% 0%, rgba(37,99,235,0.06) 0%, transparent 60%)” }} aria-hidden />
        <div className=”relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between”>
          <div className=”min-w-0 flex-1”>
            <span className=”inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700”>
              <Sparkles size={10} aria-hidden />
              סריקה חכמה · {subscriptionTier}
            </span>
            <h2 className=”mt-3 text-xl font-black tracking-tight text-slate-900”>
              מרכז הסריקה הרב-מנועי
            </h2>
            <p className=”mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500”>
              Gemini, OpenAI ו-Claude בממשק אחד — פענוח מסמכים ברמת פרימיום
            </p>
            <div className=”mt-5 flex flex-wrap gap-3”>
              <Link
                href=”/dashboard/ai”
                className=”inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90”
                style={{ backgroundColor: “var(--primary-color, #2563eb)” }}
              >
                <Sparkles size={15} aria-hidden />
                פתיחת מרכז AI
              </Link>
              <label className=”inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50”>
                <input type=”file” className=”hidden” onChange={handleFileUpload} disabled={isUploading} />
                <Upload size={15} className=”text-blue-600” aria-hidden />
                {isUploading ? “מעבד…” : “סריקה מהירה”}
              </label>
            </div>
          </div>

          {/* Scan result preview */}
          <div className=”w-full lg:max-w-xs”>
            {scanResult ? (
              <div className=”rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-800”>
                <p className=”mb-3 text-xs font-black uppercase tracking-wider text-slate-400”>תוצאת פענוח</p>
                <div className=”space-y-2”>
                  <div className=”flex justify-between”><span className=”text-slate-500”>ספק</span><span className=”font-bold”>{scanResult.vendor ?? “-”}</span></div>
                  <div className=”flex justify-between”><span className=”text-slate-500”>סכום</span><span className=”font-bold text-emerald-600”>₪{scanResult.totalAmount ?? “-”}</span></div>
                  <div className=”flex justify-between”><span className=”text-slate-500”>סוג</span><span className=”rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800”>{scanResult.docType ?? “-”}</span></div>
                </div>
                {scanResult.summary ? (
                  <p className=”mt-3 text-xs italic text-slate-500 leading-relaxed”>{scanResult.summary}</p>
                ) : null}
              </div>
            ) : (
              <div className=”flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center”>
                <ScanLine className=”text-slate-300” size={28} strokeWidth={1.25} aria-hidden />
                <p className=”text-xs text-slate-500”>העלו מסמך לסריקה מהירה</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Alerts ── */}
      {scanUsageNotice ? (
        <div className=”rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900” role=”status”>
          <p className=”font-bold”>⚠️ יתרת סריקות נמוכה</p>
          <p className=”mt-1 text-xs”>{scanUsageNotice}</p>
          <Link href=”/dashboard/billing” className=”mt-1.5 inline-block text-xs font-bold text-blue-700 hover:underline”>
            שדרג בדף החיוב ←
          </Link>
        </div>
      ) : null}

      {showUploadError ? (
        <div className=”flex flex-wrap items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800” role=”alert”>
          <div className=”min-w-0 flex-1 space-y-1”>
            <p className=”font-bold”>{uploadError}</p>
            {scanQuotaRedirect ? (
              <Link href=”/dashboard/billing” className=”text-xs font-bold text-blue-700 hover:underline”>
                מעבר לדף חיוב ורכישת בנדל ←
              </Link>
            ) : null}
          </div>
          <button type=”button” onClick={() => setUploadErrorDismissed(true)} className=”shrink-0 rounded-lg p-1.5 text-rose-600 hover:bg-rose-100” aria-label=”סגור”>
            <X size={16} />
          </button>
        </div>
      ) : null}

      {/* ── Revenue chart ── */}
      {monthlySeries.length > 0 ? (
        <div className=”rounded-2xl border border-slate-100 bg-white p-6 shadow-sm”>
          <p className=”mb-4 text-sm font-black text-slate-900”>מגמת הכנסות חודשית</p>
          <DashboardRevenueChart data={monthlySeries} />
        </div>
      ) : (
        <div className=”flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center”>
          <Inbox className=”text-slate-300” size={36} strokeWidth={1.25} aria-hidden />
          <div>
            <p className=”font-bold text-slate-700”>אין עדיין נתוני הכנסות</p>
            <p className=”mt-1 text-sm text-slate-500”>הנפיקו חשבוניות ב-ERP כדי לראות גרף מגמה.</p>
          </div>
          <Link href=”/dashboard/erp” className=”mt-1 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90” style={{ backgroundColor: “var(--primary-color, #2563eb)” }}>
            מעבר ל-ERP
          </Link>
        </div>
      )}

      {/* ── Recent contacts ── */}
      <div className=”rounded-2xl border border-slate-100 bg-white p-6 shadow-sm”>
        <div className=”mb-5 flex items-center justify-between”>
          <div>
            <h2 className=”text-base font-black text-slate-900 flex items-center gap-2”>
              <Users size={18} className=”text-blue-600” aria-hidden />
              לקוחות אחרונים
            </h2>
            <p className=”mt-0.5 text-xs text-slate-500”>עדכון אחרון מה-CRM שלכם</p>
          </div>
          <Link href=”/dashboard/crm” className=”text-xs font-bold text-blue-600 hover:underline”>
            כל הלקוחות ←
          </Link>
        </div>

        {recentContacts.length === 0 ? (
          <div className=”flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center”>
            <Users className=”text-slate-300” size={30} strokeWidth={1.25} aria-hidden />
            <p className=”text-sm text-slate-500”>אין עדיין לקוחות — הוסיפו ב-CRM</p>
            <Link href=”/dashboard/crm” className=”inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline”>
              מעבר ל-CRM ←
            </Link>
          </div>
        ) : (
          <ul className=”divide-y divide-slate-50”>
            {recentContacts.map((c) => (
              <li key={c.id}>
                <Link
                  href=”/dashboard/crm”
                  className=”flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-slate-50”
                >
                  <div className=”flex min-w-0 items-center gap-3”>
                    <div
                      className=”flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white shadow-sm”
                      style={{ backgroundColor: “var(--primary-color, #2563eb)” }}
                      aria-hidden
                    >
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className=”min-w-0”>
                      <p className=”truncate text-sm font-bold text-slate-900”>{c.name}</p>
                      <p className=”truncate text-xs text-slate-500” dir=”ltr”>{c.email ?? “ללא אימייל”}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${contactStatusClass(c.status)}`}>
                    {c.statusLabel}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
