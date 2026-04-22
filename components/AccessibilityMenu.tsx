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
import PortalToBody, { WORKSPACE_OVERLAY_Z_CLASS } from "@/components/portal/PortalToBody";
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

  const activeCount = [
    settings.highContrast,
    settings.focusRing,
    settings.reducedMotion,
    settings.lineSpacing,
    settings.bigCursor,
    settings.grayscale,
    settings.fontScale !== "default",
  ].filter(Boolean).length;

  return (
    <section
      className="w-full max-w-[min(100vw-1.5rem,28rem)] rounded-[28px] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-4 pb-6 shadow-[var(--tile-shadow-raised)] sm:p-5"
      dir="rtl"
      aria-label="סרגל נגישות"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--axis-ai-soft)] text-[color:var(--axis-ai)]">
              <Accessibility className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-black text-[color:var(--ink-900)]">נגישות חכמה</h2>
              <p className="mt-1 text-[12px] text-[color:var(--ink-500)]">
                התאמות קריאה, צבעים, פוקוס ותנועה לכל האתר.
              </p>
            </div>
          </div>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[color:var(--line)] bg-white text-[color:var(--ink-500)] transition hover:border-[color:var(--line-strong)] hover:text-[color:var(--ink-900)]"
            aria-label="סגירת סרגל הנגישות"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="mt-4 rounded-2xl border border-[color:var(--axis-ai-border)] bg-[color:var(--axis-ai-soft)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--axis-ai)]">Live Preview</p>
            <p className="mt-1 text-sm font-black text-[color:var(--ink-900)]">כך הקריאה תיראה</p>
            <p className="mt-1 text-[12px] leading-6 text-[color:var(--ink-600)]">
              טקסט מדגים ניגודיות, ריווח, פוקוס ותנועת מסך.
            </p>
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-[color:var(--axis-ai)]">
            {activeCount}/7 מותאם
          </div>
        </div>
        <div className="mt-4">
          <div className="h-2 rounded-full bg-white/60 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.round((activeCount / 7) * 100)}%`, background: "var(--progress-fill-ai)" }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-400)]">
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
                  className={`tile px-3 py-3 text-right transition ${active ? "border-[color:var(--axis-ai)] bg-[color:var(--axis-ai-soft)]" : ""}`}
                >
                  <span className="block text-sm font-black text-[color:var(--ink-900)]">{option.label}</span>
                  <span className="mt-1 block text-[11px] leading-5 text-[color:var(--ink-500)]">{option.summary}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-400)]">
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
                  className={`tile px-3 py-3 text-right transition ${active ? "border-[color:var(--axis-clients)] bg-[color:var(--axis-clients-soft)]" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{
                        background: active ? "var(--axis-clients)" : "var(--canvas-sunken)",
                        color: active ? "#fff" : "var(--ink-500)",
                      }}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black text-[color:var(--ink-900)]">{card.label}</span>
                      <span className="mt-1 block text-[11px] leading-5 text-[color:var(--ink-500)]">{card.summary}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-400)]">
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
                  className={`h-11 rounded-xl border-2 transition ${active ? "scale-[1.04] border-[color:var(--ink-900)] shadow-[var(--shadow-sm)]" : "border-white"}`}
                  style={{ backgroundColor: theme.color }}
                  aria-label={`בחירת צבע ${theme.label}`}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-4 py-3">
          <div>
            <p className="text-sm font-black text-[color:var(--ink-900)]">ההגדרות נשמרות לכל האתר</p>
            <p className="mt-1 text-[11px] text-[color:var(--ink-500)]">שמירה מקומית מיידית והחלה על כל המסכים.</p>
          </div>
          <button
            type="button"
            onClick={() => setSettings({ ...DEFAULT_ACCESSIBILITY_SETTINGS })}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[color:var(--line-strong)] bg-white px-4 py-2 text-sm font-black text-[color:var(--ink-700)] transition hover:border-[color:var(--ink-900)] hover:text-[color:var(--ink-900)]"
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
          className={`group flex h-12 w-12 items-center justify-center rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-600)] shadow-[var(--shadow-xs)] transition ${
            isOpen
              ? "border-[color:var(--axis-ai)] bg-[color:var(--axis-ai)] text-white"
              : "hover:border-[color:var(--line-strong)] hover:text-[color:var(--ink-900)]"
          }`}
          aria-label="פתיחת סרגל נגישות"
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
            ? `inline-flex h-12 w-12 touch-manipulation items-center justify-center rounded-xl border border-white/70 text-white shadow-[var(--tile-shadow-raised)] transition ${
                isOpen ? "bg-[color:var(--ink-900)]" : "bg-[color:var(--axis-ai)]"
              }`
            : `inline-flex h-14 w-14 touch-manipulation items-center justify-center rounded-2xl border border-white/70 text-white shadow-[0_20px_50px_-20px_rgba(109,81,209,0.65)] transition ${
                isOpen ? "bg-[color:var(--ink-900)]" : "bg-[color:var(--axis-ai)]"
              }`
        }
        aria-label="פתיחת סרגל נגישות"
      >
        {isOpen ? (
          <X className={compactFab ? "h-5 w-5" : "h-6 w-6"} aria-hidden />
        ) : (
          <Accessibility className={compactFab ? "h-5 w-5" : "h-6 w-6"} aria-hidden />
        )}
      </button>

      {isOpen ? (
        <PortalToBody>
        <div
          className={`fixed inset-0 ${WORKSPACE_OVERLAY_Z_CLASS} flex items-end justify-start bg-slate-950/30 p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] backdrop-blur-sm sm:items-center sm:justify-center sm:pb-4`}
          onClick={() => setIsOpen(false)}
        >
          <div onClick={(event) => event.stopPropagation()}>{panel}</div>
        </div>
        </PortalToBody>
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
