import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function WorkspaceEngineeringShell({ children, className = "" }: Props) {
  return (
    <div
      className={`workspace-panel w-full min-w-0 space-y-6 rounded-[26px] border border-[color:var(--dash-line)] bg-[color:var(--dash-card)] p-4 shadow-[var(--dash-shadow)] sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}
