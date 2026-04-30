"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  BookOpen,
  FileAudio,
  FileImage,
  FileText,
  GitFork,
  HelpCircle,
  Layers3,
  LayoutList,
  Loader2,
  Map,
  MessageSquareText,
  Mic2,
  Plus,
  Send,
  Sparkles,
  StickyNote,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

type ChatTurn = { role: "user" | "model"; content: string };

type NotebookSource = {
  id: string;
  fileName: string;
  mimeType: string;
  base64: string;
  text?: string;
};

type StudioAction = {
  id: string;
  label: string;
  icon: typeof Sparkles;
  prompt: string;
};

function randomId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readFileAsData(file: File): Promise<{ base64: string; text?: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("read failed"));
        return;
      }
      if (file.type.startsWith("text/") || /\.(md|txt)$/i.test(file.name)) {
        resolve({ base64: "", text: result });
        return;
      }
      const comma = result.indexOf(",");
      resolve({ base64: comma >= 0 ? result.slice(comma + 1) : result });
    };
    reader.onerror = () => reject(reader.error);
    if (file.type.startsWith("text/") || /\.(md|txt)$/i.test(file.name)) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
}

function sourceIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("audio/")) return FileAudio;
  return FileText;
}

const studioActions: StudioAction[] = [
  {
    id: "summary",
    label: "סיכום מקורות",
    icon: Sparkles,
    prompt:
      "צור סיכום ברור של כל המקורות. הפרד בין עובדות ודאיות לבין מסקנות, וציין לכל נקודה מקור או שם קובץ כאשר אפשר.",
  },
  {
    id: "briefing",
    label: "מסמך תדריך",
    icon: LayoutList,
    prompt:
      "צור Briefing Doc מקצועי: נושא, מטרות, החלטות נדרשות, סיכונים, נתונים כספיים/כמותיים, פערים, והמלצות פעולה.",
  },
  {
    id: "study",
    label: "מדריך לימוד",
    icon: BookOpen,
    prompt:
      "צור Study Guide: מושגי מפתח, שאלות חזרה, תשובות קצרות, דוגמאות מתוך המקורות, ונושאים לבדיקה נוספת.",
  },
  {
    id: "faq",
    label: "FAQ",
    icon: HelpCircle,
    prompt:
      "צור FAQ מלא מהמקורות: שאלות נפוצות, תשובות קצרות, ומה המקור שממנו נגזרה כל תשובה.",
  },
  {
    id: "timeline",
    label: "ציר זמן",
    icon: Layers3,
    prompt:
      "חלץ ציר זמן של אירועים, מועדים, אבני דרך, תאריכי מסמך, תשלומים או משימות. אם אין תאריכים, כתוב זאת במפורש.",
  },
  {
    id: "mindmap",
    label: "מפת מושגים",
    icon: GitFork,
    prompt:
      "צור מפת מושגים טקסטואלית היררכית בסגנון Mind Map: נושא מרכזי, ענפים, תתי ענפים וקשרים בין מסמכים.",
  },
  {
    id: "citations",
    label: "ציטוטים ומקורות",
    icon: Map,
    prompt:
      "הצג טבלת טענות מול מקורות: טענה, מקור/קובץ, מיקום משוער אם ניתן, ורמת ביטחון. אל תמציא מקור.",
  },
  {
    id: "audio",
    label: "סקירת אודיו",
    icon: Mic2,
    prompt:
      "כתוב תסריט Audio Overview בעברית לשני דוברים שמסכמים את המקורות כמו NotebookLM: פתיחה, עיקרי הדברים, מחלוקות, סיכונים וסיום קצר.",
  },
];

type Props = {
  geminiConfigured: boolean;
  embedInHub?: boolean;
  embedCompact?: boolean;
  onAssistantReply?: (text: string) => void;
  onSourcesChange?: (fileNames: string[]) => void;
};

