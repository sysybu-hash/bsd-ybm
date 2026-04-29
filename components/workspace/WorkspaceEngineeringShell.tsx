import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/** מרווח אנכי בין בלוקים; הרוחב המרבי מגיע מ־MainContainer */
export default function WorkspaceEngineeringShell({ children, className = "" }: Props) {
  return (
    <div className={`cd-canvas w-full min-w-0 space-y-6 py-4 md:py-6 ${className}`}>{children}</div>
  );
}
