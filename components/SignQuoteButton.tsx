"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";

export default function SignQuoteButton({
  contactId,
  amount,
}: {
  contactId: string;
  amount: number;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const createLink = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "שגיאה");
        return;
      }
      if (data.signUrl) {
        window.open(data.signUrl, "_blank", "noopener,noreferrer");
        setMsg("נפתח חלון חתימה ללקוח");
      }
    } catch {
      setMsg("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 items-start">
      <button
        type="button"
        onClick={createLink}
        disabled={loading}
        className="inline-flex items-center gap-1 text-xs bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-600/30 disabled:opacity-50"
      >
        <PenLine size={14} />
        {loading ? "יוצר קישור..." : "חתום ואשר (קישור ללקוח)"}
      </button>
      {msg && <span className="text-[10px] text-white/45 max-w-[180px]">{msg}</span>}
    </div>
  );
}
