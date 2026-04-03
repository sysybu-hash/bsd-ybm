"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, FileText, Users } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18nOptional } from "@/components/I18nProvider";

export default function WizardHome() {
  const i18n = useI18nOptional();
  const t = i18n?.t ?? ((key: string) => key.split(".").pop() || key);
  const dir = i18n?.dir ?? "rtl";

  const entryPoints = [
    {
      titleKey: "home.crm.title",
      textKey: "home.crm.desc",
      href: "/dashboard/crm",
      icon: Users,
    },
    {
      titleKey: "home.invoice.title",
      textKey: "home.invoice.desc",
      href: "/dashboard/erp/invoice",
      icon: FileText,
    },
    {
      titleKey: "home.help.title",
      textKey: "home.help.desc",
      href: "/dashboard/help",
      icon: BookOpen,
    },
  ];

  return (
    <div className={"min-h-screen bg-white"} dir={dir}>
      <div className={"mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"}>
        {/* Header with language switcher */}
        <div className={"mb-12 flex items-center justify-between"}>
          <div>
            <h1 className={"text-3xl font-black text-slate-900"}>
              BSD<span className={"text-slate-500"}>-YBM</span>
            </h1>
            <p className={"mt-1 text-sm text-slate-500"}>Platform</p>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Hero section */}
        <section className={"mb-16 space-y-6"}>
          <div className={"space-y-4"}>
            <p className={"inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700"}>
              {t("home.badge")}
            </p>
            <h2 className={"max-w-4xl text-5xl font-black leading-tight text-slate-900 sm:text-6xl"}>
              {t("home.title")}
            </h2>
            <p className={"max-w-3xl text-lg leading-8 text-slate-600"}>
              {t("home.description")}
            </p>
          </div>

          <div className={"flex flex-wrap gap-3"}>
            <Link
              href={"/register"}
              className={"inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"}
            >
              {t("home.signup")}
              <ArrowRight size={16} />
            </Link>
            <Link
              href={"/login"}
              className={"inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"}
            >
              {t("home.login")}
            </Link>
          </div>
        </section>

        {/* Feature cards */}
        <section className={"mb-16"}>
          <div className={"grid gap-5 md:grid-cols-3"}>
            {entryPoints.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.titleKey}
                  href={item.href}
                  className={"group rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md"}
                >
                  <div className={"flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition group-hover:bg-slate-200"}>
                    <Icon size={20} />
                  </div>
                  <h3 className={"mt-4 text-lg font-black text-slate-900"}>
                    {t(item.titleKey)}
                  </h3>
                  <p className={"mt-2 text-sm leading-6 text-slate-600"}>
                    {t(item.textKey)}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Info section */}
        <section className={"rounded-[2rem] border border-slate-200 bg-slate-50 p-8"}>
          <h3 className={"text-2xl font-black text-slate-900"}>
            {t("home.whatChanged.title")}
          </h3>
          <div className={"mt-6 grid gap-6 md:grid-cols-3"}>
            <div>
              <p className={"text-sm font-bold text-slate-700"}>
                {t("home.whatChanged.pt1.title")}
              </p>
              <p className={"mt-2 text-sm leading-6 text-slate-600"}>
                {t("home.whatChanged.pt1.desc")}
              </p>
            </div>
            <div>
              <p className={"text-sm font-bold text-slate-700"}>
                {t("home.whatChanged.pt2.title")}
              </p>
              <p className={"mt-2 text-sm leading-6 text-slate-600"}>
                {t("home.whatChanged.pt2.desc")}
              </p>
            </div>
            <div>
              <p className={"text-sm font-bold text-slate-700"}>
                {t("home.whatChanged.pt3.title")}
              </p>
              <p className={"mt-2 text-sm leading-6 text-slate-600"}>
                {t("home.whatChanged.pt3.desc")}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
