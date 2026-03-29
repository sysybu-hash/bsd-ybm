"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MapPin,
  Users,
  CheckCircle,
  Clock,
  FileText,
  Search,
  XCircle,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

export type MeckanoEmployee = {
  id: string | number;
  firstName?: string;
  lastName?: string;
  lastCheckState?: number;
  activeState?: number;
  department?: { name?: string } | null;
  lastLatitude?: number;
  lastLongitude?: number;
};

function pinPosition(
  emp: MeckanoEmployee,
): { topPct: number; leftPct: number } {
  if (
    typeof emp.lastLatitude === "number" &&
    typeof emp.lastLongitude === "number" &&
    Number.isFinite(emp.lastLatitude) &&
    Number.isFinite(emp.lastLongitude)
  ) {
    const minLat = 29.4;
    const maxLat = 33.35;
    const minLng = 34.2;
    const maxLng = 35.9;
    const lat = Math.max(minLat, Math.min(maxLat, emp.lastLatitude));
    const lng = Math.max(minLng, Math.min(maxLng, emp.lastLongitude));
    const topPct = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
    const leftPct = ((lng - minLng) / (maxLng - minLng)) * 100;
    return { topPct, leftPct };
  }
  const id = String(emp.id);
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return {
    topPct: 28 + (h % 42),
    leftPct: 22 + ((h >> 6) % 48),
  };
}

