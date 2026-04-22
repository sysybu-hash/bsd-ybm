import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

/** תווית ארוכה/קצרה לפי נקודת שבירה sm — בלי JavaScript */
export function HeaderResponsiveLabel({ short: shortLabel, long: longLabel }: { short: string; long: string }) {
  return (
    <>
      <span className="sm:hidden">{shortLabel}</span>
      <span className="hidden sm:inline">{longLabel}</span>
    </>
  );
}

/** כותרת עמוד אחידה — «זכוכית קפואה» כמו Dock / Engineering Shell */
export default function WorkspacePageHeader({ eyebrow, title, subtitle, actions }: Props) {
  return (
    <header className="mb-6 flex min-h-[5.5rem] flex-col gap-y-6 gap-x-4 rounded-2xl border border-slate-200/10 bg-[color:var(--canvas-raised)]/78 px-4 py-5 shadow-xl backdrop-blur-xl backdrop-saturate-150 sm:min-h-[6.25rem] sm:flex-row sm:items-end sm:justify-between sm:gap-y-4 sm:px-6 sm:py-5">
      <div className="min-w-0 px-1 max-sm:pb-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-[color:var(--ink-900)] sm:text-4xl">{title}</h1>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--ink-500)]">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex min-h-[2.75rem] w-full min-w-0 shrink-0 flex-col items-stretch gap-4 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end sm:justify-end sm:gap-2 sm:gap-y-2 sm:pb-1">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
