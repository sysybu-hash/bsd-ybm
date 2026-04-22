"use client";

import { useId } from "react";
import { useI18n } from "@/components/I18nProvider";
import { LOCALE_LABELS, SELECTABLE_LOCALES, type AppLocale } from "@/lib/i18n/config";

type Props = Readonly<{
  ariaLabel: string;
}>;

/**
 * בורר שפה לסרגל העליון — שמות שפה מלאים בתפריט נפתח.
 */
export default function WorkspaceLocaleSwitcher({ ariaLabel }: Props) {
  const { locale, setLocale } = useI18n();
  const id = useId();

  return (
    <div className="relative min-w-0">
      <label htmlFor={id} className="sr-only">
        {ariaLabel}
      </label>
      <select
        id={id}
        value={locale}
        onChange={(event) => void setLocale(event.target.value as AppLocale)}
        className="max-w-[11rem] cursor-pointer appearance-none rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-sunken)] py-2 pe-8 ps-3 text-left text-[12px] font-bold text-[color:var(--ink-900)] shadow-sm outline-none transition hover:border-[color:var(--line-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--v2-accent)]"
        aria-label={ariaLabel}
      >
        {SELECTABLE_LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[color:var(--ink-500)]"
        aria-hidden
      >
        ▼
      </span>
    </div>
  );
}
