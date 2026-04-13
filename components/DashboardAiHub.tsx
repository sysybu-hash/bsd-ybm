"use client";

import { useState } from "react";
import MultiEngineScanner from "@/components/MultiEngineScanner";

type DashboardAiHubProps = {
  orgId: string;
};

export default function DashboardAiHub({ orgId }: DashboardAiHubProps) {
  const [activeTab, setActiveTab] = useState<"scanner" | "chat">("scanner");

  return (
    <div className="w-full animate-fade-in space-y-8" dir="rtl">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-black italic tracking-tight text-slate-900">
            BSD-YBM <span className="text-blue-600">AI Hub</span>
          </h1>
          <p className="mt-2 max-w-2xl font-medium text-slate-500">
            מרכז הבינה המלאכותית האחוד. סרקו מסמכים, נתחו נתונים פיננסיים
            ונהלו את העסק בעזרת מנועי AI מתקדמים.
          </p>
        </div>

        <div className="flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("scanner")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "scanner"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            לוח סריקה
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "chat"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            צ&apos;אט AI
          </button>
        </div>
      </div>

      {activeTab === "scanner" ? (
        <MultiEngineScanner />
      ) : (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <p className="font-bold uppercase tracking-wider text-slate-400">
            ממשק הצ&apos;אט האחוד זמין בדשבורד הראשי ובכל דפי המערכת דרך הבועה
            הצפה. זיהוי ארגון: {orgId || "ללא ארגון"}.
          </p>
        </div>
      )}
    </div>
  );
}
