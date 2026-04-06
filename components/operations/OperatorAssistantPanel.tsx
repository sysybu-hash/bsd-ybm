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
    <div className="space-y-5" dir="rtl">
      <section className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-sm">
        <div className="bg-[linear-gradient(135deg,_#f8fbff_0%,_#eef6ff_55%,_#ffffff_100%)] px-6 py-7 md:px-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white px-3 py-1 text-xs font-black text-indigo-300">
            <Bot size={13} />
            Operator Agent
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900">עוזר תפעולי</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">מסך אחד לשאלה אחת בכל פעם. בלי לוח עמוס, בלי קיצורי דרך מיותרים, רק תשובה תפעולית מהירה ובטוחה.</p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-[28px] border border-gray-200 bg-white p-4">
              <p className="text-sm font-black text-gray-900">שאלות מהירות</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <QuickBtn label="תן סטטוס מערכת" onClick={() => setInput("תן סטטוס מערכת")} />
                <QuickBtn label="מה מצב המנוי שלי" onClick={() => setInput("מה מצב המנוי שלי")} />
                <QuickBtn label="תן רשימת משתמשים" onClick={() => setInput("תן רשימת משתמשים")} />
                <QuickBtn label="חשבוניות ממתינות" onClick={() => setInput("בדוק חשבוניות ממתינות")} />
              </div>
            </div>
            <div className="rounded-[28px] border border-emerald-500/25 bg-emerald-500/15 p-4">
              <p className="text-sm font-black text-emerald-900">איך להשתמש נכון</p>
              <ul className="mt-3 space-y-2 text-sm text-emerald-900">
                <li>כתוב בקשה אחת ברורה בכל פעם.</li>
                <li>לפעולות רגישות תידרש בקשת אישור נוספת.</li>
                <li>לניווט יומיומי עדיף להתחיל ממסך הבית.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black text-gray-900">שיחה</h2>
          <span className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-500">מצב בטוח</span>
        </div>
        <div className="max-h-[46vh] space-y-2 overflow-y-auto rounded-[24px] border border-gray-200 bg-gray-50 p-3.5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[88%] rounded-[22px] px-3.5 py-2.5 text-sm leading-6 ${m.role === "user" ? "bg-indigo-600 text-white" : "border border-gray-200 bg-white text-gray-700"}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading ? (
            <div className="flex justify-end text-gray-400"><Loader2 size={16} className="animate-spin" /></div>
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
            className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
          />
          <button
            type="button"
            onClick={() => void send(false)}
            disabled={loading || !input.trim()}
            className="rounded-2xl bg-indigo-600 px-4 py-3 text-white disabled:opacity-50"
          >
            <Send size={15} />
          </button>
        </div>

        {needsConfirm ? (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-500/15 px-3 py-2 text-xs text-amber-900">
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
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-800">
            <CheckCircle2 size={14} />
            פעולות רגישות דורשות אישור מפורש.
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
      className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
    >
      {label}
    </button>
  );
}
