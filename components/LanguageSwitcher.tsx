"use client";

import { COOKIE_LOCALE, SELECTABLE_LOCALES, LOCALE_LABELS, type AppLocale } from "@/lib/i18n/config";
import { useI18n } from "@/components/I18nProvider";
import { Globe } from "lucide-react";

type Props = {
  /** מחלקות CSS לערכת select */
  className?: string;
  /** תווית לפני הרשימה */
  showLabel?: boolean;
};

export default function LanguageSwitcher({ className, showLabel }: Props) {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Globe size={18} className="shrink-0 opacity-70" aria-hidden />
      {showLabel ? (
        <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
          {t("language.label")}
        </span>
      ) : null}
      <select
        value={locale}
        onChange={(e) => void setLocale(e.target.value as AppLocale)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 min-w-[9rem]"
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
