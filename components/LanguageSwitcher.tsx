"use client";

import { COOKIE_LOCALE, SELECTABLE_LOCALES, LOCALE_LABELS, type AppLocale } from "@/lib/i18n/config";
import { useI18n } from "@/components/I18nProvider";
import { Globe } from "lucide-react";

type Props = {
  /** מחלקות CSS לערכת select */
  className?: string;
  /** תווית לפני הרשימה */
  showLabel?: boolean;
  /** רקע כהה (דף נחיתה / כותרת על תמונה) */
  tone?: "default" | "dark";
};

export default function LanguageSwitcher({ className, showLabel, tone = "default" }: Props) {
  const { locale, setLocale, t } = useI18n();

  const isDark = tone === "dark";
  const selectClass = isDark
    ? "rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium text-white min-w-[9rem] backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 [&>option]:bg-white [&>option]:text-slate-900"
    : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 min-w-[9rem]";

  return (
    <label className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Globe
        size={18}
        className={`shrink-0 ${isDark ? "text-white/80" : "opacity-70"}`}
        aria-hidden
      />
      {showLabel ? (
        <span
          className={`text-sm font-medium whitespace-nowrap ${isDark ? "text-white/90" : "text-slate-600"}`}
        >
          {t("language.label")}
        </span>
      ) : null}
      <select
        value={locale}
        onChange={(e) => void setLocale(e.target.value as AppLocale)}
        className={selectClass}
        aria-label={t("language.label")}
        name={COOKIE_LOCALE}
      >
        {SELECTABLE_LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
