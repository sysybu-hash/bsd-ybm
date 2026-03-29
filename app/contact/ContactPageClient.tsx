"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import MarketingPublicShell from "@/components/marketing/MarketingPublicShell";
import { useI18n } from "@/components/I18nProvider";

const WHATSAPP_HREF =
  "https://wa.me/972525640021?text=%D7%A9%D7%9C%D7%95%D7%9D%2C%20%D7%90%D7%A0%D7%99%20%D7%A4%D7%95%D7%A0%D7%94%20%D7%9E%D7%91%D7%A8%D7%A7%20%D7%99%D7%91%D7%9D";

export default function ContactPageClient() {
  const { t } = useI18n();

  return (
    <MarketingPublicShell title={t("contactPage.title")}>
      <p className="mb-8 text-lg text-slate-300/95">{t("contactPage.intro")}</p>

      <ul className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-200 backdrop-blur-sm">
        <li>
          <span className="block text-xs font-bold uppercase tracking-wide text-amber-200/80">
            {t("contactPage.addressLabel")}
          </span>
          <span className="mt-1 block text-base">
            {t("marketingDrawer.contactAddress")}
          </span>
        </li>
        <li>
          <span className="block text-xs font-bold uppercase tracking-wide text-amber-200/80">
            {t("contactPage.phoneLabel")}
          </span>
          <a
            href="tel:+972525640021"
            className="mt-1 block text-lg font-semibold text-white hover:text-amber-200"
          >
            {t("marketingDrawer.contactPhone")}
          </a>
        </li>
        <li>
          <span className="block text-xs font-bold uppercase tracking-wide text-amber-200/80">
            {t("contactPage.emailLabel")}
          </span>
          <a
            href="mailto:sysybu@gmail.com"
            className="mt-1 block text-lg font-semibold text-sky-300 hover:text-sky-200"
          >
            {t("marketingDrawer.contactEmail")}
          </a>
        </li>
      </ul>

      <Link
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-4 text-base font-black text-white shadow-xl shadow-green-900/30 transition hover:brightness-110"
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
        {t("marketingDrawer.whatsappQuick")}
      </Link>
    </MarketingPublicShell>
  );
}
