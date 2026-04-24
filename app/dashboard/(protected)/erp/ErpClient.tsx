"use client";

import { useEffect, useState } from "react";
import {
  Brain, 
  BarChart3, 
  FileText, 
  AlertCircle,
  Zap,
  BookOpen,
} from "lucide-react";
import MultiEngineScanner from "@/components/MultiEngineScanner";
import { GarmoshkaScannerUI } from "@/components/garmoshka/GarmoshkaScannerUI";
import ErpProjectNotebook from "@/components/erp/ErpProjectNotebook";
import ERPDashboard, { ErpStatCard, ErpFlowSummary } from "@/components/ERPDashboard";
import ErpDocumentsManager from "@/components/ErpDocumentsManager";
import PriceComparisonChart from "@/components/PriceComparisonChart";
import PriceAlertResolveModal, {
  type PendingPriceAlertLine,
} from "@/components/erp/PriceAlertResolveModal";
import { PriceSpikeAlert } from "@/lib/erp-price-spikes";
import type { PriceChartRow } from "@/lib/erp-price-comparison-data";
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
  /** שורות DocumentLineItem עם priceAlertPending — חומר ללא מחיר מהסריקה */
  pendingPriceAlertCount: number;
  pendingPriceAlertLines: PendingPriceAlertLine[];
  docs: ErpDocRow[];
  priceComparison: { data: PriceChartRow[]; productName: string } | null;
  geminiConfigured: boolean;
  scanQuotaSummary: string | null;
}

export default function ErpClient({
  stats,
  chartData,
  flowSummary,
  priceSpikes,
  pendingPriceAlertCount,
  pendingPriceAlertLines,
  docs,
  priceComparison,
  geminiConfigured,
  scanQuotaSummary,
}: ErpClientProps) {
  const { t, dir } = useI18n();
  const [activeTab, setActiveTab] = useState<"overview" | "scan" | "notebook" | "docs">("overview");
  const [priceAlertModalOpen, setPriceAlertModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "scan" || tab === "notebook" || tab === "docs" || tab === "overview") {
      setActiveTab(tab);
    }
  }, []);

  const TABS = [
    { id: "overview", label: t("dashboard.overview"), icon: <BarChart3 size={18} /> },
    { id: "scan", label: t("dashboard.aiHub"), icon: <Brain size={18} /> },
    { id: "notebook", label: t("erpDash.notebook.tabLabel"), icon: <BookOpen size={18} /> },
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
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 shadow-sm">
             <Zap size={20} className="fill-teal-600" />
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

              {pendingPriceAlertCount > 0 && (
                <button
                  type="button"
                  onClick={() => setPriceAlertModalOpen(true)}
                  className="group w-full rounded-[2rem] border border-amber-200 bg-amber-50/90 p-6 text-start shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                  aria-live="polite"
                  aria-haspopup="dialog"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-amber-900">
                      <AlertCircle size={18} className="shrink-0" aria-hidden />
                      {t("erpDash.priceAlertTitle")}
                    </h2>
                    <span className="rounded-lg bg-amber-600 px-2.5 py-1 text-[10px] font-black text-white shadow-sm group-hover:bg-amber-700">
                      {pendingPriceAlertCount}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-amber-950/90">
                    {t("erpDash.priceAlertBody", { count: String(pendingPriceAlertCount) })}
                  </p>
                  <p className="mt-2 text-xs font-bold text-amber-800/90 underline decoration-amber-400 decoration-2 underline-offset-2">
                    {t("erpDash.priceAlertBannerCta")}
                  </p>
                </button>
              )}

              <PriceAlertResolveModal
                open={priceAlertModalOpen}
                onDismiss={() => setPriceAlertModalOpen(false)}
                lines={pendingPriceAlertLines}
                totalPendingCount={pendingPriceAlertCount}
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
            <div className="space-y-6">
              <GarmoshkaScannerUI
                isScanning={false}
                recentScans={[]}
                onUpload={() => {
                  const el = document.querySelector<HTMLInputElement>("#erp-multi-scanner input[type=file]");
                  el?.click();
                }}
              />
              <div className="rounded-[2.5rem] border-0 bg-white p-1 shadow-2xl shadow-blue-900/5">
                <MultiEngineScanner />
              </div>
            </div>
          )}

          {activeTab === "notebook" && (
            <ErpProjectNotebook geminiConfigured={geminiConfigured} />
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
