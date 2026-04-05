"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, TrendingDown, Package } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import type { PriceCompareRow } from "@/lib/price-compare-types";

export default function SupplierPriceBoard() {
  const { dir } = useI18n();
  const [rows, setRows] = useState<PriceCompareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/erp/price-compare");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה");
      setRows(data.rows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאת רשת");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const alerts = rows.filter((r) => r.cheaperAlternative);

  return (
    <section
      id="supplier-price-board"
      className="card-avenue bg-white p-6 shadow-xl shadow-gray-200/50 md:p-8"
      dir={dir}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700">
            <Package size={26} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black italic text-gray-900">
              לוח ספקים והשוואת מחירים
            </h2>
            <p className="text-sm text-gray-500">
              מבוסס על שורות מוצרים מסריקות AI (חשבוניות, קבלות, הצעות)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm font-bold text-indigo-600 hover:underline"
        >
          רענון
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500 py-8 justify-center">
          <Loader2 className="animate-spin" size={22} /> טוען השוואות…
        </div>
      )}

      {error && (
        <p className="card-avenue border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">{error}</p>
      )}

      {!loading && !error && alerts.length > 0 && (
        <div className="card-avenue mb-6 space-y-2 border-indigo-200 bg-indigo-50 p-4">
          <p className="text-xs font-black text-indigo-800 flex items-center gap-2">
            <TrendingDown size={16} /> נמצאו מחירים גבוהים ביחס לרכישה הזולה הידועה
          </p>
          <ul className="text-xs text-indigo-900 space-y-1">
            {alerts.slice(0, 5).map((r) => (
              <li key={r.normalizedKey}>
                <strong>{r.description}</strong> — אצל {r.latestSupplier ?? "—"} נרשם ₪
                {r.latestUnitPrice.toFixed(2)}, בעוד המחיר הנמוך בארגון: ₪
                {r.bestUnitPrice.toFixed(2)}
                {r.bestSupplier ? ` (${r.bestSupplier})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="card-avenue border-dashed border-gray-200 bg-gray-50/80 py-8 text-center text-sm italic text-gray-500">
          אין עדיין תצפיות מחיר — סרקו חשבונית או קבלה עם שורות מוצרים.
        </p>
      )}

      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="min-w-full text-sm text-right">
            <thead className="bg-gray-50 text-gray-600 font-bold">
              <tr>
                <th className="px-4 py-3">תיאור</th>
                <th className="px-4 py-3">מחיר מיטבי</th>
                <th className="px-4 py-3">מחיר אחרון</th>
                <th className="px-4 py-3">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.normalizedKey}
                  className={`border-t border-gray-100 ${r.cheaperAlternative ? "bg-rose-50/50" : ""}`}
                >
                  <td className="px-4 py-2 font-medium text-gray-900">{r.description}</td>
                  <td className="px-4 py-2">
                    ₪{r.bestUnitPrice.toFixed(2)}
                    {r.bestSupplier ? (
                      <span className="text-xs text-gray-500 block">{r.bestSupplier}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2">
                    ₪{r.latestUnitPrice.toFixed(2)}
                    {r.latestSupplier ? (
                      <span className="text-xs text-gray-500 block">{r.latestSupplier}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2">
                    {r.cheaperAlternative ? (
                      <span className="text-rose-700 font-bold text-xs">מוצר זול זוהה</span>
                    ) : (
                      <span className="text-emerald-700 text-xs">סביר</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
