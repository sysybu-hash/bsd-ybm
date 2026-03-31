import type { Metadata } from "next";

/**
 * כתובת הקנונית של האתר — חשוב לאימות דומיין, OG ו־sitemap.
 * בפרודקשן: הגדר NEXT_PUBLIC_SITE_URL (למשל https://www.bsd-ybm.co.il)
 */
export function getCanonicalSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.bsd-ybm.co.il"
  );
}

/** מטא־דאטה ראשית + אימותי דומיין ממשתני סביבה (בלי לשמור טוקנים בקוד). */
export function buildRootMetadata(): Metadata {
  const siteUrl = getCanonicalSiteUrl();
  const base = new URL(siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl);

  const verification: Metadata["verification"] = {};
  const g =
    process.env.SITE_VERIFICATION_GOOGLE?.trim() ||
    process.env.GOOGLE_SITE_VERIFICATION?.trim();
  const yahoo = process.env.SITE_VERIFICATION_YAHOO?.trim();
  const yandex = process.env.SITE_VERIFICATION_YANDEX?.trim();
  if (g) verification.google = g;
  if (yahoo) verification.yahoo = yahoo;
  if (yandex) verification.yandex = yandex;

  const other: Record<string, string> = {};
  const fb = process.env.SITE_VERIFICATION_FACEBOOK?.trim();
  if (fb) other["facebook-domain-verification"] = fb;
  const pinterest = process.env.SITE_VERIFICATION_PINTEREST?.trim();
  if (pinterest) other["p:domain_verify"] = pinterest;
  const customName = process.env.SITE_VERIFICATION_META_NAME?.trim();
  const customContent = process.env.SITE_VERIFICATION_META_CONTENT?.trim();
  if (customName && customContent) other[customName] = customContent;

  return {
    metadataBase: base,
    applicationName: "BSD-YBM Intelligence",
    title: "BSD-YBM - AI Solutions & Business Intelligence",
    description:
      "מערכת ניהול חכמה מבוססת AI לשיפור פריון העבודה, ERP ו-CRM מתקדם. פותח ע״י יוחנן בוקשפן.",
    keywords: [
      "AI",
      "ERP",
      "CRM",
      "Business Intelligence",
      "BSD-YBM",
      "יוחנן בוקשפן",
    ],
    authors: [{ name: "Yohanan Boqshpan", url: "https://bsd-ybm.co.il" }],

    openGraph: {
      title: "BSD-YBM - AI Solutions",
      description:
        "העתיד של הניהול העסקי כבר כאן. מערכת AI אחודה לניהול פיננסי ולקוחות.",
      url: base.href,
      siteName: "BSD-YBM Intelligence",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "BSD-YBM Intelligence Platform",
        },
      ],
      locale: "he_IL",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title: "BSD-YBM - AI Solutions",
      description: "מערכת ניהול חכמה מבוססת AI לשיפור פריון העבודה.",
      images: ["/og-image.png"],
    },

    manifest: "/manifest.json",
    alternates: {
      canonical: "/",
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "BSD-YBM",
    },
    icons: {
      icon: "/icon-192.png",
      apple: "/icon-192.png",
    },

    ...(Object.keys(verification).length ? { verification } : {}),
    ...(Object.keys(other).length ? { other } : {}),
  };
}
