"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Accessibility,
  AlignJustify,
  Contrast,
  Eye,
  Focus,
  MousePointer2,
  Palette,
  RotateCcw,
  Type,
  Waves,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ACCESSIBILITY_THEME_OPTIONS,
  applyAccessibilitySettings,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  readStoredAccessibilitySettings,
  type AccessibilityFontScale,
  type AccessibilitySettings,
  writeStoredAccessibilitySettings,
} from "@/lib/accessibility-settings";

type AccessibilityMenuProps = {
  dock?: boolean;
  panelOnly?: boolean;
  /** כפתור צף קטן יותר — מתאים לדפי שיווק ציבוריים */
  compactFab?: boolean;
  onClose?: () => void;
};

type ToggleCard = {
  id: keyof AccessibilitySettings;
  label: string;
  summary: string;
  icon: LucideIcon;
};

const TOGGLE_CARDS: ToggleCard[] = [
  {
    id: "highContrast",
    label: "ניגודיות גבוהה",
    summary: "מחדד צבעים וטקסט לקריאות טובה יותר.",
    icon: Contrast,
  },
  {
    id: "focusRing",
    label: "סימון פוקוס",
    summary: "מבליט את האלמנט הפעיל בניווט מקלדת.",
    icon: Focus,
  },
  {
    id: "reducedMotion",
    label: "הפחתת תנועה",
    summary: "מקטין אנימציות ומעברים מיותרים.",
    icon: Waves,
  },
  {
    id: "lineSpacing",
    label: "ריווח טקסט",
    summary: "מוסיף מרווח בין שורות לקריאה רגועה יותר.",
    icon: AlignJustify,
  },
  {
    id: "bigCursor",
    label: "סמן מוגדל",
    summary: "מגדיל את הסמן לאזורים אינטראקטיביים.",
    icon: MousePointer2,
  },
  {
    id: "grayscale",
    label: "גווני אפור",
    summary: "מפחית עומס צבע ומסייע לריכוז.",
    icon: Eye,
  },
];

