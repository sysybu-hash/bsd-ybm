"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import MarketingPublicShell from "@/components/marketing/MarketingPublicShell";
import { useI18n } from "@/components/I18nProvider";

const WHATSAPP_HREF =
  "https://wa.me/972525640021?text=%D7%A9%D7%9C%D7%95%D7%9D%2C%20%D7%90%D7%A0%D7%99%20%D7%A4%D7%95%D7%A0%D7%94%20%D7%9E%D7%91%D7%A8%D7%A7%20%D7%99%D7%91%D7%9D";

export default function ContactPageClient() {
  const { t, dir } = useI18n();

  return (
    <MarketingPublicShell
      title={t("contactPage.title")}
      eyebrow={t("publicShell.navContact")}
      description={t("contactPage.shellDescription")}
    >
      <p className="mb-8 text-lg leading-8 text-[color:var(--ink-500)]">{t("contactPage.intro")}</p>

      <ul
        className="tile space-y-5 p-6 text-[color:var(--ink-900)]"
        dir={dir}
      >
        <li>
          <span className="block text-xs font-bold uppercase tracking-wide text-[color:var(--ink-500)]">
            {t("contactPage.addressLabel")}
          </span>
          <span className="mt-1 block text-base font-medium text-[color:var(--ink-900)]">
            {t("marketingDrawer.contactAddress")}
          </span>
        </li>
        <li>
          <span className="block text-xs font-bold uppercase tracking-wide text-[color:var(--ink-500)]">
            {t("contactPage.phoneLabel")}
          </span>
          <a
            href="tel:+972525640021"
            className="mt-1 block text-lg font-semibold text-[color:var(--axis-clients)] underline-offset-2 transition hover:underline"
          >
            {t("marketingDrawer.contactPhone")}
          </a>
        </li>
        <li>
          <span className="block text-xs font-bold uppercase tracking-wide text-[color:var(--ink-500)]">
            {t("contactPage.emailLabel")}
          </span>
          <a
            href="mailto:sysybu@gmail.com"
            className="mt-1 block text-lg font-semibold text-[color:var(--axis-clients)] underline-offset-2 transition hover:underline"
          >
            {t("marketingDrawer.contactEmail")}
          </a>
        </li>
      </ul>

      <Link
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-4 text-base font-black text-white shadow-sm transition hover:brightness-110"
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
        {t("marketingDrawer.whatsappQuick")}
      </Link>
    </MarketingPublicShell>
  );
}
