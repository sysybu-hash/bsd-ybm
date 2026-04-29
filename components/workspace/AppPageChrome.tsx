"use client";

import type { ReactNode } from "react";
import { PageWrapper } from "@/lib/polish/standards";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * עטיפת מעבר סטנדרטית לכל דפי `/app` — מעל WorkspaceEngineeringShell וכו׳.
 * לכרטיס פרימיום נקודתי השתמשו ב־`PolishedPageSurface` מתוך `@/lib/polish/standards`.
 */
export default function AppPageChrome({ children, className = "" }: Props) {
  return <PageWrapper className={className}>{children}</PageWrapper>;
}
