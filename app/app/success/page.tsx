"use client";

import { useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react";

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
    <div className="grid min-h-[75vh] place-items-center py-8" dir="rtl">
      <section className="v2-panel v2-panel-soft w-full max-w-3xl overflow-hidden p-8 text-center sm:p-10">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)] shadow-[0_25px_70px_-40px_rgba(193,89,47,0.7)]">
          <CheckCircle2 className="h-12 w-12" aria-hidden />
        </div>

        <div className="mt-6">
          <span className="v2-eyebrow">Payment Completed</span>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-5xl">
            המסלול הופעל והמערכת מוכנה לעבודה.
          </h1>
          <p className="mt-4 text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">
            התשלום הושלם, סביבת העבודה עודכנה, ואפשר להמשיך ישר למסמכים, לחיוב או למסך הבית החדש.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            "המנוי עודכן במערכת.",
            "הגישה לחלונות העבודה נשמרה.",
            "המסך החדש ב־/app מוכן להמשך.",
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-white/82 px-4 py-4">
              <p className="text-sm leading-7 text-[color:var(--v2-ink)]">{item}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/app/documents" className="v2-button v2-button-primary">
            פתח מסמכים
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/app/billing" className="v2-button v2-button-secondary">
            פתח חיוב
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/app" className="v2-button v2-button-secondary">
            חזרה לבית
            <Sparkles className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
