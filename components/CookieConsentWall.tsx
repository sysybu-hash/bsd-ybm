"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Settings2, X } from "lucide-react";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  OPEN_COOKIE_SETTINGS_EVENT,
  type CookieConsentState,
  dispatchConsentUpdated,
  parseStoredConsent,
} from "@/lib/cookie-consent";
import { useI18n } from "@/components/I18nProvider";

function defaultState(): CookieConsentState {
  return {
    version: 1,
    necessary: true,
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString(),
  };
}

export default function CookieConsentWall() {
  const { t, dir } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [hadConsentOnOpen, setHadConsentOnOpen] = useState(false);
  const [draft, setDraft] = useState<CookieConsentState>(() => defaultState());

  const refreshHadConsent = useCallback(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) : null;
    setHadConsentOnOpen(!!parseStoredConsent(raw));
  }, []);

  const persist = useCallback((next: CookieConsentState) => {
    try {
      localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
    dispatchConsentUpdated(next);
    setVisible(false);
    setCustomOpen(false);
    setHadConsentOnOpen(true);
  }, []);

  useEffect(() => {
    setMounted(true);
    refreshHadConsent();
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    const existing = parseStoredConsent(raw);
    if (!existing) {
      setVisible(true);
      setDraft(defaultState());
    }
  }, [refreshHadConsent]);

  useEffect(() => {
    const onOpen = () => {
      refreshHadConsent();
      const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
      const existing = parseStoredConsent(raw) ?? defaultState();
      setDraft(existing);
      setCustomOpen(false);
      setVisible(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
  }, [refreshHadConsent]);

  if (!mounted || !visible) return null;

  const acceptAll = () => {
    persist({
      ...defaultState(),
      analytics: true,
      marketing: true,
      updatedAt: new Date().toISOString(),
    });
  };

  const essentialOnly = () => {
    persist({
      ...defaultState(),
      analytics: false,
      marketing: false,
      updatedAt: new Date().toISOString(),
    });
  };

  const saveCustom = () => {
    persist({ ...draft, updatedAt: new Date().toISOString() });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[240] bg-gray-200/55 backdrop-blur-[2px]"
        aria-hidden="true"
      />
      <div
        className="fixed inset-x-0 bottom-0 z-[250] border-t border-gray-200 bg-white shadow-[0_-12px_40px_rgba(15,23,42,0.12)]"
        dir={dir}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-wall-title"
      >
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-[var(--primary-color)]">
                <Cookie size={22} aria-hidden />
              </div>
              <div>
                <h2 id="cookie-wall-title" className="text-lg font-black text-gray-900">
                  {t("cookie.wallTitle")}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  {t("cookie.wallBody")}{" "}
                  <Link href="/privacy" className="font-medium text-[var(--primary-color)] underline-offset-2 hover:underline">
                    {t("cookie.privacy")}
                  </Link>
                  {" · "}
                  <Link
                    href="/legal/cookies"
                    className="font-medium text-[var(--primary-color)] underline-offset-2 hover:underline"
                  >
                    {t("cookie.cookiesPolicy")}
                  </Link>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (hadConsentOnOpen) {
                  setVisible(false);
                  setCustomOpen(false);
                } else {
                  essentialOnly();
                }
              }}
              className="self-start rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label={hadConsentOnOpen ? t("cookie.ariaClose") : t("cookie.ariaReject")}
            >
              <X size={20} />
            </button>
          </div>

          {customOpen ? (
            <div className="mt-5 space-y-3 rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-gray-800">{t("cookie.necessary")}</span>
                <span className="text-xs font-medium text-gray-500">{t("cookie.necessaryNote")}</span>
              </div>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm">
                <span className="text-sm text-gray-700">{t("cookie.analytics")}</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300"
                  checked={draft.analytics}
                  onChange={(e) => setDraft((d) => ({ ...d, analytics: e.target.checked }))}
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm">
                <span className="text-sm text-gray-700">{t("cookie.marketing")}</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300"
                  checked={draft.marketing}
                  onChange={(e) => setDraft((d) => ({ ...d, marketing: e.target.checked }))}
                />
              </label>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              type="button"
              onClick={() => setCustomOpen((v) => !v)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
            >
              <Settings2 size={18} aria-hidden />
              {customOpen ? t("cookie.customizeClose") : t("cookie.customize")}
            </button>
            <button
              type="button"
              onClick={essentialOnly}
              className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
            >
              {t("cookie.essentialOnly")}
            </button>
            {customOpen ? (
              <button
                type="button"
                onClick={saveCustom}
                className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                {t("cookie.savePrefs")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={acceptAll}
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--primary-color)] px-4 py-3 text-sm font-black text-white shadow-lg shadow-indigo-600/25 transition hover:opacity-95"
            >
              {t("cookie.acceptAll")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
