"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Menu,
  X,
  LogIn,
  LayoutDashboard,
  Brain,
  FileText,
  Users,
  ChevronDown,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type LinkDef = {
  nameKey: string;
  descKey: string;
  icon: typeof Brain;
  href: string;
};

const mainLinkDefs: LinkDef[] = [
  { nameKey: "nav.solutions", descKey: "nav.solutionsDesc", icon: Brain, href: "#ai-solutions" },
  { nameKey: "nav.erp", descKey: "nav.erpDesc", icon: FileText, href: "#erp" },
  { nameKey: "nav.crm", descKey: "nav.crmDesc", icon: Users, href: "#crm" },
  { nameKey: "nav.tutorial", descKey: "nav.tutorialDesc", icon: LayoutDashboard, href: "/tutorial" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { t, dir } = useI18n();

  const mainLinks = useMemo(
    () =>
      mainLinkDefs.map((d) => ({
        ...d,
        name: t(d.nameKey),
        desc: t(d.descKey),
      })),
    [t],
  );

  return (
    <nav
      className="sticky top-0 z-[100] border-b border-slate-200/80 bg-white/95 backdrop-blur-xl font-sans"
      dir={dir}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* לוגו */}
        <Link
          href="/"
          className="text-2xl font-black italic tracking-tighter transition hover:opacity-85"
          style={{ color: "var(--primary-color, #2563eb)" }}
          onClick={() => setIsOpen(false)}
        >
          BSD-<span className="text-slate-900">YBM</span>
        </Link>

        {/* ניווט מרכזי — desktop */}
        <div className="hidden items-center gap-6 md:flex">
          {mainLinks.map((link) => (
            <Link
              key={link.nameKey}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* כפתורי ימין */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher className="shrink-0" />
          <Link
            href="/login"
            className="hidden items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 sm:inline-flex"
          >
            <LogIn size={15} /> {t("nav.login")}
          </Link>
          <Link
            href="/register"
            className="hidden rounded-xl px-4 py-2 text-sm font-black text-white shadow-sm transition hover:opacity-90 sm:inline-block"
            style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
          >
            {t("nav.register")}
          </Link>

          {/* תפריט — mobile / mega menu */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="landing-nav-flyout"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
            <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mega menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="landing-nav-flyout"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 top-full z-[101] border-b border-slate-200 bg-white shadow-xl shadow-slate-200/50"
            dir={dir}
          >
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto]">
                {/* קישורים */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {mainLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.nameKey}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="group flex items-center gap-4 rounded-2xl border border-transparent p-4 transition hover:border-blue-100 hover:bg-blue-50/60"
                      >
                        <div className="shrink-0 rounded-xl bg-blue-50 p-2.5 transition group-hover:bg-blue-100">
                          <Icon size={18} style={{ color: "var(--primary-color, #2563eb)" }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm">{link.name}</p>
                          <p className="text-xs text-slate-500 truncate">{link.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* כרטיס כניסה */}
                <div className="min-w-[220px] rounded-2xl border border-blue-100 bg-blue-50/60 p-5 text-center space-y-3">
                  <LayoutDashboard size={28} className="mx-auto text-blue-500" />
                  <h3 className="font-black text-slate-900 text-base">{t("nav.userArea")}</h3>
                  <p className="text-xs text-slate-500">{t("nav.userAreaDesc")}</p>
                  <LanguageSwitcher showLabel className="justify-center" />
                  <div className="flex flex-col gap-2 pt-1">
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                      style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
                    >
                      <LogIn size={16} /> {t("nav.login")}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
                    >
                      {t("nav.register")}
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      {t("nav.dashboard")}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
