"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { updateIndustryProfileAction } from "@/app/actions/org-settings";

type Trade = { id: string; label: string; emoji: string };

type Props = {
  trades: Trade[];
  currentTrade: string | null;
};

export default function TradePickerClient({ trades, currentTrade }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(currentTrade);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("constructionTrade", selected);
      const result = await updateIndustryProfileAction(fd);
      if (!result.ok) {
        setError(result.error ?? "שגיאה בשמירה");
        return;
      }
      router.push("/app");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-8 px-4 py-12" dir="rtl">
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-widest text-indigo-500">הגדרת מקצוע</p>
        <h1 className="mt-3 text-3xl font-black text-[color:var(--ink-900)]">
          מה המקצוע שלך?
        </h1>
        <p className="mt-2 text-base text-[color:var(--ink-500)]">
          בחר מקצוע אחד — המערכת תתאים את עצמה לצרכים שלך
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
        {trades.map((trade) => {
          const isActive = selected === trade.id;
          return (
            <button
              key={trade.id}
              type="button"
              onClick={() => setSelected(trade.id)}
              className={`relative flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                isActive
                  ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100"
                  : "border-[color:var(--line)] bg-white hover:border-indigo-300 hover:bg-indigo-50/40"
              }`}
            >
              <span className="text-3xl" aria-hidden>{trade.emoji}</span>
              <span className={`text-sm font-bold leading-tight ${isActive ? "text-indigo-700" : "text-[color:var(--ink-800)]"}`}>
                {trade.label}
              </span>
              {isActive && (
                <CheckCircle2 className="absolute end-2 top-2 h-4 w-4 text-indigo-500" aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={!selected || isPending}
        className="inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 text-sm font-black text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <CheckCircle2 className="h-4 w-4" aria-hidden />
        )}
        {isPending ? "שומר…" : "המשך לסורק"}
      </button>
    </div>
  );
}