function AccessibilityPanel({
  settings,
  setSettings,
  onClose,
}: {
  settings: AccessibilitySettings;
  setSettings: Dispatch<SetStateAction<AccessibilitySettings>>;
  onClose?: () => void;
}) {
  const fontOptions = useMemo<
    Array<{ id: AccessibilityFontScale; label: string; summary: string }>
  >(
    () => [
      { id: "default", label: "רגיל", summary: "גודל טקסט ברירת מחדל." },
      { id: "large", label: "גדול", summary: "טקסט מעט גדול יותר." },
      { id: "xlarge", label: "גדול מאוד", summary: "טקסט מודגש לקריאות מקסימלית." },
    ],
    [],
  );

  return (
    <section
      className="w-[min(100vw-2rem,24rem)] rounded-[30px] border border-[color:var(--v2-line)] bg-white/96 p-5 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.38)] backdrop-blur-xl"
      dir="rtl"
      aria-label="סרגל נגישות"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
              <Accessibility className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900">סרגל גישות</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                שליטה אחת קבועה על קריאות, צבעים ומיקוד בכל האתר.
              </p>
            </div>
          </div>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="סגירת סרגל הגישות"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
            <Type className="h-4 w-4" aria-hidden />
            גודל טקסט
          </div>

          <div className="grid grid-cols-3 gap-2">
            {fontOptions.map((option) => {
              const active = settings.fontScale === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSettings((current) => ({ ...current, fontScale: option.id }))}
                  className={`rounded-2xl border px-3 py-3 text-right transition ${
                    active
                      ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <span className="block text-sm font-black">{option.label}</span>
                  <span className="mt-1 block text-[11px] leading-5 text-slate-500">
                    {option.summary}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
            <Accessibility className="h-4 w-4" aria-hidden />
            התאמות קריאה
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {TOGGLE_CARDS.map((card) => {
              const active = Boolean(settings[card.id]);
              const Icon = card.icon;

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      [card.id]: !current[card.id],
                    }))
                  }
                  className={`rounded-2xl border px-3 py-3 text-right transition ${
                    active
                      ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent-soft)]"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${
                        active
                          ? "bg-[color:var(--v2-accent)] text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black text-slate-900">{card.label}</span>
                      <span className="mt-1 block text-[11px] leading-5 text-slate-500">
                        {card.summary}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
            <Palette className="h-4 w-4" aria-hidden />
            צבע מוביל
          </div>

          <div className="grid grid-cols-6 gap-2">
            {ACCESSIBILITY_THEME_OPTIONS.map((theme) => {
              const active = settings.themeColor === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSettings((current) => ({ ...current, themeColor: theme.id }))}
                  title={theme.label}
                  className={`h-10 rounded-2xl border-2 transition ${
                    active ? "scale-[1.04] border-slate-900 shadow-lg" : "border-white"
                  }`}
                  style={{ backgroundColor: theme.color }}
                  aria-label={`בחירת צבע ${theme.label}`}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-black text-slate-900">ההגדרות נשמרות לכל האתר</p>
            <p className="mt-1 text-[11px] text-slate-500">
              השינויים נשמרים מקומית וממשיכים גם בין דפים ומסכים.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSettings({ ...DEFAULT_ACCESSIBILITY_SETTINGS })}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            איפוס
          </button>
        </div>
      </div>
    </section>
  );
}

export default function AccessibilityMenu({
  dock = false,
  panelOnly = false,
  compactFab = false,
  onClose,
}: AccessibilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY_SETTINGS);

  useEffect(() => {
    const nextSettings = readStoredAccessibilitySettings();
    setSettings(nextSettings);
    applyAccessibilitySettings(nextSettings);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyAccessibilitySettings(settings);
    writeStoredAccessibilitySettings(settings);
  }, [hydrated, settings]);

  const panel = (
    <AccessibilityPanel
      settings={settings}
      setSettings={setSettings}
      onClose={onClose ?? (panelOnly ? undefined : () => setIsOpen(false))}
    />
  );

  if (panelOnly) {
    return panel;
  }

  if (dock) {
    return (
      <div className="relative" dir="rtl">
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className={`group flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition ${
            isOpen
              ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent)] text-white"
              : "hover:border-slate-300 hover:text-slate-900"
          }`}
          aria-label="פתיחת סרגל גישות"
        >
          <Accessibility className="h-5 w-5 transition group-hover:scale-110" aria-hidden />
        </button>

        {isOpen ? <div className="absolute left-16 top-0 z-[350]">{panel}</div> : null}
      </div>
    );
  }

  return (
    <div
      className={`fixed z-[320] ${
        compactFab
          ? "bottom-[max(1rem,env(safe-area-inset-bottom,0px))] left-[max(1rem,env(safe-area-inset-left,0px))] sm:bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:left-[max(1.25rem,env(safe-area-inset-left,0px))]"
          : "bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] left-[max(1.5rem,env(safe-area-inset-left,0px))]"
      }`}
      dir="rtl"
    >
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={
          compactFab
            ? `inline-flex h-12 w-12 touch-manipulation items-center justify-center rounded-2xl border-2 border-white text-white shadow-lg transition ${
                isOpen ? "bg-slate-900" : "bg-[color:var(--primary-brand)]"
              }`
            : `inline-flex h-14 w-14 touch-manipulation items-center justify-center rounded-full border-4 border-white text-white shadow-2xl transition ${
                isOpen ? "bg-slate-900" : "bg-[color:var(--primary-brand)]"
              }`
        }
        aria-label="פתיחת סרגל גישות"
      >
        {isOpen ? (
          <X className={compactFab ? "h-5 w-5" : "h-6 w-6"} aria-hidden />
        ) : (
          <Accessibility className={compactFab ? "h-5 w-5" : "h-6 w-6"} aria-hidden />
        )}
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[340] flex items-end justify-start bg-slate-950/30 p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] backdrop-blur-sm sm:items-center sm:justify-center sm:pb-4"
          onClick={() => setIsOpen(false)}
        >
          <div onClick={(event) => event.stopPropagation()}>{panel}</div>
        </div>
      ) : null}
    </div>
  );
}

export function AccessibilitySettingsBootstrap() {
  useEffect(() => {
    applyAccessibilitySettings(readStoredAccessibilitySettings());
  }, []);

  return null;
}
