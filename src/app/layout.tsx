import type { Metadata, Viewport } from "next";
import { Assistant, Heebo, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo" });
const assistant = Assistant({ subsets: ["hebrew", "latin"], variable: "--font-assistant", weight: ["400", "600", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#001A4D",
  colorScheme: "light",
};

export const metadata: Metadata = {
  /** Production canonical (Phase 23 — Vercel / SEO). Runtime URLs still use `@/lib/site` in client code. */
  metadataBase: new URL("https://www.bsd-ybm.co.il"),
  title: "BSD-YBM AI Solutions | ניהול ובקרה חכמה לענף הבנייה",
  description:
    "מערכת הבינה המלאכותית של חיים אדלר לניהול פרויקטים, ניתוח גרמושקות ובקרת תקציב.",
  applicationName: "BSD-YBM AI Solutions",
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    title: "BSD-YBM AI Solutions",
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${assistant.variable} ${inter.variable}`}>
      <body className="min-h-dvh bg-[#FDFDFD] text-[#1a1a1a] antialiased [touch-action:manipulation]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}