"use client";

import { useEffect, useState } from "react";
import { Gauge, Infinity as InfinityIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

type CreditsResponse = {
  ok: boolean;
  cheap?: number;
  premium?: number;
  total?: number;
  isVip?: boolean;
  tier?: string;
};

type Props = {
  label?: string;
  /**
   * מזהה רענון — כל שינוי שלו גורר fetch מחדש. השרת אופייני מקטין יתרה
   * אחרי סריקה; ה-shell יכול לקדם ערך זה כשהפענוח הסתיים.
   */
  refreshKey?: number;
};

export default function CreditsChip({ label = "סריקות", refreshKey = 0 }: Props) {
  const [data, setData] = useState<CreditsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/scan/credits", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: CreditsResponse | null) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const isVip = data?.ok && data.isVip;
  const total = data?.ok ? data.total ?? 0 : null;
  const display = loading ? null : isVip ? "∞" : total !== null ? total.toLocaleString("he-IL") : "—";

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--scanw-line)] bg-white/70 px-2.5 py-1 text-[11px] font-black text-[color:var(--scanw-ink)] backdrop-blur"
      title={isVip ? "VIP — ללא הגבלת סריקות" : data?.tier ? `מנוי ${data.tier}` : undefined}
    >
      {isVip ? (
        <InfinityIcon className="h-3.5 w-3.5 text-[color:var(--scanw-accent)]" aria-hidden />
      ) : (
        <Gauge className="h-3.5 w-3.5 text-[color:var(--scanw-accent)]" aria-hidden />
      )}
      {loading ? (
        <Skeleton className="h-3 w-10 rounded-full" aria-label="טוען יתרת סריקות" role="status" />
      ) : (
        <span className="tabular-nums">{display}</span>
      )}
      <span className="text-[color:var(--scanw-muted)]">{label}</span>
    </div>
  );
}
