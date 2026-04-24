"use client";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { BookOpen, Bot, Paperclip, Send, User } from "lucide-react";

export type ProjectNotebookMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type ProjectNotebookUIProps = {
  projectName: string;
  messages: ProjectNotebookMessage[];
  inputValue: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  /** הוספת קבצים — placeholder לעתיד */
  onAttachClick?: () => void;
  /** בזמן שליחה / סטרימינג מה־API */
  sending?: boolean;
  errorMessage?: string | null;
};

/**
 * UI צ׳אט — מחברת פרויקט (הגיון API נשאר אצל הקומפוננטה שעוטפת)
 */
export function ProjectNotebookUI({
  projectName,
  messages,
  inputValue,
  onInputChange,
  onSend,
  onAttachClick,
  sending = false,
  errorMessage = null,
}: ProjectNotebookUIProps) {
  return (
    <div className="mx-auto flex h-[min(100vh-6rem,900px)] max-w-5xl flex-col p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-brand p-2.5 text-white shadow-sm">
            <BookOpen size={24} aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">מחברת פרויקט</h1>
            <p className="text-sm text-text-secondary">
              התייעצות AI על נתוני:{" "}
              <span className="font-medium text-text-primary">{projectName}</span>
            </p>
          </div>
        </div>
      </div>

      <DashboardCard className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white/50 p-0 backdrop-blur-sm">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {errorMessage}
            </div>
          ) : null}
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
              <Bot size={48} className="mb-4 text-gray-300" aria-hidden />
              <h3 className="text-lg font-medium text-text-primary">העוזר לפרויקט זה</h3>
              <p className="mt-2 max-w-sm text-text-secondary">
                אפשר לבקש השוואת הצעות, סיכום חוזים, או חריגות בכתבי כמויות עבור {projectName}.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                    msg.role === "assistant" ? "bg-brand text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === "assistant"
                      ? "rounded-tr-none bg-brand-background text-text-primary"
                      : "rounded-tl-none bg-brand text-white shadow-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  <span
                    className={`mt-2 block text-[10px] ${
                      msg.role === "assistant" ? "text-gray-400" : "text-brand-light"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 bg-white p-4">
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={onAttachClick}
              className="absolute end-3 text-gray-400 transition-colors hover:text-brand"
              aria-label="הוסף קובץ"
            >
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !sending) onSend();
              }}
              placeholder="שאלו שאלה על הפרויקט..."
              disabled={sending}
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-4 pe-12 ps-4 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand disabled:opacity-50"
            />
            <button
              type="button"
              onClick={onSend}
              disabled={sending || !inputValue.trim()}
              className="absolute start-2 rounded-full bg-brand p-2.5 text-white shadow-sm transition-transform hover:scale-105 hover:bg-brand-dark disabled:pointer-events-none disabled:opacity-40"
              aria-label="שלח"
            >
              <Send size={18} className="scale-x-[-1]" />
            </button>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
