"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Upload, FileText, Users, Search, Languages, ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { processDocumentAction } from "@/app/actions/process-document";

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
  };
  error?: string;
};

const quickLinkClass =
  "inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[var(--primary-color,#3b82f6)] transition-colors";

export default function BsdYbmDashboard() {
  const { data: session, status } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

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
        setUploadError(result.error ?? "אירעה שגיאה בפענוח המסמך.");
        return;
      }

      setScanResult(result.data?.aiData ?? null);
    } catch {
      setScanResult(null);
      setUploadError("אירעה תקלה בזמן העלאת הקובץ. נסה שוב.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-wrap items-center gap-4 gap-y-2 text-sm border-b border-slate-200 pb-4">
        <span className="text-slate-400 font-bold uppercase tracking-wide text-xs">קישורים מהירים</span>
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
          <p className="text-slate-500 text-sm mb-1">הכנסות חודש מרץ (ERP)</p>
          <h3 className="text-3xl font-bold text-slate-900">₪42,500</h3>
          <span className="text-emerald-600 text-xs font-medium">↑ 12% מהחודש הקודם</span>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-200/40">
          <p className="text-slate-500 text-sm mb-1">הזדמנויות מכירה (CRM)</p>
          <h3 className="text-3xl font-bold text-slate-900">₪158,000</h3>
          <span className="text-blue-600 text-xs font-medium">4 עסקאות בשלב סגירה</span>
        </div>
        <div className="bg-white border border-dashed border-blue-300 p-6 rounded-2xl shadow-sm bg-blue-50/40">
          <p className="text-[var(--primary-color,#2563eb)] text-sm mb-1 font-bold italic">AI Scanner</p>
          <label className="cursor-pointer">
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            <div className="flex items-center gap-2 text-slate-700">
              <Upload size={20} className="text-[var(--primary-color,#3b82f6)]" />
              <span>{isUploading ? "מעבד מסמך..." : "בחר חשבונית לסריקה"}</span>
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h4 className="text-lg font-bold mb-4 text-slate-900 flex items-center gap-2">
            <Users size={18} className="text-[var(--primary-color,#3b82f6)]" />
            לקוחות אחרונים (CRM)
          </h4>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">לקוח לדוגמה {i}</p>
                    <p className="text-xs text-slate-500">חברה בע&quot;מ</p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-medium">
                  פעיל
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
            <FileText size={18} className="text-[var(--primary-color,#3b82f6)]" /> תוצאות פענוח מסמך
          </h4>
          {uploadError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {uploadError}
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
            <div className="h-40 flex items-center justify-center text-slate-400 italic border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              טרם נסרק מסמך. העלה קובץ למעלה.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
