"use client";

import { useState } from "react";
import MultiEngineScanner from "@/components/MultiEngineScanner";

type Project = { id: string; name: string };
type Contact = { id: string; name: string };

type DashboardAiHubProps = {
  orgId: string;
};

export default function DashboardAiHub({ orgId }: DashboardAiHubProps) {
  const [activeTab, setActiveTab] = useState<"scanner" | "chat">("scanner");

  return (
    <div className="w-full space-y-8 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tight text-slate-900">
            BSD-YBM <span className="text-blue-600">AI Hub</span>
          </h1>
          <p className="mt-2 text-slate-500 font-medium max-w-2xl">
            מרכז הבינה המלאכותית האחוד. סרקו מסמכים, נתחו נתונים פיננסיים ונהלו את העסק בעזרת מנועי ה-AI המתקדמים בעולם.
          </p>
        </div>
        
        <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab("scanner")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "scanner" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            לוח סריקה
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "chat" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            צ'אט AI
          </button>
        </div>
      </div>

      {activeTab === "scanner" ? (
        <MultiEngineScanner orgId={orgId} />
      ) : (
        <div className="p-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 text-center">
          <p className="text-slate-400 font-bold uppercase tracking-wider">ממשק הצ'אט האחוד זמין בדשבורד הראשי ובכל דפי המערכת דרך הבועה הצפה</p>
        </div>
      )}
    </div>
  );
}
