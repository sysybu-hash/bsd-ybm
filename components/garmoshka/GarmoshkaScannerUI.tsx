"use client";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { CheckCircle, FileBarChart, Layers, ScanLine, UploadCloud } from "lucide-react";

export type GarmoshkaRecentScan = {
  id: string;
  filename: string;
  pages: number;
  status: string;
  date: string;
};

export type GarmoshkaScannerUIProps = {
  isScanning: boolean;
  /** 0–100 */
  scanProgress?: number;
  recentScans: GarmoshkaRecentScan[];
  /** פתיחת בחירת קבצים (למשל click על input של MultiEngineScanner) */
  onUpload: () => void;
};

/**
 * UI ל״סורק גרמושקות״: אזור העלאה, מצב מעבד, רשימת סריקות אחרונות
 */
export function GarmoshkaScannerUI({
  isScanning,
  scanProgress = 0,
  recentScans,
  onUpload,
}: GarmoshkaScannerUIProps) {
  const progress = Math.min(100, Math.max(0, scanProgress));

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">סורק גרמושקות חכם</h1>
        <p className="mt-1 text-text-secondary">
          פענוח אוטומטי של תוכניות בנייה, כתבי כמויות ומפרטים טכניים
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard className="relative flex min-h-[300px] flex-col justify-center overflow-hidden lg:col-span-2">
          {isScanning ? (
            <div className="space-y-6 text-center">
              <div className="relative mx-auto h-24 w-24">
                <div className="absolute inset-0 animate-ping rounded-full bg-brand/20" />
                <div className="absolute inset-2 animate-pulse rounded-full bg-brand/40" />
                <ScanLine className="absolute inset-0 m-auto text-brand" size={40} aria-hidden />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">מפענח תוכנית הנדסית...</h3>
                <p className="mt-2 text-text-secondary">ה-AI מזהה מידות, חומרים וסעיפי חריגה</p>
              </div>
              <div className="mx-auto w-2/3">
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-brand transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onUpload}
              className="group cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center transition-all hover:border-brand hover:bg-brand-background/50"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-surface shadow-sm transition-transform group-hover:scale-110">
                <UploadCloud className="text-brand" size={32} aria-hidden />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-text-primary">גררו PDF (גרמושקה) לכאן</h3>
              <p className="text-sm text-text-secondary">או לחצו לבחירת קובץ (בדרך כלל עד ~50MB)</p>
            </button>
          )}
        </DashboardCard>

        <div className="space-y-6">
          <DashboardCard className="border-none bg-brand text-white shadow-lg">
            <Layers className="mb-4 opacity-80" size={32} aria-hidden />
            <h3 className="mb-2 text-xl font-bold">מנוע גיאומטרי זמין</h3>
            <p className="text-sm text-brand-light">
              המודל מותאם לזיהוי חותמות, מידות, רשימות חומרים ורמות דיוק.
            </p>
          </DashboardCard>

          <DashboardCard title="סריקות אחרונות">
            <div className="mt-2 space-y-4">
              {recentScans.length === 0 ? (
                <p className="py-4 text-center text-sm text-text-secondary">אין סריקות אחרונות</p>
              ) : (
                recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between rounded-lg border border-transparent p-3 transition-colors hover:border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="shrink-0 rounded-lg bg-blue-50 p-2 text-blue-600">
                        <FileBarChart size={18} aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[160px] truncate text-sm font-medium text-text-primary">
                          {scan.filename}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {scan.pages} עמודים · {scan.date}
                        </p>
                        <p className="text-xs text-text-secondary">סטטוס: {scan.status}</p>
                      </div>
                    </div>
                    <CheckCircle className="shrink-0 text-emerald-500" size={16} aria-hidden />
                  </div>
                ))
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
