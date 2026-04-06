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
    <MarketingPublicShell title={t("contactPage.title")}>
      <p className="mb-8 text-lg leading-relaxed text-gray-500">{t("contactPage.intro")}</p>

      <ul
        className="card-avenue space-y-5 bg-white p-6 text-gray-700 shadow-sm"
        dir={dir}
      >
        <li>
          <span className="block text-xs font-bold uppercase tracking-wide text-indigo-300/90">
            {t("contactPage.addressLabel")}
          </span>
          <span className="mt-1 block text-base font-medium text-white">
            {t("marketingDrawer.contactAddress")}
          </span>
        </li>
        <li>
          <span className="block text-xs font-bold uppercase tracking-wide text-indigo-300/90">
            {t("contactPage.phoneLabel")}
          </span>
          <a
            href="tel:+972525640021"
            className="mt-1 block text-lg font-semibold text-indigo-300 hover:text-white underline-offset-2 hover:underline"
          >
            {t("marketingDrawer.contactPhone")}
          </a>
        </li>
        <li>
          <span className="block text-xs font-bold uppercase tracking-wide text-indigo-300/90">
            {t("contactPage.emailLabel")}
          </span>
          <a
            href="mailto:sysybu@gmail.com"
            className="mt-1 block text-lg font-semibold text-indigo-300 hover:text-white underline-offset-2 hover:underline"
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
