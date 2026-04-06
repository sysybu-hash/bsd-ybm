"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export default function DashboardGlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) {
      router.push("/dashboard/erp");
      return;
    }
    router.push(`/dashboard/erp?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="w-full max-w-xl space-y-1">
      <form onSubmit={submit}>
        <div className="relative w-full">
          <Search className="absolute right-3 top-2.5 text-white/35" size={18} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ארכיון חכם – חפש מסמך, ספק, סיכום AI..."
            className="w-full bg-[#0a0b14] border border-white/[0.08] rounded-full py-2 pr-10 pl-4 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 shadow-sm"
            dir="rtl"
          />
        </div>
      </form>
      <p className="text-[10px] text-white/45 flex flex-wrap gap-x-3 gap-y-0.5 px-1">
        <span>קוד / פריסה:</span>
        <a
          href="https://vercel.com/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:underline font-medium"
        >
          תיעוד Vercel
        </a>
        <a
          href="https://docs.github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:underline font-medium"
        >
          GitHub Docs
        </a>
        <span className="text-white/35">— חיפוש כאן שולח ל־ERP לפי מסמכים במערכת</span>
      </p>
    </div>
  );
}
