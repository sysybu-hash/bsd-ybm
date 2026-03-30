"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useI18n } from "@/components/I18nProvider";
import { marketingSans } from "@/lib/fonts/marketing-fonts";

type Props = {
  children: ReactNode;
  title: string;
};

export default function MarketingPublicShell({ children, title }: Props) {
  const { t, dir } = useI18n();

  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-white via-slate-50 to-white text-slate-900 ${marketingSans.className}`}
      dir={dir}
    >
      <header className="border-b border-slate-200 bg-white/90 shadow-sm shadow-slate-200/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-xl font-black italic tracking-tighter text-slate-900"
          >
            BSD-<span className="text-blue-600">YBM</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-bold text-amber-800 hover:text-amber-700"
          >
            {t("auth.home")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="mb-8 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}
