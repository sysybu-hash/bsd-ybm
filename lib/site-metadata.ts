import type { Metadata } from "next";

export function getCanonicalSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.bsd-ybm.co.il";
}

export function buildRootMetadata(): Metadata {
  const siteUrl = getCanonicalSiteUrl();
  const base = new URL(siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl);

  const verification: Metadata["verification"] = {};
  const googleVerification =
    process.env.SITE_VERIFICATION_GOOGLE?.trim() ||
    process.env.GOOGLE_SITE_VERIFICATION?.trim();
  const yahooVerification = process.env.SITE_VERIFICATION_YAHOO?.trim();
  const yandexVerification = process.env.SITE_VERIFICATION_YANDEX?.trim();

  if (googleVerification) verification.google = googleVerification;
  if (yahooVerification) verification.yahoo = yahooVerification;
  if (yandexVerification) verification.yandex = yandexVerification;

  const other: Record<string, string> = {};
  const facebookVerification = process.env.SITE_VERIFICATION_FACEBOOK?.trim();
  const pinterestVerification = process.env.SITE_VERIFICATION_PINTEREST?.trim();
  const customMetaName = process.env.SITE_VERIFICATION_META_NAME?.trim();
  const customMetaContent = process.env.SITE_VERIFICATION_META_CONTENT?.trim();

  if (facebookVerification) other["facebook-domain-verification"] = facebookVerification;
  if (pinterestVerification) other["p:domain_verify"] = pinterestVerification;
  if (customMetaName && customMetaContent) other[customMetaName] = customMetaContent;

  return {
    metadataBase: base,
    applicationName: "BSD-YBM",
    title: {
      default: "BSD-YBM | מערכת תפעול חכמה לעסקים מקצועיים",
      template: "%s | BSD-YBM",
    },
    description:
      "BSD-YBM מחברת לקוחות, מסמכים, חיוב, בקרה תפעולית ו-AI בתוך מערכת עבודה אחת לעסקים מקצועיים בישראל.",
    keywords: [
      "BSD-YBM",
      "CRM",
      "ERP",
      "AI",
      "מסמכים חכמים",
      "חיוב וגבייה",
      "תפעול עסקי",
    ],
    authors: [{ name: "BSD-YBM", url: base.href }],
    openGraph: {
      title: "BSD-YBM | מערכת תפעול חכמה לעסקים מקצועיים",
      description:
        "לקוחות, מסמכים, חיוב, בקרה ו-AI במקום אחד. BSD-YBM בנויה לעסקים שרוצים לנהל עבודה מתוך תמונת מצב אחת.",
      url: base.href,
      siteName: "BSD-YBM",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "BSD-YBM operational intelligence platform",
        },
      ],
      locale: "he_IL",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "BSD-YBM | מערכת תפעול חכמה לעסקים מקצועיים",
      description:
        "לקוחות, מסמכים, חיוב, בקרה ו-AI במקום אחד לעסקים שרוצים שליטה אמיתית על העבודה.",
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
