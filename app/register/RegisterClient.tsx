"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, Loader2, ArrowRight, UserPlus } from "lucide-react";

const ORG_TYPES = [
  { value: "HOME", label: "משק בית" },
  { value: "FREELANCER", label: "עצמאי" },
  { value: "COMPANY", label: "חברה" },
  { value: "ENTERPRISE", label: "ארגון" },
];

type Props = {
  inviteToken?: string;
};

export default function RegisterClient({ inviteToken }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 flex flex-col"
      dir="rtl"
    >
      <header className="relative z-10 border-b border-slate-100 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-xl font-black italic tracking-tighter"
            style={{ color: "var(--primary-color, #3b82f6)" }}
          >
            BSD-YBM<span className="text-slate-900">.</span>
          </Link>
          <Link href="/login" className="text-sm font-bold text-blue-600">
            כניסה
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-[2rem] border border-slate-100 bg-white p-10 shadow-2xl shadow-slate-200/60"
        >
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <UserPlus className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <h1 className="text-center text-2xl font-black italic text-slate-900">הרשמה לאתר</h1>
          <p className="mt-2 text-center text-sm text-slate-500 leading-relaxed">
            {inviteToken ? (
              <>
                הוזמנתם עם קישור ייעודי — לאחר השלמה תקבלו גישה פעילה לפי רמת המנוי שהוקצתה (האימייל חייב
                להתאים להזמנה).
              </>
            ) : (
              <>
                מלאו פרטים — מנהל המערכת יאשר את המנוי ויישלח אליכם פרטי כניסה או תועברו להתחברות עם
                Google לאחר האישור.
              </>
            )}
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setErr(null);
              setMsg(null);
              setLoading(true);
              const fd = new FormData(e.currentTarget);
              try {
                const res = await fetch("/api/register", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: fd.get("email"),
                    name: fd.get("name"),
                    organizationName: fd.get("organizationName"),
                    orgType: fd.get("orgType"),
                    inviteToken: inviteToken || undefined,
                  }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  setErr(typeof data.error === "string" ? data.error : "שגיאה");
                } else {
                  setMsg(
                    typeof data.message === "string"
                      ? data.message
                      : "הבקשה נקלטה בהצלחה.",
                  );
                  (e.target as HTMLFormElement).reset();
                }
              } catch {
                setErr("שגיאת רשת");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">אימייל</label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">שם מלא</label>
              <input name="name" className="w-full rounded-xl border border-slate-200 px-4 py-2.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Building2 size={14} /> שם ארגון / עסק
              </label>
              <input
                name="organizationName"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">סוג</label>
              <select
                name="orgType"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-white"
                defaultValue="COMPANY"
              >
                {ORG_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-500 text-white py-4 text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : null}
              {inviteToken ? "השלמת הרשמה" : "שליחת בקשת הרשמה"}
            </button>
          </form>

          {err && (
            <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {err}
            </p>
          )}
          {msg && (
            <div className="mt-4 space-y-3">
              <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800">
                {msg}
              </p>
              <Link
                href="/login?registered=1"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500"
              >
                {inviteToken ? "מעבר לכניסה" : "המשך לכניסה (אחרי אישור מנוי)"}
              </Link>
            </div>
          )}

          <Link
            href="/login"
            className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-blue-600"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            כבר רשומים? כניסה
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
