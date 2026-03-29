import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import Themer from "@/components/Themer";
import CookieConsentWall from "@/components/CookieConsentWall";
import { I18nProvider } from "@/components/I18nProvider";
import { COOKIE_LOCALE, normalizeLocale, isRtlLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/load-messages";
import { buildRootMetadata } from "@/lib/site-metadata";
import GlobalFloatingChrome from "@/components/GlobalFloatingChrome";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = buildRootMetadata();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /** לא נועלים זום — נגישות ותאימות iOS/Android */
  maximumScale: 5,
  viewportFit: "cover",
  /** מקלדת צפה: התאמת גובה תוכן (Chrome/Android ועוד) */
  interactiveWidget: "resizes-content",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const jar = await cookies();
  const locale = normalizeLocale(jar.get(COOKIE_LOCALE)?.value);
  const messages = getMessages(locale);
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";
  const htmlLang = locale;

  return (
    <html lang={htmlLang} dir={dir} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <SessionProvider session={session}>
          <I18nProvider locale={locale} messages={messages}>
            <Themer />
            {children}
            <GlobalFloatingChrome />
            <CookieConsentWall />
          </I18nProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
