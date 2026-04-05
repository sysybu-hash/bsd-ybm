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
    <nav className="sticky top-0 z-[100] border-b border-gray-200 bg-white" dir={dir}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-xl font-black text-gray-900 transition hover:opacity-75">
          BSD<span className="text-gray-400">-YBM</span>
        </Link>

        <div className="hidden items-center gap-2 sm:flex">
          <LanguageSwitcher />
          <Link href="/login" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50">
            {t("nav.login")}
          </Link>
          <Link href="/register" className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-800">
            {t("nav.register")}
          </Link>
        </div>

        <button
          type="button"
          className="rounded-xl border border-gray-200 p-2 text-gray-700 sm:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 sm:hidden" dir={dir}>
          <div className="flex flex-col gap-3">
            <LanguageSwitcher />
            <Link href="/login" onClick={() => setIsOpen(false)} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700">
              {t("nav.login")}
            </Link>
            <Link href="/register" onClick={() => setIsOpen(false)} className="rounded-xl bg-gray-900 px-4 py-3 text-center text-sm font-bold text-white">
              {t("nav.register")}
            </Link>
            <Link href="/dashboard" onClick={() => setIsOpen(false)} className="rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-bold text-gray-600">
              {t("nav.dashboard")}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
