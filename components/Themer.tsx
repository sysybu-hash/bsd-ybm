"use client";

import { useEffect } from "react";

/** מסנכרן --primary-color מ-localStorage (דפי נחיתה ללא תפריט נגישות) */
export default function Themer() {
  useEffect(() => {
    const applyTheme = (raw: string | null | undefined) => {
      const color = /^#[0-9A-Fa-f]{6}$/.test(raw ?? "") ? (raw as string) : "#3b82f6";
      document.documentElement.style.setProperty("--primary-color", color);
      document.documentElement.style.setProperty("--heading-color", color);
    };

    const readAndApply = () => {
      const fromUser = localStorage.getItem("user-theme-color");
      const fromBsd = localStorage.getItem("bsd-theme-color");
      applyTheme(fromUser || fromBsd || "#3b82f6");
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
