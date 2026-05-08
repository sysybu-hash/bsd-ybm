"use client";

import { useEffect, useState } from "react";

export const OPEN_SCANNER_EVENT = "bsd-ybm:open-scanner";
export const PRELOAD_SCAN_FILES_EVENT = "bsd-ybm:scan-files-preload";

export type PreloadScanFilesDetail = { files: File[] };

/** משדר ל-Dock אירוע "פתח את הסורק עכשיו". */
export function dispatchOpenScanner(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_SCANNER_EVENT));
}

/** משדר רשימת קבצים שהסורק יטען מראש כשייפתח (מתאים לגרירה גלובלית). */
export function dispatchPreloadScanFiles(files: File[]): void {
  if (typeof window === "undefined" || files.length === 0) return;
  window.dispatchEvent(new CustomEvent<PreloadScanFilesDetail>(PRELOAD_SCAN_FILES_EVENT, { detail: { files } }));
}

const VOICE_TRIGGER_PATTERNS = [/\bסרוק\b/, /\bלסרוק\b/, /\bהסריקה\b/, /\bscan\b/i, /\binvoice\b/i, /\bחשבונית\b/];

/** קולט transcript מ-Gemini Live ומחליט אם יש פקודה לפתוח סורק. */
export function transcriptRequestsScanner(transcript: string): boolean {
  const text = transcript.trim().slice(0, 200);
  if (!text) return false;
  return VOICE_TRIGGER_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Hook ל-WorkspaceUtilityDock:
 * - גרירת קובץ לכל מקום בדשבורד פותחת את הסורק וטוענת אליו את הקובץ.
 * - פקודת קול ("סרוק חשבונית") פותחת את הסורק (קולט הקלטה מהדוק).
 *
 * מחזיר flag להצגת overlay ויזואלי בזמן גרירה.
 */
export function useGlobalScanTriggers(opts: { onOpenScanner: () => void; enabled: boolean }): {
  isDraggingOverWindow: boolean;
} {
  const [isDraggingOverWindow, setIsDraggingOverWindow] = useState(false);

  useEffect(() => {
    if (!opts.enabled) return;

    let dragDepth = 0;

    const containsFiles = (event: DragEvent): boolean => {
      const types = event.dataTransfer?.types;
      if (!types) return false;
      for (let i = 0; i < types.length; i++) {
        if (types[i] === "Files") return true;
      }
      return false;
    };

    const onDragEnter = (event: DragEvent) => {
      if (!containsFiles(event)) return;
      dragDepth++;
      if (dragDepth === 1) setIsDraggingOverWindow(true);
    };
    const onDragLeave = (event: DragEvent) => {
      if (!containsFiles(event)) return;
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) setIsDraggingOverWindow(false);
    };
    const onDragOver = (event: DragEvent) => {
      if (!containsFiles(event)) return;
      event.preventDefault();
    };
    const onDrop = (event: DragEvent) => {
      if (!containsFiles(event)) return;
      event.preventDefault();
      dragDepth = 0;
      setIsDraggingOverWindow(false);
      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length === 0) return;
      opts.onOpenScanner();
      dispatchPreloadScanFiles(files);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);

    const onOpenScannerEvent = () => opts.onOpenScanner();
    window.addEventListener(OPEN_SCANNER_EVENT, onOpenScannerEvent);

    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener(OPEN_SCANNER_EVENT, onOpenScannerEvent);
    };
  }, [opts]);

  return { isDraggingOverWindow };
}
