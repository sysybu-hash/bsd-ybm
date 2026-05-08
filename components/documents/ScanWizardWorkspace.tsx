"use client";

import { useState } from "react";
import { ArrowRight, BookOpen, Bot, FileUp, ScanLine, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ErpMultiEngineScannerLazy from "@/components/erp/ErpMultiEngineScannerLazy";
import ErpProjectNotebook from "@/components/erp/ErpProjectNotebook";
import ScanBoard from "@/components/scan/ScanBoard";
import type { IndustryProfile } from "@/lib/professions/runtime";

type Props = Readonly<{
  industryProfile: IndustryProfile;
  geminiConfigured: boolean;
}>;

export default function ScanWizardWorkspace({ industryProfile, geminiConfigured }: Props) {
  const [mode, setMode] = useState<"scan" | "notebook">("scan");
  const searchParams = useSearchParams();
  const useNewScanBoard = searchParams?.get("scanboard") === "1";

  const chips =
    mode === "scan"
      ? [
          { icon: FileUp, text: "בחר קובץ" },
          { icon: Bot, text: "כתוב הנחיה למנועים" },
          { icon: Sparkles, text: "הפעל פענוח ושמור" },
        ]
      : [
          { icon: FileUp, text: "הוסף מקורות" },
          { icon: BookOpen, text: "שאל את המקורות" },
          { icon: Sparkles, text: "צור Studio: סיכום, FAQ, תדריך ועוד" },
        ];

  return (
    <section
      className="flex h-[calc(100dvh-112px)] min-h-[620px] w-full min-w-0 flex-col overflow-hidden rounded-[28px] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] shadow-[var(--cd-shadow)]"
      dir="rtl"
    >
      <header className="shrink-0 border-b border-[color:var(--line)] bg-[color:var(--canvas-raised)]/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--ink-900)] text-white">
              {mode === "scan" ? <FileUp className="h-5 w-5" aria-hidden /> : <BookOpen className="h-5 w-5" aria-hidden />}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--ink-400)]">
                {mode === "scan" ? "Scan Wizard" : "NotebookLM"}
              </p>
              <h1 className="truncate text-xl font-black text-[color:var(--ink-900)]">
                {mode === "scan" ? "אשף סריקה ופענוח חכם" : "מחברת מקורות, תובנות וציטוטים"}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] p-1">
              <button
                type="button"
                onClick={() => setMode("scan")}
                className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-black transition ${
                  mode === "scan" ? "bg-white text-[color:var(--ink-900)] shadow-sm" : "text-[color:var(--ink-500)] hover:text-[color:var(--ink-900)]"
                }`}
              >
                <ScanLine className="h-4 w-4" aria-hidden />
                סריקה
              </button>
              <button
                type="button"
                onClick={() => setMode("notebook")}
                className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-black transition ${
                  mode === "notebook" ? "bg-white text-[color:var(--ink-900)] shadow-sm" : "text-[color:var(--ink-500)] hover:text-[color:var(--ink-900)]"
                }`}
              >
                <BookOpen className="h-4 w-4" aria-hidden />
                NotebookLM
              </button>
            </div>
            <span className="hidden rounded-full border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-3 py-1.5 text-xs font-black text-[color:var(--ink-600)] sm:inline-flex">
              {industryProfile.industryLabel}
            </span>
            <Link
              href="/app"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-700)] hover:bg-[color:var(--canvas-sunken)]"
              aria-label="חזרה"
              title="חזרה"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {chips.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 rounded-2xl bg-[color:var(--canvas-sunken)] px-3 py-2 text-xs font-black text-[color:var(--ink-700)]"
            >
              <Icon className="h-4 w-4 text-[color:var(--axis-ai)]" aria-hidden />
              <span className="truncate">{text}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden p-3">
        {mode === "scan" ? (
          useNewScanBoard ? (
            <div className="h-full overflow-y-auto p-2">
              <ScanBoard compact />
            </div>
          ) : (
            <ErpMultiEngineScannerLazy industry={industryProfile.id} compactHeader dockWizard />
          )
        ) : (
          <ErpProjectNotebook geminiConfigured={geminiConfigured} embedInHub embedCompact />
        )}
      </div>
    </section>
  );
}
