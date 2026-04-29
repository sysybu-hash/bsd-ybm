import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/claude";

type Props = Readonly<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  dir?: "rtl" | "ltr";
}>;

/**
 * מסגרת תוכן אחידה לעמודי מרחב עבודה: כותרת בסגנון דף הבית + ילדים בריווח אחיד.
 */
export default function WorkspacePageFrame({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  dir = "rtl",
}: Props) {
  return (
    <div className="cd-canvas w-full min-w-0 py-4 md:py-6" dir={dir}>
      <div className="space-y-10">
        <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} actions={actions} />
        {children}
      </div>
    </div>
  );
}
