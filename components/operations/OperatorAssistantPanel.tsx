"use client";

import { useState } from "react";
import { Bot, CheckCircle2, Loader2, Send, ShieldAlert } from "lucide-react";

type Msg = { role: "user" | "assistant"; text: string };

export default function OperatorAssistantPanel() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "שלום, אני העוזר התפעולי שלך. אפשר לבקש: סטטוס מערכת, מצב מנוי, משתמשים, או חשבוניות ממתינות.",
    },
  ]);

  const send = async (confirm = false) => {
    const message = input.trim();
    if (!message || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setLoading(true);
    setNeedsConfirm(false);

    try {
      const res = await fetch("/api/ai/operator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, confirm }),
      });
      const data = (await res.json()) as {
        reply?: string;
        requiresConfirmation?: boolean;
      };
      const reply = data.reply ?? "לא התקבלה תשובה.";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      setNeedsConfirm(Boolean(data.requiresConfirmation));
      if (!data.requiresConfirmation) {
        setInput("");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "אירעה שגיאת תקשורת. נסה שוב." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
          <Bot size={13} />
          Operator Agent
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">עוזר תפעולי פנימי</h1>
        <p className="mt-1 text-sm text-slate-600">תן הוראות מתוך האתר, וקבל ביצוע תפעולי מהיר ובטוח.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <QuickBtn label="תן סטטוס מערכת" onClick={() => setInput("תן סטטוס מערכת")}/>
          <QuickBtn label="מה מצב המנוי שלי" onClick={() => setInput("מה מצב המנוי שלי")}/>
          <QuickBtn label="תן רשימת משתמשים" onClick={() => setInput("תן רשימת משתמשים")}/>
          <QuickBtn label="חשבוניות ממתינות" onClick={() => setInput("בדוק חשבוניות ממתינות")}/>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="max-h-[46vh] space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-800"}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading ? (
            <div className="flex justify-end text-slate-500"><Loader2 size={16} className="animate-spin" /></div>
          ) : null}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void send(false);
              }
            }}
            placeholder="כתוב הוראת תפעול..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void send(false)}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
          >
            <Send size={15} />
          </button>
        </div>

        {needsConfirm ? (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <span className="inline-flex items-center gap-1.5"><ShieldAlert size={14} />פעולה רגישה דורשת אישור</span>
            <button
              type="button"
              onClick={() => void send(true)}
              className="rounded-lg bg-amber-600 px-3 py-1 font-bold text-white hover:bg-amber-700"
            >
              אשר ביצוע
            </button>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 inline-flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            מצב בטוח פעיל: פעולות רגישות דורשות אישור מפורש.
          </div>
        )}
      </section>
    </div>
  );
}

function QuickBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
    >
      {label}
    </button>
  );
}
