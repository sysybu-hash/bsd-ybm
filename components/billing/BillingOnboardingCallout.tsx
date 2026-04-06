"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function BillingOnboardingCallout({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert("לא ניתן להעתיק — העתיקו ידנית");
    }
  };

  return (
    <div
      className="rounded-2xl border border-emerald-500/25/90 bg-gradient-to-br from-emerald-50/90 to-sky-50/50 p-5 sm:p-6 text-sm text-white/75 shadow-sm"
      dir="rtl"
    >
      <p className="font-black text-white mb-2 flex items-center gap-2">
        <span className="rounded-lg bg-emerald-600 text-white text-xs px-2 py-0.5">חינם</span>
        מה לומר לחבר לפני שהוא נרשם (והיכן PayPal נכנס)
      </p>
      <p className="text-xs text-white/55 mb-3 leading-relaxed">
        ההרשמה והשימוש הבסיסי יכולים להישאר <strong>בלי חיוב</strong>. תשלום ב־PayPal מופיע רק כשמשדרגים מנוי או כשאתם יוצרים{" "}
        <strong>בקשת גבייה</strong> ללקוח — הכל מוגדר בדף הזה ובהגדרות PayPal של הארגון.
      </p>
      <div className="rounded-xl bg-white/90 border border-white/[0.07] p-4 text-white/75 leading-relaxed whitespace-pre-wrap text-[13px]">
        {text}
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0a0b14] px-4 py-2 text-xs font-bold text-white/65 hover:bg-white/[0.03]"
      >
        {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
        {copied ? "הועתק" : "העתקת טקסט לווטסאפ / מייל"}
      </button>
    </div>
  );
}
