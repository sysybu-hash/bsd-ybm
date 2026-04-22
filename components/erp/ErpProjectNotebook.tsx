"use client";

import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  BookOpen,
  FileText,
  Loader2,
  Send,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

type ChatTurn = { role: "user" | "model"; content: string };

type PdfSource = {
  id: string;
  fileName: string;
  mimeType: string;
  base64: string;
};

function randomId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r !== "string") {
        reject(new Error("read failed"));
        return;
      }
      const comma = r.indexOf(",");
      resolve(comma >= 0 ? r.slice(comma + 1) : r);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type Props = {
  geminiConfigured: boolean;
};

export default function ErpProjectNotebook({ geminiConfigured }: Props) {
  const { t, dir } = useI18n();
  const [sources, setSources] = useState<PdfSource[]>([]);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      setError(null);
      const pdfs = accepted.filter(
        (f) =>
          f.type === "application/pdf" ||
          f.name.toLowerCase().endsWith(".pdf"),
      );
      if (messages.length > 0 && pdfs.length > 0) {
        const ok =
          typeof window !== "undefined"
            ? window.confirm(t("erpDash.notebook.confirmClearOnFiles"))
            : false;
        if (!ok) return;
        setMessages([]);
      }

      const next: PdfSource[] = [];
      for (const file of pdfs) {
        try {
          const base64 = await readFileAsBase64(file);
          next.push({
            id: randomId(),
            fileName: file.name,
            mimeType: "application/pdf",
            base64,
          });
        } catch {
          setError(t("erpDash.notebook.readError"));
        }
      }
      if (next.length) {
        setSources((prev) => [...prev, ...next].slice(0, 8));
      }
    },
    [messages.length, t],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 8,
    disabled: sending,
  });

  const removeSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
    if (messages.length > 0) {
      setMessages([]);
    }
  };

  const clearAll = () => {
    setSources([]);
    setMessages([]);
    setError(null);
    setInput("");
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (!geminiConfigured) {
      setError(t("erpDash.notebook.noGemini"));
      return;
    }

    const userMsg: ChatTurn = { role: "user", content: text };
    const nextThread = [...messages, userMsg];
    setMessages(nextThread);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const pdfsPayload = sources.map((s) => ({
        fileName: s.fileName,
        base64: s.base64,
        mimeType: s.mimeType,
      }));

      const res = await fetch("/api/erp/project-notebook/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextThread,
          pdfs: pdfsPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }
      const answer = String(data.answer ?? "");
      setMessages((m) => [...m, { role: "model", content: answer }]);
    } catch (e) {
      setMessages((m) => m.slice(0, -1));
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  };

  return (
    <div
      className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] shadow-lg"
      dir={dir}
    >
      <div className="border-b border-[color:var(--line)] px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <BookOpen className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-black text-[color:var(--ink-900)]">
                {t("erpDash.notebook.title")}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-[color:var(--ink-500)]">
                {t("erpDash.notebook.subtitle")}
              </p>
              <p className="mt-2 text-xs font-semibold text-[color:var(--ink-400)]">
                {t("erpDash.notebook.modelHint")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--line)] bg-white px-4 py-2 text-xs font-bold text-[color:var(--ink-700)] transition hover:bg-[color:var(--canvas-sunken)]"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {t("erpDash.notebook.clear")}
          </button>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-h-[420px] flex-col border-[color:var(--line)] lg:border-e">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[color:var(--line)] bg-white/60 px-5 py-10 text-center">
                <p className="text-sm font-bold text-[color:var(--ink-600)]">
                  {t("erpDash.notebook.emptyChat")}
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={`${i}-${m.role}`}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-[color:var(--ink-900)] text-white"
                        : "border border-[color:var(--line)] bg-white text-[color:var(--ink-900)]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))
            )}
            {sending ? (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[color:var(--ink-500)]">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t("erpDash.notebook.thinking")}
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          {error ? (
            <div className="mx-5 mb-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          <div className="border-t border-[color:var(--line)] p-4">
            <div className="flex gap-2">
              <label className="sr-only" htmlFor="notebook-input">
                {t("erpDash.notebook.inputLabel")}
              </label>
              <textarea
                id="notebook-input"
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={t("erpDash.notebook.placeholder")}
                disabled={sending || !geminiConfigured}
                className="min-h-[52px] flex-1 resize-none rounded-xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={sending || !input.trim() || !geminiConfigured}
                className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-40"
                aria-label={t("erpDash.notebook.send")}
              >
                <Send className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[color:var(--ink-400)]">
              {t("erpDash.notebook.footerHint")}
            </p>
          </div>
        </div>

        <aside className="flex flex-col gap-3 p-5">
          <p className="text-xs font-black uppercase tracking-wider text-[color:var(--ink-400)]">
            {t("erpDash.notebook.sourcesTitle")}
          </p>
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
              isDragActive
                ? "border-violet-400 bg-violet-50"
                : "border-[color:var(--line)] bg-white hover:border-violet-300"
            } ${sending ? "pointer-events-none opacity-50" : ""}`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto h-8 w-8 text-violet-500" aria-hidden />
            <p className="mt-2 text-sm font-bold text-[color:var(--ink-700)]">
              {t("erpDash.notebook.dropTitle")}
            </p>
            <p className="mt-1 text-xs text-[color:var(--ink-500)]">
              {t("erpDash.notebook.dropHint")}
            </p>
          </div>

          <ul className="max-h-[280px] space-y-2 overflow-y-auto">
            {sources.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-[color:var(--line)] bg-white px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
                  <span className="truncate text-xs font-semibold text-[color:var(--ink-800)]">
                    {s.fileName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSource(s.id)}
                  className="rounded-lg p-1 text-[color:var(--ink-400)] hover:bg-[color:var(--canvas-sunken)] hover:text-rose-600"
                  aria-label={t("erpDash.notebook.removeFile")}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>

          <p className="text-[11px] leading-relaxed text-[color:var(--ink-400)]">
            {t("erpDash.notebook.limitsHint")}
          </p>
        </aside>
      </div>
    </div>
  );
}