export default function MeckanoDashboard() {
  const { t } = useI18n();
  const [employees, setEmployees] = useState<MeckanoEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(() => new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [reportMonth, setReportMonth] = useState("");
  const [reportProject, setReportProject] = useState("");
  const [activeOnlyRoster, setActiveOnlyRoster] = useState(false);

  const fetchMeckanoData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meckano/users");
      const data = await res.json();
      if (!res.ok) {
        setFetchError(typeof data.error === "string" ? data.error : "שגיאת שרת");
        setEmployees([]);
        return;
      }
      setFetchError(null);
      if (Array.isArray(data)) {
        setEmployees(data as MeckanoEmployee[]);
        setLastUpdate(new Date());
      } else {
        setEmployees([]);
      }
    } catch {
      setFetchError("שגיאת רשת");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMeckanoData();
    const interval = setInterval(() => void fetchMeckanoData(), 60_000);
    return () => clearInterval(interval);
  }, [fetchMeckanoData]);

  const isAtWork = (e: MeckanoEmployee) =>
    e.lastCheckState === 1 || e.activeState === 1;

  const activeEmployees = useMemo(
    () => employees.filter(isAtWork),
    [employees],
  );

  const rosterList = useMemo(() => {
    let list = employees;
    if (activeOnlyRoster) list = list.filter(isAtWork);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((e) => {
      const name = `${e.firstName ?? ""} ${e.lastName ?? ""}`.toLowerCase();
      return name.includes(q);
    });
  }, [employees, activeOnlyRoster, searchQuery]);

  const mapEmployees = useMemo(
    () => employees.filter(isAtWork).slice(0, 12),
    [employees],
  );

  const mapEmbedUrl =
    "https://www.openstreetmap.org/export/embed.html?bbox=34.74%2C31.95%2C35.35%2C32.28&layer=mapnik";

  return (
    <div className="min-h-0 bg-[#f8fafc] p-4 sm:p-8 md:p-12 font-sans text-slate-900">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-blue-600 mb-2">
            {t("meckanoDash.title")}{" "}
            <span className="text-sm font-normal text-slate-500 not-italic">
              {t("meckanoDash.poweredBy")}
            </span>
          </h1>
          <p className="text-slate-500 font-medium flex flex-wrap items-center gap-2">
            {t("meckanoDash.liveConnected")}
            <span
              className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
              aria-hidden
            />
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchMeckanoData()}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-70"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} aria-hidden />
          {loading ? t("meckanoDash.refreshingData") : t("meckanoDash.refreshNow")}
        </button>
      </header>

      {fetchError ? (
        <div
          className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="alert"
        >
          {fetchError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col min-h-[520px] lg:h-[650px]">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Users className="text-blue-500" aria-hidden />{" "}
                {t("meckanoDash.rosterTitle")}
              </h3>
              <div className="bg-blue-50 text-blue-600 font-black px-3 py-1 rounded-full text-sm">
                {activeEmployees.length} {t("meckanoDash.atWorkCount")}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={activeOnlyRoster}
                onChange={(e) => setActiveOnlyRoster(e.target.checked)}
                className="rounded"
              />
              {t("meckanoDash.filterActiveOnly")}
            </label>

            <div className="relative mb-4">
              <input
                type="search"
                placeholder={t("meckanoDash.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <Search
                className="absolute right-3 top-3.5 text-slate-400 pointer-events-none"
                size={18}
                aria-hidden
              />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-3 [scrollbar-width:thin]">
              {loading && employees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-4">
                  <Clock className="animate-spin text-blue-500" size={32} aria-hidden />
                  <p className="font-medium">{t("meckanoDash.loadingFromMeckano")}</p>
                </div>
              ) : rosterList.length === 0 ? (
                <p className="text-sm text-slate-500 italic py-6 text-center">
                  {t("meckanoDash.noEmployees")}
                </p>
              ) : (
                rosterList.map((emp) => (
                  <div
                    key={String(emp.id)}
                    className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">
                        {emp.firstName || ""} {emp.lastName || "—"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {emp.department?.name || "—"}
                      </p>
                    </div>
                    <div className="shrink-0 mr-2">
                      {isAtWork(emp) ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-[11px] font-black border border-emerald-100 whitespace-nowrap">
                          <CheckCircle size={14} aria-hidden /> {t("meckanoDash.atWork")}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap">
                          <XCircle size={14} aria-hidden /> {t("meckanoDash.offWork")}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
              {t("meckanoDash.lastUpdateLabel")}:{" "}
              {lastUpdate.toLocaleTimeString("he-IL", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 min-h-[520px] lg:h-[650px] flex flex-col relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 z-10 shrink-0">
              <h3 className="text-2xl font-black flex items-center gap-2">
                <MapPin className="text-rose-500" aria-hidden /> {t("meckanoDash.gpsMap")}
              </h3>
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2 rounded-2xl text-sm font-black shadow-sm">
                <ShieldAlert size={16} aria-hidden /> {t("meckanoDash.enforcementRadius")}
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-3 z-10 shrink-0">{t("meckanoDash.mapHint")}</p>

            <div className="flex-1 relative rounded-3xl overflow-hidden border-2 border-slate-200 bg-slate-200 min-h-[320px]">
              <iframe
                title={t("meckanoDash.iframeTitle")}
                src={mapEmbedUrl}
                className="absolute inset-0 w-full h-full border-0 grayscale-[0.12] contrast-[1.05]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute inset-0 pointer-events-none">
                {mapEmployees.map((emp) => {
                  const { topPct, leftPct } = pinPosition(emp);
                  return (
                    <div
                      key={String(emp.id)}
                      className="absolute flex items-center gap-1.5 bg-white/95 px-2.5 py-1 rounded-full shadow-lg border border-emerald-200 text-slate-900 -translate-x-1/2 -translate-y-1/2 max-w-[140px]"
                      style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                    >
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                      <span className="text-[11px] font-bold truncate">
                        {emp.firstName || emp.lastName || String(emp.id)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {activeEmployees.length === 0 && !loading && !fetchError && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/85 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-sm font-medium z-20 max-w-[90%] text-center">
                  {t("meckanoDash.noOneOnSite")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-600 p-8 rounded-[3rem] text-white shadow-2xl">
        <h3 className="text-2xl font-black italic mb-6 flex items-center gap-2">
          <FileText className="text-blue-200" aria-hidden /> {t("meckanoDash.reportSection")}
        </h3>
        <p className="text-blue-100 text-sm mb-6 max-w-2xl">
          בחרו פרויקט וחודש. במערכת מלאה — הדוח יישלף ממקאנו לחישובי רווחיות ERP.
        </p>

        <div className="flex flex-col md:flex-row gap-4">
          <select
            className="flex-1 bg-white/10 border border-white/20 text-white rounded-2xl p-4 focus:outline-none [&>option]:text-slate-900"
            value={reportProject}
            onChange={(e) => setReportProject(e.target.value)}
          >
            <option value="">בחר פרויקט / אתר…</option>
            <option value="project_a">פרויקט תל אביב (דוגמה)</option>
            <option value="project_b">פרויקט נתניה (דוגמה)</option>
          </select>

          <input
            type="month"
            className="flex-1 bg-white/10 border border-white/20 text-white rounded-2xl p-4 focus:outline-none"
            value={reportMonth}
            onChange={(e) => setReportMonth(e.target.value)}
          />

          <button
            type="button"
            className="bg-white text-blue-600 font-black px-8 py-4 rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-xl shadow-blue-900/50"
          >
            <Search size={18} aria-hidden /> הפק דוח
          </button>
        </div>
      </div>
    </div>
  );
}
