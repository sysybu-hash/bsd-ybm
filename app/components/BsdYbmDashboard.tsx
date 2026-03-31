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
    <div className="space-y-8" dir={dir}>
      <div>
        <h1 className="text-2xl font-black italic text-slate-900 flex items-center gap-2">
          <LayoutDashboard className="text-blue-600 shrink-0" size={26} aria-hidden />
          לוח בקרה
        </h1>
        <p className="text-sm text-slate-500 mt-1">סיכום הכנסות, משפך מכירות, סריקות ולקוחות אחרונים</p>
      </div>

      <div className="card-avenue p-4 md:p-5">
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3">קישורים מהירים</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/crm"
            className="btn-secondary text-xs py-2 px-4"
          >
            <Users size={16} aria-hidden />
            CRM
            <ArrowLeft size={14} className="opacity-60" aria-hidden />
          </Link>
          <Link href="/dashboard/erp" className="btn-secondary text-xs py-2 px-4">
            <FileText size={16} aria-hidden />
            ERP
            <ArrowLeft size={14} className="opacity-60" aria-hidden />
          </Link>
          <Link href="/dashboard/billing" className="btn-secondary text-xs py-2 px-4">
            מנוי ותשלומים
            <ArrowLeft size={14} className="opacity-60" aria-hidden />
          </Link>
          <Link href="/dashboard/ai" className="btn-primary text-xs py-2 px-4">
            <Sparkles size={16} aria-hidden />
            מרכז AI
          </Link>
        </div>
      </div>

      <section className="card-avenue crystal-hover relative overflow-hidden p-6 md:p-8">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-blue-50/90 via-white/80 to-slate-50/60"
          aria-hidden
        />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">השדרה · סריקה חכמה</p>
            <h2 className="mt-2 text-xl md:text-2xl font-black tracking-tight text-slate-900">
              מרכז הסריקה הרב־מנועי
            </h2>
            <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-600">
              Gemini, OpenAI ו־Claude בממשק אחד — פענוח מסמכים ברמת פרימיום. מנוי נוכחי:{" "}
              <span className="font-bold text-slate-900">{subscriptionTier}</span>
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href="/dashboard/ai" className="btn-primary rounded-2xl px-6 py-3.5 text-sm shadow-lg shadow-blue-600/20">
                <Sparkles size={18} className="opacity-90" aria-hidden />
                פתיחת מרכז AI המלא
              </Link>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40">
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                <Upload size={18} className="text-blue-600" aria-hidden />
                {isUploading ? "מעבד מסמך…" : "סריקה מהירה מהדף הראשי"}
              </label>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-4 lg:flex-col lg:items-stretch xl:flex-row">
            <div className="min-w-[9rem] rounded-2xl border border-blue-200 bg-blue-50/80 px-5 py-4 shadow-sm ring-1 ring-blue-100/80">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Flash (זול)</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-blue-800">
                {formatCreditsForDisplay(cheapScansRemaining)}
              </p>
            </div>
            <div className="min-w-[9rem] rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm ring-1 ring-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pro (פרימיום)</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-slate-800">
                {formatCreditsForDisplay(premiumScansRemaining)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 text-slate-400 -translate-y-1/2 end-3"
            size={18}
            aria-hidden
          />
          <input
            type="search"
            placeholder="חיפוש חכם (AI)..."
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 ps-4 pe-10 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          />
        </div>
        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            className="btn-ghost border border-slate-200 bg-slate-50/80 py-2 text-xs"
          >
            <Languages size={16} aria-hidden />
            עברית
          </button>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white shadow-md ring-2 ring-blue-100"
            style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
            aria-hidden
          >
            {userInitials}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/90 to-white p-6 shadow-sm ring-1 ring-blue-100/60">
          <p className="text-sm font-bold text-slate-500">הכנסות החודש (ERP)</p>
          <p className="mt-0.5 text-xs text-slate-400 capitalize">{monthTitle}</p>
          <h3 className="mt-2 text-3xl font-black tabular-nums text-slate-900">{formatMoney(monthGross)}</h3>
          <div className="mt-2">{changeLabel}</div>
        </div>
        <div className="card-avenue p-6">
          <p className="text-sm font-bold text-slate-500">משפך מכירות (הצעות פתוחות)</p>
          <h3 className="mt-2 text-3xl font-black tabular-nums text-slate-900">{formatMoney(pipelineValue)}</h3>
          <p className="mt-2 text-xs font-medium text-blue-700">{pipelineSub}</p>
        </div>
        <div className="card-avenue flex flex-col justify-between p-6">
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-black text-slate-800">
              <ScanLine size={18} className="text-blue-600" aria-hidden />
              סיכום מכסות
            </p>
            <p className="text-xs font-medium text-slate-500">זול / פרימיום — לרכישת בנדלים ושדרוג בבילינג.</p>
          </div>
          <Link href="/dashboard/billing" className="btn-secondary mt-4 justify-center text-sm">
            מנויים ותשלומים
            <ArrowLeft size={14} aria-hidden />
          </Link>
        </div>
      </div>

      {scanUsageNotice ? (
        <div
          className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
          role="status"
        >
          <p className="mb-1 font-bold text-blue-800">יתרת סריקות</p>
          <p>{scanUsageNotice}</p>
          <Link href="/dashboard/billing" className="mt-2 inline-block text-sm font-bold text-blue-700 underline">
            דף חיוב ורכישת בנדלים
          </Link>
        </div>
      ) : null}

      {showUploadError ? (
        <div
          className="flex flex-wrap items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <p className="font-bold text-rose-900">{uploadError}</p>
            {scanQuotaRedirect ? (
              <Link href="/dashboard/billing" className="inline-flex font-bold text-blue-700 underline underline-offset-2">
                מעבר לדף חיוב ורכישת בנדל
              </Link>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setUploadErrorDismissed(true)}
            className="shrink-0 rounded-lg p-1.5 text-rose-600 transition hover:bg-rose-100"
            aria-label="סגור הודעת שגיאה"
          >
            <X size={18} />
          </button>
        </div>
      ) : null}

      {monthlySeries.length > 0 ? (
        <DashboardRevenueChart data={monthlySeries} />
      ) : (
        <div className="card-avenue flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
          <Inbox className="text-slate-300" size={40} strokeWidth={1.25} aria-hidden />
          <div>
            <p className="font-bold text-slate-700">אין עדיין סדרת הכנסות להצגה</p>
            <p className="mt-1 text-sm text-slate-500">הנפיקו חשבוניות ב־ERP כדי לראות גרף מגמה כאן.</p>
          </div>
          <Link href="/dashboard/erp" className="btn-primary text-sm">
            מעבר ל־ERP
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="card-avenue p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black italic text-slate-900 flex items-center gap-2">
                <Users size={20} className="text-blue-600" aria-hidden />
                לקוחות אחרונים (CRM)
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">עדכון אחרון מהארגון שלכם</p>
            </div>
            <Link href="/dashboard/crm" className="btn-secondary py-2 text-xs">
              כל הלקוחות
            </Link>
          </div>
          {recentContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
              <Users className="text-slate-300" size={36} strokeWidth={1.25} aria-hidden />
              <div>
                <p className="font-bold text-slate-800">אין עדיין לקוחות בארגון</p>
                <p className="mt-1 text-sm text-slate-500">הוסיפו לקוחות ב־CRM כדי לראות אותם כאן.</p>
              </div>
              <Link href="/dashboard/crm" className="btn-primary text-sm">
                מעבר ל־CRM
                <ArrowLeft size={16} aria-hidden />
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentContacts.map((c) => (
                <li key={c.id}>
                  <Link
                    href="/dashboard/crm"
                    className="flex items-center justify-between gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-slate-100 hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-blue-100 to-slate-200 ring-1 ring-slate-200/80"
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{c.name}</p>
                        <p className="truncate text-xs text-slate-500" dir="ltr">
                          {c.email ?? "ללא אימייל"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${contactStatusClass(c.status)}`}
                    >
                      {c.statusLabel}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-avenue p-6">
          <div className="mb-4">
            <h2 className="text-xl font-black italic text-slate-900 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" aria-hidden />
              תוצאות פענוח מסמך
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">לאחר סריקה מהירה מהכרטיס למעלה</p>
          </div>
          {scanResult ? (
            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-slate-800">
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">ספק:</span>
                <span className="font-bold">{scanResult.vendor ?? "-"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">סכום כולל:</span>
                <span className="font-bold text-emerald-600">₪{scanResult.totalAmount ?? "-"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">סוג מסמך:</span>
                <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-xs font-bold italic text-blue-800">
                  {scanResult.docType ?? "-"}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 italic">
                {scanResult.summary ?? "לא התקבל סיכום מהמודל."}
              </p>
            </div>
          ) : (
            <div className="flex min-h-[11rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
              <ScanLine className="text-slate-300" size={32} strokeWidth={1.25} aria-hidden />
              <p className="text-sm font-medium text-slate-500">טרם נסרק מסמך מהדף הראשי</p>
              <p className="text-xs text-slate-400">השתמשו בכרטיס „השדרה” למעלה להעלאה מהירה או במרכז AI המלא</p>
              <Link href="/dashboard/ai" className="btn-secondary mt-1 text-xs py-2">
                פתיחת מרכז AI
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
