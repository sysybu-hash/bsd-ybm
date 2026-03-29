/**
 * PayPal של מפעיל הפלטפורמה בלבד — משתני סביבה.
 * נפרד מ־paypalMerchantEmail / paypalMeSlug של כל ארגון (לקוחות קצה).
 */
export type PlatformPayPalConfig = {
  merchantEmail: string | null;
  meSlug: string | null;
};

function normalizeMeSlug(raw: string): string {
  return raw
    .replace(/^https?:\/\/(www\.)?paypal\.me\//i, "")
    .replace(/^\/+|\/+$/g, "");
}

export function getPlatformPayPalConfig(): PlatformPayPalConfig {
  const merchantEmail = process.env.PLATFORM_PAYPAL_MERCHANT_EMAIL?.trim() || null;
  const slugRaw = process.env.PLATFORM_PAYPAL_ME_SLUG?.trim();
  const meSlug = slugRaw ? normalizeMeSlug(slugRaw) : null;
  return { merchantEmail, meSlug };
}

export function hasPlatformPayPalConfigured(): boolean {
  const c = getPlatformPayPalConfig();
  return Boolean(c.merchantEmail || c.meSlug);
}
