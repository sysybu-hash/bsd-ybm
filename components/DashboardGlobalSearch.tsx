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
      router.push("/app/documents/erp");
      return;
    }
    router.push(`/dashboard/erp?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="w-full max-w-xl space-y-1">
      <form onSubmit={submit}>
        <div className="relative w-full">
          <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ארכיון חכם – חפש מסמך, ספק, סיכום AI..."
            className="w-full bg-white border border-gray-200 rounded-full py-2 pr-10 pl-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 shadow-sm"
            dir="rtl"
          />
        </div>
      </form>
      <p className="text-[10px] text-gray-400 flex flex-wrap gap-x-3 gap-y-0.5 px-1">
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
        <span className="text-gray-400">— חיפוש כאן שולח ל־ERP לפי מסמכים במערכת</span>
      </p>
    </div>
  );
}
