"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  parseStoredConsent,
  type CookieConsentState,
} from "@/lib/cookie-consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

function readAnalyticsAllowed(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  const c = parseStoredConsent(raw);
  return !!c?.analytics;
}

/**
 * Google Analytics 4 — נטען רק אחרי הסכמת אנליטיקה (באנר עוגיות).
 * הגדר NEXT_PUBLIC_GA_MEASUREMENT_ID ב-Vercel (למשל G-XXXXXXXXXX).
 */
export default function ConsentAwareAnalytics() {
  const [analyticsOk, setAnalyticsOk] = useState(false);

  useEffect(() => {
    const sync = (ev?: CustomEvent<CookieConsentState>) => {
      const allowed = ev?.detail?.analytics ?? readAnalyticsAllowed();
      setAnalyticsOk(allowed);
    };
    sync();
    const handler = (e: Event) => sync(e as CustomEvent<CookieConsentState>);
    window.addEventListener("bsd-cookie-consent-updated", handler);
    return () => window.removeEventListener("bsd-cookie-consent-updated", handler);
  }, []);

  if (!GA_ID || !analyticsOk) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="bsd-ga4-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
          });
        `}
      </Script>
    </>
  );
}
