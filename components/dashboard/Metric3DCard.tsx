import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Props = Readonly<{
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  linkLabel?: string;
  linkHref?: string;
  uid: string;
}>;

export default function Metric3DCard({ label, value, icon: Icon, trend, linkLabel, linkHref, uid }: Props) {
  return (
    <div className="group relative w-full" style={{ height: "140px" }} dir="rtl">
      <div
        className="holo-border-card h-full w-full transition-transform duration-300 group-hover:-translate-y-1.5"
        aria-label={label}
        data-uid={uid}
      >
        {/* Halo */}
        <div
          className="pointer-events-none absolute -inset-10 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, rgba(126,231,255,0.45) 0%, transparent 55%), radial-gradient(circle at 80% 70%, rgba(251,182,206,0.35) 0%, transparent 58%), radial-gradient(circle at 55% 55%, rgba(110,231,183,0.22) 0%, transparent 60%)",
            filter: "blur(22px)",
          }}
          aria-hidden
        />

        <div className="flex h-full flex-col justify-between p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-black leading-tight text-slate-700/90">{label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[28px] leading-none font-black tabular-nums tracking-tight text-slate-900">
                  {value}
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-white/55 ring-1 ring-white/70 shadow-sm">
                  <Icon className="h-[18px] w-[18px] text-teal-600" aria-hidden />
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between gap-3 pt-2">
            {trend ? (
              <p className="text-[11px] font-black text-emerald-700/90">{trend}</p>
            ) : (
              <span />
            )}
            {linkLabel && linkHref ? (
              <Link
                href={linkHref}
                className="rounded-full bg-white/55 px-3 py-1 text-[11px] font-black text-teal-700 ring-1 ring-white/70 shadow-sm transition hover:bg-white/75"
              >
                {linkLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
