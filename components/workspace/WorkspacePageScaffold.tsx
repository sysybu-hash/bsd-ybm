import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Axis = "finance" | "clients" | "ai" | "neutral";

const axisColorVar: Record<Axis, string> = {
  finance: "var(--axis-finance)",
  clients: "var(--axis-clients)",
  ai: "var(--axis-ai)",
  neutral: "var(--ink-900)",
};

const axisSoftVar: Record<Axis, string> = {
  finance: "var(--axis-finance-soft)",
  clients: "var(--axis-clients-soft)",
  ai: "var(--axis-ai-soft)",
  neutral: "var(--canvas-sunken)",
};

/**
 * Command Center page hero.
 * שורת eyebrow → כותרת ענקית → תיאור → פעולות. aside — כרטיסי סטטיסטיקה בצד.
 * נטו טיפוגרפיה, בלי glass, בלי gradients.
 */
export function WorkspacePageHero({
  eyebrow,
  title,
  description,
  actions,
  aside,
  axis = "neutral",
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  aside?: ReactNode;
  axis?: Axis;
}) {
  return (
    <section className="relative pb-6">
      <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <div>
          <span
            className="v2-eyebrow"
            style={axis === "neutral" ? undefined : { color: axisColorVar[axis], borderColor: "transparent", background: axisSoftVar[axis] }}
          >
            {eyebrow}
          </span>
          <h1 className="mt-4 text-[40px] leading-[1.05] font-black tracking-tight text-[color:var(--ink-900)] sm:text-[52px]">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--ink-500)] sm:text-[17px]">
            {description}
          </p>
          {actions ? <div className="mt-6 flex flex-wrap gap-2.5">{actions}</div> : null}
        </div>
        {aside ? <div className="grid gap-3 sm:grid-cols-2">{aside}</div> : null}
      </div>
    </section>
  );
}

/**
 * כרטיס סטטיסטיקה יחיד — שטוח, אקסנט לפי ציר.
 */
export function WorkspaceStatTile({
  label,
  value,
  icon: Icon,
  hint,
  axis = "neutral",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  axis?: Axis;
}) {
  const axisColor = axisColorVar[axis];
  const axisSoft = axisSoftVar[axis];
  return (
    <div className="holo-border-card flex flex-col gap-3 p-5" style={axis === "neutral" ? undefined : { borderInlineStartColor: axisColor, borderInlineStartWidth: 3 }}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[color:var(--ink-500)]">{label}</p>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: axisSoft, color: axisColor }}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="text-[26px] leading-none font-black tabular-nums tracking-tight text-[color:var(--ink-900)]">
        {value}
      </p>
      {hint ? <p className="mt-auto text-[12px] leading-relaxed text-[color:var(--ink-500)]">{hint}</p> : null}
    </div>
  );
}

/**
 * משטח תוכן — לבן נקי עם גבול דק, כותרת מעל, תוכן מתחת.
 */
export function WorkspaceSurface({
  title,
  description,
  actions,
  children,
  axis = "neutral",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  axis?: Axis;
}) {
  const axisColor = axisColorVar[axis];
  return (
    <section className="holo-border-card overflow-hidden" style={axis === "neutral" ? undefined : { borderInlineStartColor: axisColor, borderInlineStartWidth: 3 }}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--line-subtle)] px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-lg font-black tracking-tight text-[color:var(--ink-900)]">{title}</h2>
          {description ? (
            <p className="mt-1 text-[13px] leading-6 text-[color:var(--ink-500)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