export default function ErpProjectNotebook({
  geminiConfigured,
  embedInHub = false,
  embedCompact = false,
  onAssistantReply,
  onSourcesChange,
}: Props) {
  const { dir } = useI18n();
  const [sources, setSources] = useState<NotebookSource[]>([]);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [manualSource, setManualSource] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sourceNames = useMemo(() => sources.map((source) => source.fileName), [sources]);

  useEffect(() => {
    onSourcesChange?.(sourceNames);
  }, [sourceNames, onSourcesChange]);

  const addSources = useCallback(async (accepted: File[]) => {
    setError(null);
    const next: NotebookSource[] = [];
    for (const file of accepted) {
      try {
        const data = await readFileAsData(file);
        next.push({
          id: randomId(),
          fileName: file.name,
          mimeType: file.type || (file.name.endsWith(".md") ? "text/markdown" : "text/plain"),
          base64: data.base64,
          text: data.text,
        });
      } catch {
        setError("לא הצלחתי לקרוא את אחד המקורות.");
      }
    }
    if (next.length) {
      setSources((prev) => [...prev, ...next].slice(0, 8));
      if (messages.length) setMessages([]);
    }
  }, [messages.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: addSources,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
    },
    maxFiles: 8,
    disabled: sending,
  });

  const clearAll = () => {
    setSources([]);
    setMessages([]);
    setInput("");
    setManualSource("");
    setNotes("");
    setError(null);
  };

  const addManualSource = () => {
    const text = manualSource.trim();
    if (!text) return;
    setSources((prev) => [
      ...prev,
      {
        id: randomId(),
        fileName: `מקור טקסט ${prev.length + 1}`,
        mimeType: "text/plain",
        base64: "",
        text,
      },
    ].slice(0, 8));
    setManualSource("");
    if (messages.length) setMessages([]);
  };

  const removeSource = (id: string) => {
    setSources((prev) => prev.filter((source) => source.id !== id));
    if (messages.length) setMessages([]);
  };

  const sendPrompt = async (prompt: string) => {
    const text = prompt.trim();
    if (!text || sending) return;
    if (!geminiConfigured) {
      setError("Gemini לא מוגדר במערכת.");
      return;
    }

    const userMsg: ChatTurn = { role: "user", content: text };
    const nextThread = [...messages, userMsg];
    setMessages(nextThread);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/erp/project-notebook/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextThread,
          sources: sources.map((source) => ({
            fileName: source.fileName,
            base64: source.base64,
            mimeType: source.mimeType,
            text: source.text,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Notebook request failed");
      const answer = String(data.answer ?? "");
      setMessages((current) => [...current, { role: "model", content: answer }]);
      onAssistantReply?.(answer);
    } catch (err) {
      setMessages((current) => current.slice(0, -1));
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  };

  const hasSources = sources.length > 0;

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] shadow-lg ${
        embedInHub ? "" : "min-h-[680px]"
      }`}
      dir={dir}
    >
      <header className="shrink-0 border-b border-[color:var(--line)] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <BookOpen className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--ink-400)]">
                NotebookLM Workspace
              </p>
              <h2 className="text-lg font-black text-[color:var(--ink-900)]">מחברת מקורות חכמה</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[color:var(--line)] bg-white px-3 text-xs font-black text-[color:var(--ink-700)] hover:bg-[color:var(--canvas-sunken)]"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            ניקוי מחברת
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)_300px]">
        <aside className="flex min-h-0 flex-col gap-3 border-b border-[color:var(--line)] p-3 lg:border-b-0 lg:border-e">
          <div
            {...getRootProps()}
            className={`shrink-0 cursor-pointer rounded-2xl border-2 border-dashed px-4 py-5 text-center transition ${
              isDragActive ? "border-violet-400 bg-violet-50" : "border-[color:var(--line)] bg-white hover:border-violet-300"
            } ${sending ? "pointer-events-none opacity-50" : ""}`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto h-8 w-8 text-violet-500" aria-hidden />
            <p className="mt-2 text-sm font-black text-[color:var(--ink-800)]">הוסף מקורות</p>
            <p className="mt-1 text-[11px] font-semibold text-[color:var(--ink-500)]">
              PDF, טקסט, Markdown, תמונה או אודיו
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-[color:var(--line)] bg-white p-3">
            <textarea
              value={manualSource}
              onChange={(event) => setManualSource(event.target.value)}
              rows={3}
              placeholder="הדבק טקסט, קישור, הערת שטח או מפרט קצר..."
              className="w-full resize-none rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] p-3 text-xs font-semibold outline-none focus:border-violet-300"
            />
            <button
              type="button"
              onClick={addManualSource}
              disabled={!manualSource.trim() || sources.length >= 8}
              className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-xs font-black text-white hover:bg-violet-700 disabled:opacity-45"
            >
              <Plus className="h-4 w-4" aria-hidden />
              הוסף מקור טקסט
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto space-y-2">
            {sources.length === 0 ? (
              <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] p-4 text-center text-xs font-semibold text-[color:var(--ink-500)]">
                אין מקורות במחברת.
              </div>
            ) : (
              sources.map((source) => {
                const Icon = sourceIcon(source.mimeType);
                return (
                  <div key={source.id} className="flex items-center gap-2 rounded-2xl border border-[color:var(--line)] bg-white p-2">
                    <Icon className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-[color:var(--ink-900)]">{source.fileName}</p>
                      <p className="truncate text-[10px] font-semibold text-[color:var(--ink-400)]">{source.mimeType}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSource(source.id)}
                      className="rounded-lg p-1 text-[color:var(--ink-400)] hover:bg-rose-50 hover:text-rose-600"
                      aria-label="הסר מקור"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <main className="flex min-h-0 flex-col">
          <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-[color:var(--line)] bg-[color:var(--canvas-sunken)]/35 p-3 md:grid-cols-4">
            {studioActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => void sendPrompt(action.prompt)}
                  disabled={!hasSources || sending || !geminiConfigured}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-[color:var(--ink-800)] shadow-sm transition hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {action.label}
                </button>
              );
            })}
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-[color:var(--line)] bg-white/70 p-6 text-center">
                <MessageSquareText className="h-12 w-12 text-violet-300" aria-hidden />
                <h3 className="mt-3 text-lg font-black text-[color:var(--ink-900)]">שאל את המקורות</h3>
                <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-[color:var(--ink-500)]">
                  הוסף מקורות ואז שאל שאלה, או לחץ על אחת מפעולות ה-Studio כדי לקבל תוצר NotebookLM מוכן.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={`${index}-${message.role}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[min(100%,48rem)] rounded-2xl px-4 py-3 text-sm leading-7 ${
                      message.role === "user"
                        ? "bg-[color:var(--ink-900)] text-white"
                        : "border border-[color:var(--line)] bg-white text-[color:var(--ink-900)]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {sending ? (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-bold text-[color:var(--ink-500)]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                מעבד את המקורות...
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          {error ? (
            <div className="mx-4 mb-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
              {error}
            </div>
          ) : null}

          <div className="shrink-0 border-t border-[color:var(--line)] p-3">
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendPrompt(input);
                  }
                }}
                placeholder="שאל שאלה על המקורות, בקש השוואה, חילוץ נתונים, סתירות או החלטות לביצוע..."
                disabled={sending || !geminiConfigured}
                className="min-h-[52px] flex-1 resize-none rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => void sendPrompt(input)}
                disabled={sending || !input.trim() || !geminiConfigured}
                className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-40"
                aria-label="שלח"
              >
                <Send className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
        </main>

        <aside className="flex min-h-0 flex-col gap-3 border-t border-[color:var(--line)] p-3 lg:border-s lg:border-t-0">
          <div className="rounded-2xl border border-[color:var(--line)] bg-white p-3">
            <div className="mb-2 flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-violet-600" aria-hidden />
              <h3 className="text-sm font-black text-[color:var(--ink-900)]">הערות</h3>
            </div>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="כתוב לעצמך הערות, החלטות, משימות או נקודות לבדיקה..."
              className="h-40 w-full resize-none rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] p-3 text-xs font-semibold outline-none focus:border-violet-300"
            />
          </div>

          <div className="grid gap-2 rounded-2xl border border-[color:var(--line)] bg-white p-3 text-xs font-semibold text-[color:var(--ink-600)]">
            <div className="flex items-center justify-between">
              <span>מקורות</span>
              <strong className="text-[color:var(--ink-900)]">{sources.length}/8</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>שיחות</span>
              <strong className="text-[color:var(--ink-900)]">{messages.filter((m) => m.role === "user").length}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Studio</span>
              <strong className="text-[color:var(--ink-900)]">{studioActions.length} כלים</strong>
            </div>
          </div>

          {!embedCompact ? (
            <p className="rounded-2xl bg-violet-50 p-3 text-[11px] font-semibold leading-5 text-violet-900">
              התשובות נשענות על המקורות שהעלית ועל הקשר ERP אחרון. אם אין מקור מספיק, המנוע אמור לציין זאת במקום להמציא.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
