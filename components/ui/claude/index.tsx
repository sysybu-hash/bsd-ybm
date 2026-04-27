import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-[color:var(--cd-line)] pb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="cd-eyebrow mb-2">{eyebrow}</p> : null}
        <h1 className="cd-h1">{title}</h1>
        {subtitle ? <p className="cd-body mt-2 max-w-2xl text-sm">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="cd-h2">{title}</h2>
        {subtitle ? <p className="cd-mute mt-1 text-sm">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Surface({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={`cd-surface ${padded ? "p-6" : ""} ${className}`}>{children}</div>
  );
}

export function Stat({
  label,
  value,
  hint,
  trend,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  icon?: LucideIcon;
  href?: string;
}) {
  const trendColor =
    trend?.direction === "up"
      ? "cd-chip-positive"
      : trend?.direction === "down"
        ? "cd-chip-negative"
        : "cd-chip";

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="cd-mute text-xs font-medium">{label}</p>
          <p className="cd-stat-value mt-2">{value}</p>
        </div>
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--cd-bg-tint)] text-[color:var(--cd-ink-soft)]">
            <Icon size={16} strokeWidth={1.75} aria-hidden />
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        {hint ? <p className="cd-mute text-xs">{hint}</p> : <span />}
        {trend ? <span className={`cd-chip ${trendColor}`}>{trend.value}</span> : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="cd-surface block p-5 transition-colors hover:bg-[color:var(--cd-bg-tint)]"
      >
        {inner}
      </Link>
    );
  }
  return <div className="cd-surface p-5">{inner}</div>;
}

export function ActionTile({
  href,
  label,
  hint,
  icon: Icon,
  accent = false,
}: {
  href: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-[var(--cd-radius)] border p-4 transition-colors ${
        accent
          ? "border-transparent bg-[color:var(--cd-ink)] text-[color:var(--cd-bg)] hover:bg-[#2C2A26]"
          : "border-[color:var(--cd-line)] bg-[color:var(--cd-bg-raised)] hover:bg-[color:var(--cd-bg-tint)]"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          accent
            ? "bg-white/10 text-white"
            : "bg-[color:var(--cd-bg-tint)] text-[color:var(--cd-ink-soft)]"
        }`}
      >
        <Icon size={16} strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${accent ? "text-white" : "text-[color:var(--cd-ink)]"}`}>
          {label}
        </p>
        {hint ? (
          <p className={`text-xs ${accent ? "text-white/70" : "text-[color:var(--cd-ink-mute)]"}`}>
            {hint}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--cd-radius)] border border-dashed border-[color:var(--cd-line-strong)] bg-[color:var(--cd-bg-tint)] px-6 py-10 text-center">
      {Icon ? (
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--cd-bg-raised)] text-[color:var(--cd-ink-mute)]">
          <Icon size={18} strokeWidth={1.75} aria-hidden />
        </span>
      ) : null}
      <p className="cd-h3">{title}</p>
      {body ? <p className="cd-mute max-w-sm text-sm">{body}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export function DataRow({
  primary,
  secondary,
  meta,
  badge,
  href,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  meta?: ReactNode;
  badge?: ReactNode;
  href?: string;
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[color:var(--cd-ink)]">{primary}</p>
        {secondary ? <p className="truncate text-xs text-[color:var(--cd-ink-mute)]">{secondary}</p> : null}
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
      {meta ? <div className="shrink-0 text-end text-xs text-[color:var(--cd-ink-mute)] tabular-nums">{meta}</div> : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} className="cd-row no-underline">
        {inner}
      </Link>
    );
  }
  return <div className="cd-row">{inner}</div>;
}
