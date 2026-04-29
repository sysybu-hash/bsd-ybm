"use client";

import { useEffect } from "react";
import { useAiHubPreviewOptional } from "@/components/documents/AiHubPreviewContext";

const TARGET_IDS = ["erp-multi-scanner", "ai-hub-notebook"] as const;

/** גלילה חלקה ולשונית פעילה כשנכנסים ל־/app/scan עם hash מתאים */
export default function AiHubScrollToHash() {
  const setHubTab = useAiHubPreviewOptional()?.setHubTab;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw || !TARGET_IDS.includes(raw as (typeof TARGET_IDS)[number])) return;

    if (raw === "erp-multi-scanner") setHubTab?.("scan");
    if (raw === "ai-hub-notebook") setHubTab?.("notebook");

    const t = window.setTimeout(() => {
      document.getElementById(raw)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [setHubTab]);

  return null;
}
