"use client";

import { useState } from "react";
import { Megaphone, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminBroadcastNotifications() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/broadcast-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; count?: number; error?: string };
      if (!res.ok) {
        setMsg({ type: "err", text: data.error || "הבקשה נכשלה" });
        return;
      }
      setMsg({
        type: "ok",
        text: `נשלח ל־${data.count ?? 0} משתמשים פעילים — ההודעה תופיע בפעמון בדשבורד.`,
      });
      setTitle("");
      setBody("");
    } catch {
      setMsg({ type: "err", text: "שגיאת רשת" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h3 className="mb-2 flex items-center gap-3 text-2xl font-black text-gray-900">
        <Megaphone className="text-violet-500" size={28} aria-hidden />
        שידור לכולם
      </h3>
      <p className="mb-6 text-sm font-medium text-gray-500">
        יוצר התראה פנימית לכל משתמש במצב <strong className="text-gray-700">ACTIVE</strong>. ההודעה תופיע בפעמון בראש הדשבורד (לא מייל).
      </p>

      <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
        <div>
          <label htmlFor="bc-title" className="mb-1 block text-xs font-bold text-gray-600">
            כותרת
          </label>
          <input
            id="bc-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 outline-none ring-indigo-500/20 focus:ring-2"
            placeholder="למשל: עדכון מהפלטפורמה"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="bc-body" className="mb-1 block text-xs font-bold text-gray-600">
            תוכן
          </label>
          <textarea
            id="bc-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={4000}
            required
            rows={5}
            className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 outline-none ring-indigo-500/20 focus:ring-2"
            placeholder="הטקסט שיוצג בהתראה..."
            disabled={loading}
          />
        </div>

        {msg ? (
          <div
            className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-bold ${
              msg.type === "ok"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-800"
            }`}
            role="status"
          >
            {msg.type === "ok" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : null}
            {msg.type === "err" ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : null}
            {msg.text}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || !title.trim() || !body.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Megaphone size={18} />}
          שלח לכל המשתמשים
        </button>
      </form>
    </div>
  );
}
