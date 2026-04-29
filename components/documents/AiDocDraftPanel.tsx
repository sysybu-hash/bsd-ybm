"use client";

import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { Surface } from "@/components/ui/claude";

/** מחולל טקסט-לטיוטת מסמך דרך API מאובטח */
export default function AiDocDraftPanel() {
  const { t, dir } = useI18n();
  const [brief, setBrief] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const text = brief.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/doc-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: text }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || t("workspaceAiHub.docDraftError"));
      }
      setResult(data.text?.trim() || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Surface className="!p-5">
      <div dir={dir}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          <Wand2 className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-[color:var(--cd-ink)]">{t("workspaceAiHub.docDraftTitle")}</p>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--cd-ink-mute)]">{t("workspaceAiHub.docDraftHint")}</p>
        </div>
      </div>

      <label className="mt-4 block text-xs font-bold text-[color:var(--cd-ink-mute)]" htmlFor="ai-doc-draft-brief">
        {t("workspaceAiHub.docDraftLabel")}
      </label>
      <textarea
        id="ai-doc-draft-brief"
        rows={4}
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        disabled={loading}
        placeholder={t("workspaceAiHub.docDraftPlaceholder")}
        className="mt-1 w-full resize-none rounded-xl border border-[color:var(--cd-line)] bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 disabled:opacity-50"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={loading || !brief.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Wand2 className="h-4 w-4" aria-hidden />}
          {t("workspaceAiHub.docDraftSubmit")}
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-xl border border-[color:var(--cd-line)] bg-[color:var(--cd-bg-sunken)] p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-[color:var(--cd-ink-mute)]">
            {t("workspaceAiHub.docDraftResultLabel")}
          </p>
          <pre className="mt-2 max-h-[min(360px,50vh)] overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--cd-ink)]">
            {result}
          </pre>
        </div>
      ) : null}
      </div>
    </Surface>
  );
}
