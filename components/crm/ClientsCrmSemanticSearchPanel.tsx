"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

type ContactRef = { id: string; name: string };

type Props = {
  contactDirectory: ContactRef[];
};

/**
 * שליחת שאילתה ל־/api/crm/semantic-search והצגת מזהי אנשי קשר מותאמים
 */
export function ClientsCrmSemanticSearchPanel({ contactDirectory }: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [matchedIds, setMatchedIds] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nameById = new Map(contactDirectory.map((c) => [c.id, c.name]));

  async function runSearch() {
    const query = q.trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    setMatchedIds(null);
    try {
      const res = await fetch("/api/crm/semantic-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) {
        setError("החיפוש נכשל. נסה שוב.");
        return;
      }
      const data = (await res.json()) as { matchedIds?: string[] };
      setMatchedIds(Array.isArray(data.matchedIds) ? data.matchedIds : []);
    } catch {
      setError("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardCard
      title="חיפוש סמנטי מבוסס AI"
      className="to-brand-background/30 bg-gradient-to-b from-white"
    >
      <p className="mb-4 text-sm text-text-secondary">
        חפש לקוחות או פרויקטים בשפה חופשית. המודל ימצא את ההקשר המתאים ביותר מתוך נתוני
        ה-CRM.
      </p>
      <div className="relative">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void runSearch()}
          placeholder="למשל: מי הספק שעבד איתנו בחיפה בשנה שעברה?"
          className="w-full rounded-xl border border-gray-200 py-3 ps-4 pe-10 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
        />
        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={loading}
          className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-brand disabled:opacity-50"
          aria-label="הרץ חיפוש"
        >
          {loading ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Search className="h-[18px] w-[18px]" />}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-amber-700">{error}</p> : null}
      {matchedIds && matchedIds.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm" aria-live="polite">
          {matchedIds.map((id) => (
            <li key={id}>
              <Link
                href={`/app/clients?clientId=${encodeURIComponent(id)}`}
                className="block truncate rounded-lg border border-gray-100 bg-white px-3 py-2 font-medium text-brand hover:bg-brand-background/60"
              >
                {nameById.get(id) ?? id}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {matchedIds && matchedIds.length === 0 && !loading ? (
        <p className="mt-3 text-sm text-text-secondary">לא נמצאו התאמות. נסו ניסוח אחר.</p>
      ) : null}
    </DashboardCard>
  );
}
