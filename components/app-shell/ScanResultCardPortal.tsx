"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ScanResultCard from "@/components/app-shell/ScanResultCard";
import type { ScanSyncSummary } from "@/lib/scan-sync-summary";

export const SCAN_COMPLETE_EVENT = "bsd-ybm:scan-complete";

export type ScanCompleteEventDetail = {
  documentId: string;
  /** אופציונלי: מיקור — ERP/CRM */
  target?: "ERP" | "CRM";
};

type Props = {
  /** קולבק לשליחת prompt חופשי לאסיסטנט (Gemini Live / טקסט). */
  onAskAi?: (prompt: string) => void;
};

/** משדר אירוע סיום סריקה לכל מאזין בעמוד (כרטיס סיכום, telemetry וכו'). */
export function dispatchScanComplete(detail: ScanCompleteEventDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SCAN_COMPLETE_EVENT, { detail }));
}

export default function ScanResultCardPortal({ onAskAi }: Props) {
  const [summary, setSummary] = useState<ScanSyncSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handler = async (event: Event) => {
      const detail = (event as CustomEvent<ScanCompleteEventDetail>).detail;
      if (!detail?.documentId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/scan/sync-summary?documentId=${encodeURIComponent(detail.documentId)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { summary?: ScanSyncSummary };
        if (data.summary) setSummary(data.summary);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    window.addEventListener(SCAN_COMPLETE_EVENT, handler);
    return () => window.removeEventListener(SCAN_COMPLETE_EVENT, handler);
  }, []);

  const close = useCallback(() => setSummary(null), []);

  if (!mounted) return null;
  if (!summary && !loading) return null;

  return createPortal(
    <div
      className="fixed z-[9970] bottom-[max(1rem,env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-[min(100vw-1.5rem,28rem)]"
      role="status"
      aria-live="polite"
    >
      {summary ? (
        <ScanResultCard summary={summary} onClose={close} onAskAi={onAskAi} />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-black text-slate-600 shadow-xl">
          טוען סיכום סריקה…
        </div>
      )}
    </div>,
    document.body,
  );
}
