"use client";

import { useEffect } from "react";

/** צבע מותג ברירת מחדל — מסונכרן ל־--primary-color ב־globals (בנייה B2B) */
const DEFAULT_COLOR = "#0d9488";
const APPROVED_COLORS = new Set([
  "#0d9488",
  "#0f766e",
  "#14b8a6",
  "#0f172a",
  "#0c4a6e",
  "#2563eb",
  "#10b981",
  "#7c3aed",
]);

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x)));
  return `#${[c(r), c(g), c(b)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** כהה יותר לכפתור hover / accent-strong */
function darkenHex(hex: string, ratio: number) {
  const p = parseHex(hex);
  if (!p) return hex;
  const k = 1 - ratio;
  return rgbToHex(p.r * k, p.g * k, p.b * k);
}

/** מסנכרן טוקני מותג (מיפוי ישן v2 + ציר לקוחות ב־Pro Bento) */
function applyBrandAccentFromHex(hex: string) {
  const p = parseHex(hex);
  if (!p) return;
  const soft = `rgba(${p.r}, ${p.g}, ${p.b}, 0.1)`;
  const strong = darkenHex(hex, 0.18);
  document.documentElement.style.setProperty("--v2-accent", hex);
  document.documentElement.style.setProperty("--v2-accent-soft", soft);
  document.documentElement.style.setProperty("--v2-accent-strong", strong);
  document.documentElement.style.setProperty("--axis-clients", hex);
  document.documentElement.style.setProperty("--axis-clients-soft", soft);
  document.documentElement.style.setProperty("--axis-clients-strong", strong);
}

/** מסנכרן --primary-color מ-localStorage (דפי נחיתה ללא תפריט נגישות) */
export default function Themer() {
  useEffect(() => {
    const applyTheme = (raw: string | null | undefined) => {
      const color = /^#[0-9A-Fa-f]{6}$/.test(raw ?? "") ? (raw as string).toLowerCase() : DEFAULT_COLOR;
      document.documentElement.style.setProperty("--primary-color", color);
      document.documentElement.style.setProperty("--header-color", color);
      document.documentElement.style.setProperty("--heading-color", color);
      applyBrandAccentFromHex(color);
    };

    const readAndApply = () => {
      const fromUser = localStorage.getItem("user-theme-color");
      const fromBsd = localStorage.getItem("bsd-theme-color");
      applyTheme(fromUser || fromBsd || DEFAULT_COLOR);
    };

    readAndApply();

    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === "user-theme-color" || e.key === "bsd-theme-color") {
        readAndApply();
      }
    };

    const onThemeEvent = () => readAndApply();

    window.addEventListener("storage", onStorage);
    window.addEventListener("bsd-theme-change", onThemeEvent as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bsd-theme-change", onThemeEvent as EventListener);
    };
  }, []);

  return null;
}
