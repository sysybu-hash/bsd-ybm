"use client";

import { useEffect } from "react";

const TARGET_ID = "erp-multi-scanner";

/** גלילה חלקה לאזור הסריקה כשנכנסים עם #erp-multi-scanner */
export default function ErpScrollToHash() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== `#${TARGET_ID}`) return;
    const t = window.setTimeout(() => {
      document.getElementById(TARGET_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(t);
  }, []);

  return null;
}
