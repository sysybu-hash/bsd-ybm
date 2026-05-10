"use client";

import { useEffect } from "react";
import { CheckCircle2, FileText, RotateCcw } from "lucide-react";
import type { SaveTarget } from "@/components/scan/state/scan-machine";
import type { ScanWizardProfile } from "@/lib/professions/scan-wizard";

type Props = {
  profile: ScanWizardProfile;
  saveTarget: SaveTarget | null;
  savedDocumentId: string | null;
  onAnother: () => void;
  onOpenNotebook?: () => void;
};

export default function StepDone({ profile, saveTarget, savedDocumentId, onAnother, onOpenNotebook }: Props) {
  // אנימציית קונפטי קטנה בעת כניסה לשלב done.
  useEffect(() => {
    let cancelled = false;
    void import("canvas-confetti").then((mod) => {
      if (cancelled) return;
      mod.default({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.4 },
        scalar: 0.9,
        ticks: 120,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const targetLabel = saveTarget === "ERP" ? profile.saveTargetLabels.ERP : profile.saveTargetLabels.CRM;
  const targetHref = saveTarget === "ERP" ? "/app/erp" : "/app/crm";

  return (
    <div className="grid gap-4">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-emerald-200 bg-emerald-50/60 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-[0_12px_28px_-12px_rgba(16,185,129,0.6)]">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </div>
        <h2 className="text-2xl font-black text-emerald-900">המסמך נשמר בהצלחה</h2>
        <p className="text-sm font-semibold text-emerald-800">
          {targetLabel}
          {savedDocumentId ? ` · מזהה ${savedDocumentId.slice(0, 8)}…` : ""}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <a
          href={targetHref}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[color:var(--scanw-line)] bg-white/80 px-4 py-3 text-sm font-black text-[color:var(--scanw-ink)] transition hover:border-[color:var(--scanw-accent-muted)]"
        >
          <FileText className="h-4 w-4 text-[color:var(--scanw-accent)]" aria-hidden />
          פתח את הרשומה
        </a>
        {onOpenNotebook ? (
          <button
            type="button"
            onClick={onOpenNotebook}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[color:var(--scanw-line)] bg-white/80 px-4 py-3 text-sm font-black text-[color:var(--scanw-ink)] transition hover:border-[color:var(--scanw-accent-muted)]"
          >
            <FileText className="h-4 w-4 text-[color:var(--scanw-accent)]" aria-hidden />
            המשך ב-NotebookLM
          </button>
        ) : null}
        <button
          type="button"
          onClick={onAnother}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--scanw-accent)] px-4 py-3 text-sm font-black text-white transition hover:brightness-110"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          סרוק מסמך נוסף
        </button>
      </div>
    </div>
  );
}
