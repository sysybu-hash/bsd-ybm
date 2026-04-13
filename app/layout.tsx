import type { Metadata, Viewport } from "next";
import { Assistant, Heebo } from "next/font/google";
import "./globals.css";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import Themer from "@/components/Themer";
import CookieConsentWall from "@/components/CookieConsentWall";
import { I18nProvider } from "@/components/I18nProvider";
import { AccessibilitySettingsBootstrap } from "@/components/AccessibilityMenu";
import { COOKIE_LOCALE, normalizeLocale, isRtlLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/load-messages";
import { buildRootMetadata } from "@/lib/site-metadata";
import GlobalFloatingChrome from "@/components/GlobalFloatingChrome";
import SiteWizardChrome from "@/components/wizard/SiteWizardChrome";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  display: "swap",
  adjustFontFallback: true,
  variable: "--font-heebo",
});

const assistant = Assistant({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  adjustFontFallback: true,
  variable: "--font-assistant",
});

export const metadata: Metadata = buildRootMetadata();

/** סשן משתמש — חייב להתעדכן בכל בקשה; אחרת RSC עלול להציג משתמש קודם ב-SessionProvider */
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /** לא נועלים זום — נגישות ותאימות iOS/Android */
  maximumScale: 5,
  viewportFit: "cover",
  /** מקלדת צפה: התאמת גובה תוכן (Chrome/Android ועוד) */
  interactiveWidget: "resizes-content",
  colorScheme: "light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#f8fafc" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  noStore();
  const session = await getServerSession(authOptions);
  const jar = await cookies();
  const locale = normalizeLocale(jar.get(COOKIE_LOCALE)?.value);
  const messages = getMessages(locale);
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";
  const htmlLang = locale;

  return (
    <html
      lang={htmlLang}
      dir={dir}
      className={`${heebo.variable} ${assistant.variable}`}
      suppressHydrationWarning
    >
      <body className={`${heebo.className} antialiased font-sans`}>
        <SessionProvider session={session} sessionKey={session?.user?.id ?? session?.user?.email ?? null}>
          <I18nProvider locale={locale} messages={messages}>
            <Themer />
            <AccessibilitySettingsBootstrap />
            <SiteWizardChrome>{children}</SiteWizardChrome>
            <GlobalFloatingChrome />
            <CookieConsentWall />
          </I18nProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
