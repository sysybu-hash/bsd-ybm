"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Upload, FileText, Users, Search, Languages, ArrowLeft, Sparkles, ScanLine } from "lucide-react";
import { useSession } from "next-auth/react";
import { processDocumentAction } from "@/app/actions/process-document";
import DashboardRevenueChart from "@/components/dashboard/DashboardRevenueChart";
import type { OrgDashboardHomeData } from "@/lib/dashboard-home-data";
import { formatCreditsForDisplay } from "@/lib/org-credits-display";

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

const quickLinkClass =
  "inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[var(--primary-color,#3b82f6)] transition-colors";

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
      return "bg-amber-100 text-amber-800";
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
  const { data: session, status } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
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

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-wrap items-center gap-4 gap-y-2 border-b border-slate-200/80 pb-4 text-sm">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">קישורים מהירים</span>
        <Link href="/dashboard/crm" className={quickLinkClass}>
          <Users size={16} /> CRM
          <ArrowLeft size={14} className="opacity-50" />
        </Link>
        <Link href="/dashboard/erp" className={quickLinkClass}>
          <FileText size={16} /> ERP
          <ArrowLeft size={14} className="opacity-50" />
        </Link>
        <Link href="/dashboard/billing" className={quickLinkClass}>
          מנוי ותשלומים
          <ArrowLeft size={14} className="opacity-50" />
        </Link>
      </div>

      <section className="card-avenue relative overflow-hidden p-6 md:p-8">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-amber-100/40 via-transparent to-slate-200/30"
          aria-hidden
        />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-800">השדרה · סריקה חכמה</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
              מרכז הסריקה הרב־מנועי
            </h2>
            <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-600">
              Gemini, OpenAI ו־Claude בממשק אחד — פענוח מסמכים ברמת פרימיום. מנוי נוכחי:{" "}
              <span className="font-bold text-slate-900">{subscriptionTier}</span>
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/dashboard/ai"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-amber-600 to-amber-800 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-amber-900/25 ring-1 ring-amber-500/40 transition hover:brightness-105"
              >
                <Sparkles size={18} className="opacity-90" />
                פתיחת מרכז AI המלא
              </Link>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white/90 px-5 py-3 text-sm font-bold text-slate-800 shadow-md transition hover:border-amber-200/80 hover:bg-white">
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                <Upload size={18} className="text-amber-600" />
                {isUploading ? "מעבד מסמך…" : "סריקה מהירה מהדף הראשי"}
              </label>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-4 lg:flex-col lg:items-stretch xl:flex-row">
            <div className="min-w-[9rem] rounded-2xl border border-amber-200/70 bg-white/90 px-5 py-4 shadow-md ring-1 ring-amber-100/80">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800/90">Flash (זול)</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-amber-900">
                {formatCreditsForDisplay(cheapScansRemaining)}
              </p>
            </div>
            <div className="min-w-[9rem] rounded-2xl border border-slate-300/70 bg-gradient-to-br from-slate-50 to-white px-5 py-4 shadow-md ring-1 ring-slate-200/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pro (פרימיום)</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-slate-800">
                {formatCreditsForDisplay(premiumScansRemaining)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <header className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="חיפוש חכם (AI)..."
            className="w-full bg-white border border-slate-200 rounded-full py-2.5 pr-10 pl-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-4 justify-end">
          <button
            type="button"
            className="flex items-center gap-2 text-sm bg-slate-100 text-slate-700 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            <Languages size={16} /> עברית
          </button>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md"
            style={{ backgroundColor: "var(--primary-color, #3b82f6)" }}
          >
            YB
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-200/40">
          <p className="text-slate-500 text-sm mb-1">הכנסות החודש (ERP)</p>
          <p className="text-xs text-slate-400 mb-2 capitalize">{monthTitle}</p>
          <h3 className="text-3xl font-bold text-slate-900 tabular-nums">{formatMoney(monthGross)}</h3>
          {changeLabel}
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-200/40">
          <p className="text-slate-500 text-sm mb-1">משפך מכירות (הצעות פתוחות)</p>
          <h3 className="text-3xl font-bold text-slate-900 tabular-nums">{formatMoney(pipelineValue)}</h3>
          <span className="text-blue-600 text-xs font-medium">{pipelineSub}</span>
        </div>
        <div className="card-avenue flex flex-col justify-between p-6">
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-black text-slate-800">
              <ScanLine size={18} className="text-amber-600" />
              סיכום מכסות
            </p>
            <p className="text-xs font-medium text-slate-500">
              זול / פרימיום — לרכישת בנדלים ושדרוג בבילינג.
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:border-amber-200 hover:bg-amber-50/80"
          >
            מנויים ותשלומים
            <ArrowLeft size={14} />
          </Link>
        </div>
      </div>

      {scanUsageNotice ? (
        <div
          className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <p className="font-bold text-amber-900 mb-1">יתרת סריקות</p>
          <p>{scanUsageNotice}</p>
          <Link href="/dashboard/billing" className="mt-2 inline-block text-sm font-bold text-amber-800 underline">
            דף חיוב ורכישת בנדלים
          </Link>
        </div>
      ) : null}

      {monthlySeries.length > 0 ? (
        <DashboardRevenueChart data={monthlySeries} />
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-[var(--primary-color,#3b82f6)]" />
              לקוחות אחרונים (CRM)
            </h4>
            <Link
              href="/dashboard/crm"
              className="text-sm font-bold text-blue-700 hover:text-blue-800 underline underline-offset-2"
            >
              כל הלקוחות
            </Link>
          </div>
          {recentContacts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center text-slate-500">
              <p className="font-medium text-slate-700 mb-2">אין עדיין לקוחות בארגון</p>
              <p className="text-sm mb-4">הוסיפו לקוחות ב־CRM כדי לראות אותם כאן.</p>
              <Link
                href="/dashboard/crm"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
              >
                מעבר ל־CRM
                <ArrowLeft size={16} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentContacts.map((c) => (
                <Link
                  key={c.id}
                  href="/dashboard/crm"
                  className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                      <p className="text-xs text-slate-500 truncate" dir="ltr">
                        {c.email ?? "ללא אימייל"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-lg font-medium shrink-0 ${contactStatusClass(c.status)}`}
                  >
                    {c.statusLabel}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
            <FileText size={18} className="text-[var(--primary-color,#3b82f6)]" /> תוצאות פענוח מסמך
          </h4>
          {uploadError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 space-y-2">
              <p>{uploadError}</p>
              {scanQuotaRedirect ? (
                <Link
                  href="/dashboard/billing"
                  className="inline-flex font-bold text-blue-700 underline underline-offset-2"
                >
                  מעבר לדף חיוב ורכישת בנדל
                </Link>
              ) : null}
            </div>
          )}
          {scanResult ? (
            <div className="space-y-3 text-slate-800">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">ספק:</span>
                <span className="font-bold">{scanResult.vendor ?? "-"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">סכום כולל:</span>
                <span className="font-bold text-emerald-600">
                  ₪{scanResult.totalAmount ?? "-"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">סוג מסמך:</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-lg italic font-medium">
                  {scanResult.docType ?? "-"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-4 leading-relaxed italic">
                {scanResult.summary ?? "לא התקבל סיכום מהמודל."}
              </p>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-slate-400 italic">
              טרם נסרק מסמך. השתמשו בכרטיס „השדרה” למעלה להעלאה מהירה.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
