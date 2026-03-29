"use client";

import { useMemo, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { exportMonthlyReport } from "@/app/dashboard/billing/actions";

export default function ReportingCenter() {
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const yearOptions = useMemo(() => {
    const cy = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => cy - 3 + i);
  }, []);

  const handleExport = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await exportMonthlyReport(month, year);
      if (res.ok) {
        const blob = new Blob(["\ufeff" + res.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", res.fileName || "report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        setError(res.error);
      }
    } catch {
      setError("שגיאת רשת או שרת");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center gap-6 border border-slate-800">
        <div className="bg-blue-600/20 p-4 rounded-2xl text-blue-400 shrink-0">
          <FileSpreadsheet size={32} />
        </div>
        <div className="flex-1 text-center md:text-right min-w-0">
          <h3 className="text-xl font-black italic tracking-tighter">מרכז הדיווחים לרואה חשבון</h3>
          <p className="text-slate-400 text-sm font-bold mt-1">
            ייצוא מרוכז של כל מסמכי המס לפי חודש (CSV לאקסל)
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 bg-slate-800 p-2 rounded-2xl border border-slate-700">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-slate-800 text-white font-bold outline-none px-3 py-2 rounded-xl border border-slate-600"
            aria-label="חודש"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-slate-800 text-white font-bold outline-none px-3 py-2 rounded-xl border border-slate-600"
            aria-label="שנה"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={loading}
          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            "מכין קובץ..."
          ) : (
            <>
              <Download size={18} /> ייצוא CSV
            </>
          )}
        </button>
      </div>
      {error ? (
        <p className="text-sm font-bold text-red-600 text-center md:text-right px-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
