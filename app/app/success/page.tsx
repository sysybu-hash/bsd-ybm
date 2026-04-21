"use client";

import { useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react";
import { BentoGrid, Tile, TileHeader } from "@/components/ui/bento";

export default function AppSuccessPage() {
  useEffect(() => {
    confetti({
      particleCount: 140,
      spread: 72,
      origin: { y: 0.6 },
      colors: ["#c1592f", "#f0b17c", "#f8e5d1"],
    });
  }, []);

  return (
    <div className="mx-auto max-w-[1200px] py-8 space-y-6" dir="rtl">
      <header className="flex flex-col items-center text-center gap-2 px-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[color:var(--axis-clients-soft)] text-[color:var(--state-success)] shadow-[var(--tile-shadow-raised)]">
          <CheckCircle2 className="h-10 w-10" aria-hidden />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">Payment Completed</p>
        <h1 className="text-[34px] font-black tracking-tight text-[color:var(--ink-900)] sm:text-[42px]">
          המסלול הופעל והמערכת מוכנה לעבודה.
        </h1>
        <p className="max-w-2xl text-[14px] leading-6 text-[color:var(--ink-500)]">
          התשלום הושלם, סביבת העבודה עודכנה, ואפשר להמשיך ישר למסמכים, לחיוב או למסך הבית החדש.
        </p>
      </header>

      <BentoGrid>
        {[
          "המנוי עודכן במערכת.",
          "הגישה לחלונות העבודה נשמרה.",
          "המסך החדש ב־/app מוכן להמשך.",
        ].map((item) => (
          <Tile key={item} tone="mint" span={4}>
            <TileHeader eyebrow="Status" />
            <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-900)]">{item}</p>
          </Tile>
        ))}

        <Tile tone="neutral" span={12}>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/app/documents" className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--ink-900)] px-4 py-2 text-sm font-black text-white">
              פתח מסמכים
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/app/billing" className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--line-strong)] bg-white px-4 py-2 text-sm font-black text-[color:var(--ink-700)] hover:bg-[color:var(--ink-900)] hover:text-white">
              פתח חיוב
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/app" className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--axis-ai-border)] bg-[color:var(--axis-ai-soft)] px-4 py-2 text-sm font-black text-[color:var(--axis-ai-ink)] hover:bg-[color:var(--axis-ai)] hover:text-white">
              חזרה לבית
              <Sparkles className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Tile>
      </BentoGrid>
    </div>
  );
}
