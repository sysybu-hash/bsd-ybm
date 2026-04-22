"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";

/**
 * מעל WorkspaceUtilityDock (שכבות עד ~9950).
 * שימוש: מודאלים / פלטות מלאות מסך כדי שלא יישבו מתחת לדוק וכדי לצאת מעטיפות עם filter/transform.
 */
export const WORKSPACE_OVERLAY_Z_CLASS = "z-[10060]";
export const WORKSPACE_OVERLAY_TOOLBAR_Z_CLASS = "z-[10061]";

type Props = Readonly<{ children: ReactNode }>;

export default function PortalToBody({ children }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
