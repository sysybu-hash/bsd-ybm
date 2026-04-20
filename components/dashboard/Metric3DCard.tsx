import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Axis = "finance" | "clients" | "ai" | "neutral";

type Props = Readonly<{
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  linkLabel?: string;
  linkHref?: string;
  uid: string;
  axis?: Axis;
}>;

/**
 * Command Center KPI tile.
 * - שטוח, מקצועי, טיפוגרפיה חזקה
 * - אקסנט צבעוני עדין לפי ציר (finance=זהב, clients=ציאן, ai=סגול)
 * - ערך גדול בטבלת מספרים (tabular-nums), תווית קטנה, מגמה, קישור חץ
 */
export default function Metric3DCard({
  label,
  value,
  icon: Icon,
  trend,
  linkLabel,
  linkHref,
  uid,
  axis = "neutral",
}: Props) {
  const axisColor =
    axis === "finance"
      ? "var(--axis-finance)"
      : axis === "clients"
        ? "var(--axis-clients)"
        : axis === "ai"
          ? "var(--axis-ai)"
          : "var(--ink-500)";

  const axisSoft =
    axis === "finance"
      ? "var(--axis-finance-soft)"
      : axis === "clients"
        ? "var(--axis-clients-soft)"
        : axis === "ai"
          ? "var(--axis-ai-soft)"
          : "var(--canvas-sunken)";

  return (
    <div className="metric-3d-card h-full" data-uid={uid}>
      <div
        className="metric-3d-card__inner flex h-full flex-col gap-4 p-5"
        style={{ borderInlineStartColor: axisColor, borderInlineStartWidth: axis === "neutral" ? 0 : 3, borderInlineStartStyle: "solid" }}
      >
        {/* Header row: label + icon */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[color:var(--ink-500)]">
            {label}
          </p>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: axisSoft, color: axisColor }}
            aria-hidden
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>

        {/* Value */}
        <div className="flex-1">
          <span className="block text-[32px] leading-none font-black tabular-nums tracking-tight text-[color:var(--ink-900)]">
            {value}
          </span>
          {trend ? (
            <p className="mt-2 text-[12px] font-semibold text-[color:var(--ink-500)]">
              {trend}
            </p>
          ) : null}
        </div>

        {/* Footer link */}
        {linkLabel && linkHref ? (
          <div className="pt-2 border-t border-[color:var(--line-subtle)]">
            <Link
              href={linkHref}
              className="inline-flex items-center gap-1 text-[12px] font-bold text-[color:var(--ink-700)] transition hover:text-[color:var(--ink-900)]"
              style={{ color: axis === "neutral" ? undefined : axisColor }}
            >
              {linkLabel}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
