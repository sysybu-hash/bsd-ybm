"use client";

import { useState } from "react";
import { 
  Plus, 
  Brain, 
  Search, 
  BarChart3, 
  FileText, 
  ArrowUpRight, 
  AlertCircle,
  Zap,
  Filter
} from "lucide-react";
import MultiEngineScanner from "@/components/MultiEngineScanner";
import ERPDashboard, { ErpStatCard, ErpFlowSummary } from "@/components/ERPDashboard";
import ErpDocumentsManager from "@/components/ErpDocumentsManager";
import PriceComparisonChart from "@/components/PriceComparisonChart";
import { PriceSpikeAlert } from "@/lib/erp-price-spikes";
import { useI18n } from "@/components/I18nProvider";

type ErpDocRow = {
  id: string;
  fileName: string;
  type: string;
  status: string;
  createdAt: string;
  aiData: any;
};

interface ErpClientProps {
  stats: ErpStatCard[];
  chartData: { name: string; value: number }[];
  flowSummary: ErpFlowSummary | null;
  priceSpikes: PriceSpikeAlert[];
  docs: ErpDocRow[];
  priceComparison: { data: any; productName: string } | null;
  geminiConfigured: boolean;
  scanQuotaSummary: string | null;
}

export default function ErpClient({
  stats,
  chartData,
  flowSummary,
  priceSpikes,
  docs,
  priceComparison,
  geminiConfigured,
  scanQuotaSummary
}: ErpClientProps) {
  const { t, dir } = useI18n();
  const [activeTab, setActiveTab] = useState<"overview" | "scan" | "docs">("overview");

  const TABS = [
    { id: "overview", label: t("dashboard.overview"), icon: <BarChart3 size={18} /> },
    { id: "scan", label: t("dashboard.aiHub"), icon: <Brain size={18} /> },
    { id: "docs", label: t("erp.history"), icon: <FileText size={18} /> },
  ] as const;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 pb-24 lg:pb-8" dir={dir}>
      {/* ── Mobile Navigation (Floating Bottom) ── */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:static lg:translate-x-0 lg:mb-8 lg:mt-2">
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xl border border-white p-1.5 rounded-[2rem] shadow-2xl shadow-blue-900/10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-black transition-all ${
                activeTab === tab.id 
                  ? "bg-slate-900 text-white shadow-lg" 
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {tab.icon}
              <span className={activeTab === tab.id ? "block" : "hidden md:block"}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── Header ── */}
      <header className="px-6 pt-8 pb-4 lg:px-0">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic text-start uppercase">
            BSD-YBM Automated ERP
          </h1>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
             <Zap size={20} className="fill-indigo-600" />
          </div>
        </div>
        <p className="text-sm font-bold text-slate-500 text-start">
          {t("erpDash.pageSubtitle")} — {scanQuotaSummary || t("erpDash.quotaCaption")}
        </p>
      </header>

      {/* ── Content ── */}
      <main className="px-6 lg:px-0 flex-1">
          {activeTab === "overview" && (
            <div className="space-y-8">
              <ERPDashboard 
                stats={stats} 
                chartData={chartData} 
                flowSummary={flowSummary} 
                scanQuotaSummary={scanQuotaSummary} 
                priceSpikes={priceSpikes}
              />
              
              {priceSpikes.length > 0 && (
                <section className="bg-rose-50 border border-rose-100 rounded-[2rem] p-6 text-start">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="flex items-center gap-2 text-rose-800 font-black text-sm uppercase tracking-wider">
                       <AlertCircle size={18} /> {t("erpDash.spikesTitle")}
                    </h2>
                    <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">
                      {priceSpikes.length} Alerts
                    </span>
                  </div>
                  <div className="space-y-3">
                    {priceSpikes.slice(0, 3).map((spike, idx) => (
                      <div key={idx} className="bg-white/60 p-4 rounded-2xl border border-rose-200/50 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-black text-slate-900">{spike.description || spike.normalizedKey}</p>
                            <p className="text-xs font-bold text-rose-600">+{spike.changePercent.toFixed(0)}% Increase</p>
                          </div>
                          <div className="text-end">
                            <button className="text-[10px] font-black underline text-slate-900">Analyze</button>
                          </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {priceComparison && (
                <PriceComparisonChart data={priceComparison.data} productName={priceComparison.productName} />
              )}
            </div>
          )}

          {activeTab === "scan" && (
            <div className="bg-white rounded-[2.5rem] p-1 border-0 shadow-2xl shadow-blue-900/5">
              <MultiEngineScanner />
            </div>
          )}

          {activeTab === "docs" && (
            <div>
               <ErpDocumentsManager initialDocs={docs} />
            </div>
          )}
      </main>
    </div>
  );
}
