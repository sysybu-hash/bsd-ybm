"use client";

import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { exportMonthlyReport } from "@/app/dashboard/billing/actions";

export default function ReportingCenter() {
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const yearOptions = useMemo(() => {
    const cy = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => cy - 3 + i);
  }, []);

  const handleExport = async () => {
    setSuccess(false);
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
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert(res.error);
      }
    } catch {
      alert("שגיאת רשת או שרת");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-gray-100 bg-white p-8 text-gray-900 shadow-sm transition-all group hover:border-indigo-500/30 md:flex-row">
        <div className="bg-indigo-500/15 p-5 rounded-2xl text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform shrink-0">
          <FileSpreadsheet size={32} />
        </div>
        <div className="flex-1 text-center md:text-right min-w-0">
          <h3 className="text-xl font-black italic tracking-tighter">מרכז דיווחים BSD-YBM</h3>
          <p className="text-gray-500 text-sm font-bold mt-1">
            ייצוא נתוני מס לרואה חשבון בפורמט CSV
          </p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-white font-black text-indigo-300 outline-none px-3 py-2 rounded-xl border border-gray-100"
            aria-label="חודש"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1} className="bg-white text-gray-900">
                {i + 1}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-white font-black text-indigo-300 outline-none px-3 py-2 rounded-xl border border-gray-100"
            aria-label="שנה"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y} className="bg-white text-gray-900">
                {y}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={loading}
          className={`shrink-0 px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-2 shadow-xl disabled:opacity-50 disabled:pointer-events-none ${
            success ? "bg-green-600 hover:bg-green-600" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? (
            "מכין..."
          ) : success ? (
            <>
              <CheckCircle2 size={18} /> הורד!
            </>
          ) : (
            <>
              <Download size={18} /> ייצוא CSV
            </>
          )}
        </button>
      </div>
    </div>
  );
}
