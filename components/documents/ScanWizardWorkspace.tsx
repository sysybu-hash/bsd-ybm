"use client";

import { ArrowRight, Bot, FileUp, Sparkles } from "lucide-react";
import Link from "next/link";
import ErpMultiEngineScannerLazy from "@/components/erp/ErpMultiEngineScannerLazy";
import type { IndustryProfile } from "@/lib/professions/runtime";

type Props = Readonly<{
  industryProfile: IndustryProfile;
}>;

export default function ScanWizardWorkspace({ industryProfile }: Props) {
  return (
    <section
      className="flex h-[calc(100dvh-112px)] min-h-[620px] w-full min-w-0 flex-col overflow-hidden rounded-[28px] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] shadow-[var(--cd-shadow)]"
      dir="rtl"
    >
      <header className="shrink-0 border-b border-[color:var(--line)] bg-[color:var(--canvas-raised)]/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--ink-900)] text-white">
              <FileUp className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--ink-400)]">
                Scan Wizard
              </p>
              <h1 className="truncate text-xl font-black tracking-[-0.03em] text-[color:var(--ink-900)]">
                אשף סריקה ופענוח חכם
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
          {[
            { icon: FileUp, text: "בחר קובץ" },
            { icon: Bot, text: "כתוב הנחיה למנועים" },
            { icon: Sparkles, text: "הפעל פענוח ושמור" },
          ].map(({ icon: Icon, text }) => (
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
        <ErpMultiEngineScannerLazy industry={industryProfile.id} compactHeader dockWizard />
      </div>
    </section>
  );
}
