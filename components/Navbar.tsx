"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X, LogIn, LayoutDashboard, Brain, FileText, Users } from "lucide-react";
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
      className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 font-sans"
      dir={dir}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        <Link
          href="/"
          className="text-3xl font-black italic tracking-tighter transition-colors hover:opacity-90"
          style={{ color: "var(--primary-color, #3b82f6)" }}
          onClick={() => setIsOpen(false)}
        >
          BSD-YBM<span className="text-slate-900">.</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {mainLinks.map((link) => (
            <Link
              key={link.nameKey}
              href={link.href}
              className="text-slate-600 hover:text-slate-950 font-medium text-sm transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <LanguageSwitcher className="shrink-0 max-sm:[&_select]:min-w-[7rem]" />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="landing-nav-flyout"
            className="bg-slate-100 text-slate-700 p-3 rounded-xl hover:bg-blue-50/80 transition-colors flex items-center gap-2 font-bold text-sm"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
            {isOpen ? t("nav.close") : t("nav.menu")}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="landing-nav-flyout"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full inset-x-0 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 w-full md:w-[600px] bg-white shadow-2xl shadow-blue-500/10 border-b md:border md:rounded-b-[2rem] border-slate-100 p-8 z-[101]"
            dir={dir}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4">
                  {t("nav.quickNav")}
                </h3>
                {mainLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.nameKey}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                    >
                      <div className="p-3 bg-blue-50 rounded-xl group-hover:scale-110 transition-transform">
                        <Icon style={{ color: "var(--primary-color, #3b82f6)" }} size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-950 text-sm">{link.name}</p>
                        <p className="text-slate-500 text-xs">{link.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 text-center">
                <LayoutDashboard className="mx-auto text-blue-500 mb-2" size={32} />
                <h3 className="font-black text-xl italic text-slate-950">{t("nav.userArea")}</h3>
                <p className="text-slate-500 text-sm">{t("nav.userAreaDesc")}</p>
                <div className="flex flex-col gap-3 pt-2">
                  <LanguageSwitcher showLabel className="justify-center" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl text-sm font-bold transition-all shadow-xl shadow-blue-600/20"
                  >
                    <LogIn size={18} /> {t("nav.login")}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 p-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500"
                  >
                    {t("nav.register")}
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-950 p-3 rounded-xl text-sm font-bold border border-slate-200 transition-all"
                  >
                    {t("nav.dashboard")}
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
