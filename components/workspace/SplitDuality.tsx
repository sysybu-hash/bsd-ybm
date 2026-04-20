import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

/**
 * Split Duality — מעטפת לעמוד עם שני צירים (כספים × לקוחות) וחוט AI באמצע.
 *
 * mode:
 *  - "home"    : 50/50 (דף הבית, AI Hub)
 *  - "clients" : 65/35 (לקוחות דומיננטי — ימין מורחב)
 *  - "finance" : 35/65 (כספים דומיננטי — שמאל מורחב)
 *
 * הרכיב מייצר:
 *  - רקע מפוצל (זהב-אפרסק + ציאן)
 *  - חוט שדרה סגול של AI עם נקודות דופק
 *  - יכולת לשים עליו את הכותרת הגרדיאנטית ואת גשר ה-AI
 */
export function SplitDualityShell({
  mode,
  children,
  className,
}: {
  mode: "home" | "clients" | "finance";
  children: ReactNode;
  className?: string;
}) {
  const modeClass =
    mode === "home" ? "split-duality--home" : mode === "clients" ? "split-duality--clients" : "split-duality--finance";
  return (
    <div className={`split-duality ${modeClass} relative ${className ?? ""}`}>
      {/* נקודות דופק על חוט השדרה */}
      <div className="split-duality-spine-dots" aria-hidden />
      {children}
    </div>
  );
}

/**
 * כותרת ענקית עם גרדיאנט תלת-צבעי (ציאן → סגול → זהב) — חוצה את שני הצדדים.
 */
export function SplitDualityHeadline({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="relative z-10 text-center">
      {eyebrow ? (
        <span className="v2-eyebrow mx-auto" style={{ background: "rgba(255,255,255,0.78)", borderColor: "transparent" }}>
          {eyebrow}
        </span>
      ) : null}
      <h1 className="sd-headline mt-4 text-[clamp(48px,7vw,92px)] font-black tracking-tight leading-[1.02]">
        {title}
      </h1>
      {subtitle ? (
        <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-7 text-[color:var(--ink-600)]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/**
 * גשר AI — פיל סגול זוהר שחוצה את חוט השדרה אופקית.
 * תוכן: sparkle + eyebrow + insight + CTA.
 */
export function SplitDualityBridge({
  eyebrow,
  insight,
  ctaLabel,
  ctaHref = "/app/ai",
}: {
  eyebrow: string;
  insight: string;
  ctaLabel: string;
  ctaHref?: string;
}) {
  return (
    <div className="relative z-10 flex justify-center">
      <div className="sd-bridge w-full max-w-4xl">
        <span className="sd-bridge-sparkle" aria-hidden>
          <Sparkles className="h-4 w-4 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="sd-bridge-eyebrow">{eyebrow}</p>
          <p className="sd-bridge-text truncate sm:whitespace-normal">{insight}</p>
        </div>
        <Link href={ctaHref} className="sd-bridge-cta">
          {ctaLabel}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

/**
 * אזור דו-צירי: ילד שמאלי (כספים) + ילד ימני (לקוחות).
 * ב-RTL: הילד הראשון בקוד הוא הצד שמוצג בימין (לקוחות).
 */
export function SplitDualityAxes({
  leadingAxis,
  trailingAxis,
  mode,
}: {
  /** הציר שמופיע בקריאה ראשונה (בימין ב-RTL) */
  leadingAxis: ReactNode;
  /** הציר שמופיע שני (בשמאל ב-RTL) */
  trailingAxis: ReactNode;
  mode: "home" | "clients" | "finance";
}) {
  const gridCols =
    mode === "home"
      ? "lg:grid-cols-2"
      : mode === "clients"
        ? "lg:grid-cols-[65fr_35fr]"
        : "lg:grid-cols-[35fr_65fr]";
  return (
    <section className={`relative z-10 grid gap-6 ${gridCols}`}>
      {leadingAxis}
      {trailingAxis}
    </section>
  );
}

/**
 * כרטיס ציר — מעטפת אחידה עם eyebrow + header + body.
 */
export function AxisCard({
  axis,
  eyebrow,
  title,
  action,
  children,
  className,
}: {
  axis: "clients" | "finance" | "ai";
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={`sd-axis-card sd-axis-card--${axis} overflow-hidden ${className ?? ""}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--line-subtle)] px-5 py-4">
        <div>
          <p className={`sd-axis-title sd-axis-title--${axis}`}>{eyebrow}</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-[color:var(--ink-900)]">{title}</h2>
        </div>
        {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
      </header>
      <div className="p-5">{children}</div>
    </article>
  );
}

/** קישור "ראה עוד" צבוע לפי ציר */
export function AxisSeeAllLink({
  axis,
  href,
  label,
}: {
  axis: "clients" | "finance" | "ai";
  href: string;
  label: string;
}) {
  const color =
    axis === "clients"
      ? "var(--axis-clients)"
      : axis === "finance"
        ? "var(--axis-finance)"
        : "var(--axis-ai)";
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[13px] font-bold hover:underline"
      style={{ color }}
    >
      {label}
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );
}
