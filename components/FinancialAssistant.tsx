"use client";

import { useState } from "react";
import { Bot, Send, X, Loader2 } from "lucide-react";

export default function FinancialAssistant({ orgId }: { orgId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, orgId }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? "לא התקבלה תשובה מה-AI.");
    } catch {
      setAnswer("מצטער, חלה שגיאה בגישה לנתונים.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] left-4 z-50 sm:bottom-6 sm:left-6"
      dir="rtl"
    >
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 p-4 rounded-full shadow-2xl shadow-blue-500/40 transition-all transform hover:scale-110"
          aria-label="פתח עוזר פיננסי"
        >
          <Bot size={28} className="text-white" />
        </button>
      ) : (
        <div className="bg-white border border-slate-200 w-80 rounded-2xl shadow-2xl shadow-slate-300/50 overflow-hidden flex flex-col">
          <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
            <span className="font-bold flex items-center gap-2">
              <Bot size={18} /> עוזר פיננסי BSD-YBM
            </span>
            <button type="button" onClick={() => setIsOpen(false)} className="hover:opacity-90" aria-label="סגור">
              <X size={18} />
            </button>
          </div>
          <div className="p-4 h-64 overflow-y-auto text-sm text-slate-700 bg-slate-50">
            {answer ? (
              <p className="leading-relaxed whitespace-pre-wrap">{answer}</p>
            ) : (
              <p className="italic text-slate-500">
                שאל אותי משהו כמו: &quot;כמה הוצאנו החודש על חשמל?&quot;
              </p>
            )}
            {loading && <Loader2 className="animate-spin mt-2 text-blue-600" size={20} />}
          </div>
          <div className="p-3 border-t border-slate-200 flex gap-2 bg-white">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="שאל את ה-AI..."
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={askAI}
              disabled={loading}
              className="bg-blue-600 p-2 rounded-lg hover:bg-blue-500 disabled:opacity-50 text-white"
              aria-label="שלח"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
