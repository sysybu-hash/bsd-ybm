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
      <div className="bg-white text-slate-900 p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col md:flex-row items-center gap-6 group hover:border-blue-200 transition-all">
        <div className="bg-blue-50 p-5 rounded-2xl text-blue-600 border border-blue-100 group-hover:scale-110 transition-transform shrink-0">
          <FileSpreadsheet size={32} />
        </div>
        <div className="flex-1 text-center md:text-right min-w-0">
          <h3 className="text-xl font-black italic tracking-tighter">מרכז דיווחים BSD-YBM</h3>
          <p className="text-slate-600 text-sm font-bold mt-1">
            ייצוא נתוני מס לרואה חשבון בפורמט CSV
          </p>
        </div>
        <div className="flex gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-white font-black text-blue-700 outline-none px-3 py-2 rounded-xl border border-slate-200"
            aria-label="חודש"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1} className="bg-white text-slate-900">
                {i + 1}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-white font-black text-blue-700 outline-none px-3 py-2 rounded-xl border border-slate-200"
            aria-label="שנה"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y} className="bg-white text-slate-900">
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
            success ? "bg-green-600 hover:bg-green-600" : "bg-blue-600 hover:bg-blue-700"
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
