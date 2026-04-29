import type { ReactNode } from "react";
import { WORKSPACE_CONTENT_MAX_CLASS } from "@/lib/workspace-layout";

/** ריווח אופקי ואנכי אחיד לכל מסכי /app */
export const WORKSPACE_SECTION_GAP = "gap-6";

/** רשת 12 טורים — לשימוש בתוך עמודים (Master-Detail, Bento וכו') */
export function WorkspaceGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`grid grid-cols-12 ${WORKSPACE_SECTION_GAP} ${className}`}>{children}</div>;
}

/**
 * מעטפת תוכן ל־/app: רוחב מרבי אחיד (ה־padding האופקי כבר ב־AppShell על ה־main).
 */
export default function MainContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full min-w-0 ${WORKSPACE_CONTENT_MAX_CLASS} ${className}`}>
      {children}
    </div>
  );
}
