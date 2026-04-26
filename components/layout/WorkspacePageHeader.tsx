import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function HeaderResponsiveLabel({ short: shortLabel, long: longLabel }: { short: string; long: string }) {
  return (
    <>
      <span className="sm:hidden">{shortLabel}</span>
      <span className="hidden sm:inline">{longLabel}</span>
    </>
  );
}

export default function WorkspacePageHeader({ eyebrow, title, subtitle, actions }: Props) {
  return (
    <header className="workspace-window mb-5 flex min-h-[5rem] flex-col gap-y-5 gap-x-4 rounded-[26px] border border-[color:var(--dash-line)] bg-[color:var(--dash-card)] px-4 py-5 shadow-[var(--dash-shadow)] sm:flex-row sm:items-end sm:justify-between sm:gap-y-4 sm:px-5">
      <div className="min-w-0 px-1 max-sm:pb-2">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[color:var(--ops-indigo)]">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-[color:var(--ink-900)] sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--ink-500)]">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex min-h-[2.75rem] w-full min-w-0 shrink-0 flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end sm:justify-end sm:gap-2 sm:pb-1">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
