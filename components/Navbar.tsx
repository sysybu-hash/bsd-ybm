"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { t, dir } = useI18n();

  return (
    <nav className="sticky top-0 z-[100] border-b border-white/[0.07] bg-white/95 backdrop-blur-sm" dir={dir}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white text-sm font-black shadow-sm shadow-indigo-600/30">
            B
          </div>
          <span className="text-lg font-black text-white">
            BSD<span className="text-indigo-500">-YBM</span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 sm:flex">
          <LanguageSwitcher />
          <Link href="/login" className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm font-bold text-white/65 transition hover:border-indigo-500/30 hover:bg-indigo-500/15 hover:text-indigo-300">
            {t("nav.login")}
          </Link>
          <Link href="/register" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-indigo-600/25 transition hover:bg-indigo-700">
            {t("nav.register")}
          </Link>
        </div>

        <button
          type="button"
          className="rounded-xl border border-white/[0.08] p-2 text-white/65 transition hover:bg-white/[0.03] sm:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-white/[0.07] bg-[#0a0b14] px-4 py-4 sm:hidden" dir={dir}>
          <div className="flex flex-col gap-2.5">
            <LanguageSwitcher />
            <Link href="/login" onClick={() => setIsOpen(false)} className="rounded-xl border border-white/[0.08] px-4 py-3 text-sm font-bold text-white/65 transition hover:bg-white/[0.03]">
              {t("nav.login")}
            </Link>
            <Link href="/register" onClick={() => setIsOpen(false)} className="rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-bold text-white shadow-sm">
              {t("nav.register")}
            </Link>
            <Link href="/dashboard" onClick={() => setIsOpen(false)} className="rounded-xl border border-white/[0.08] px-4 py-3 text-center text-sm font-bold text-white/55 transition hover:bg-white/[0.03]">
              {t("nav.dashboard")}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
