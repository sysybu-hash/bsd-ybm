import { Wallet } from "lucide-react";
import { getPlatformPayPalConfig } from "@/lib/platform-paypal";

/**
 * מוצג רק בדף אדמין (מפתחי פלטפורמה) — חשבון PayPal של הבעלים מה־ENV, לא של לקוחות.
 */
export default function PlatformPayPalOwnerCard() {
  const { merchantEmail, meSlug } = getPlatformPayPalConfig();
  const configured = Boolean(merchantEmail || meSlug);

  return (
    <section
      className={`mb-10 rounded-[2rem] border p-6 md:p-8 shadow-lg ${
        configured
          ? "border-[#0070ba]/40 bg-gradient-to-r from-[#0070ba]/8 to-sky-50/80"
          : "border-amber-200 bg-amber-50/40"
      }`}
      dir="rtl"
      aria-labelledby="platform-paypal-title"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0070ba] text-white shadow-md">
            <Wallet size={24} aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 id="platform-paypal-title" className="text-lg font-black text-slate-900">
              PayPal של מפעיל הפלטפורמה (רק אצלך)
            </h2>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              הפרטים כאן מגיעים מ־<code className="text-xs bg-white/80 px-1 rounded">.env</code> — לקבלת
              תשלומים <strong>אליך</strong> (מנויים, שירות וכו׳). זה <strong>לא</strong> מוצג ללקוחות
              הארגונים בדף המנויים שלהם; שם נשאר רק ה־PayPal שכל ארגון מגדיר בהגדרות.
            </p>
          </div>
        </div>
      </div>

      {configured ? (
        <div className="mt-5 flex flex-col gap-3 text-sm border-t border-[#0070ba]/20 pt-5">
          {merchantEmail ? (
            <p className="text-slate-700">
              <span className="font-bold text-slate-900">מייל: </span>
              <span className="font-mono" dir="ltr">
                {merchantEmail}
              </span>
            </p>
          ) : null}
          {meSlug ? (
            <p>
              <a
                href={`https://paypal.me/${encodeURIComponent(meSlug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0070ba] px-4 py-2.5 font-bold text-white hover:bg-[#005ea6]"
              >
                PayPal.Me / {meSlug}
              </a>
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-amber-900 font-medium">
          לא מוגדר בשרת. הוסיפו ב־Vercel / <code className="text-xs bg-white px-1 rounded">.env.local</code>:{" "}
          <code className="text-xs">PLATFORM_PAYPAL_MERCHANT_EMAIL</code> ו/או{" "}
          <code className="text-xs">PLATFORM_PAYPAL_ME_SLUG</code>.
        </p>
      )}
    </section>
  );
}
