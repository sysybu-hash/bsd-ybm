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
      className={`min-h-screen bg-gradient-to-b from-white via-gray-50 to-white text-white ${marketingSans.className}`}
      dir={dir}
    >
      <header className="border-b border-gray-200 bg-white shadow-sm shadow-gray-200/40">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-xl font-black italic tracking-tighter text-white"
          >
            BSD-<span className="text-indigo-400">YBM</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-bold text-indigo-400 hover:text-indigo-800"
          >
            {t("auth.home")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="mb-8 text-3xl font-black tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}
