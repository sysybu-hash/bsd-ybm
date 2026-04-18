"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t, dir } = useI18n();

  return (
    <footer className="relative z-10 border-t border-gray-200 bg-gray-50 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] sm:py-12" dir={dir}>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 text-center sm:px-6 md:grid-cols-3 md:gap-12 md:text-start">
        <div className="space-y-4">
          <h3 className="text-xl font-black italic tracking-tighter text-gray-900">
            BSD-YBM. <span className="text-[var(--primary-color)]">Intelligence.</span>
          </h3>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-gray-500 md:mx-0">{t("siteFooter.lead")}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm sm:gap-8">
          <div className="space-y-3">
            <h4 className="mb-3 font-bold text-gray-900">{t("siteFooter.navSystem")}</h4>
            <Link
              href="/app/documents/erp"
              className="block text-gray-500 transition-colors hover:text-[var(--primary-color)]"
            >
              {t("siteFooter.linkErp")}
            </Link>
            <Link
              href="/app/clients"
              className="block text-gray-500 transition-colors hover:text-[var(--primary-color)]"
            >
              {t("siteFooter.linkCrm")}
            </Link>
          </div>
          <div className="space-y-3">
            <h4 className="mb-3 font-bold text-gray-900">{t("siteFooter.navInfo")}</h4>
            <Link href="/legal" className="block text-gray-500 transition-colors hover:text-[var(--primary-color)]">
              {t("siteFooter.linkLegal")}
            </Link>
            <Link href="/terms" className="block text-gray-500 transition-colors hover:text-[var(--primary-color)]">
              {t("siteFooter.linkTerms")}
            </Link>
            <Link href="/privacy" className="block text-gray-500 transition-colors hover:text-[var(--primary-color)]">
              {t("siteFooter.linkPrivacy")}
            </Link>
            <Link href="/legal/gdpr" className="block text-gray-500 transition-colors hover:text-[var(--primary-color)]">
              {t("siteFooter.linkGdpr")}
            </Link>
            <Link href="/tutorial" className="block text-gray-500 transition-colors hover:text-[var(--primary-color)]">
              {t("siteFooter.linkTutorial")}
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center text-xs italic text-gray-500 md:items-end">
          <div>
            © {currentYear} {t("siteFooter.copyright")}
          </div>
          <div className="mt-1 font-medium not-italic text-gray-700">{t("siteFooter.credit")}</div>
        </div>
      </div>
    </footer>
  );
}
