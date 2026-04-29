import type { ReactNode } from "react";
import { CheckCircle2, ClipboardCheck } from "lucide-react";

export function SectionTitle({
  eyebrow,
  title,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--ink-400)]">{eyebrow}</p>
        <h2 className="text-sm font-black text-[color:var(--ink-900)] xl:text-base">{title}</h2>
      </div>
      <Icon className="h-5 w-5 text-blue-600" aria-hidden />
    </div>
  );
}

export function CardShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-2.5 shadow-[var(--cd-shadow-sm)] ${className}`.trim()}
    >
      {children}
    </section>
  );
}

export function ProcessorBadge({
  label,
  sublabel,
  active,
  configured,
}: {
  label: string;
  sublabel: string;
  active: boolean;
  configured: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-3 py-2 text-xs ${
        active ? "border-blue-200 bg-blue-50 text-blue-900" : "border-[color:var(--line)] bg-[color:var(--canvas-sunken)] text-[color:var(--ink-700)]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-black">{label}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${configured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
          {configured ? "ON" : "OFF"}
        </span>
      </div>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-500)]">{sublabel}</p>
    </div>
  );
}

export function EngineOptionRow({
  title,
  description,
  tone,
  children,
}: {
  title: string;
  description: string;
  tone: "emerald" | "violet";
  children?: ReactNode;
}) {
  const toneClass =
    tone === "emerald" ? "border-emerald-200 bg-emerald-50/60 text-emerald-900" : "border-violet-200 bg-violet-50/60 text-violet-900";
  return (
    <div className={`rounded-2xl border p-3 ${toneClass}`}>
      <p className="text-xs font-black">{title}</p>
      <p className="mt-1 text-[11px] font-semibold leading-5 text-[color:var(--ink-600)]">{description}</p>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

export function MiniPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-3 py-1 text-[11px] font-black text-[color:var(--ink-700)]">
      <span className="text-[color:var(--ink-400)]">{label}</span>
      <span className="max-w-[170px] truncate text-[color:var(--ink-900)]">{value}</span>
    </span>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[color:var(--ink-400)]">{label}</p>
      <p className="mt-1.5 truncate text-base font-black text-[color:var(--ink-900)] xl:text-lg">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold text-[color:var(--ink-500)]">{hint}</p>
    </div>
  );
}

export function DashboardAction({
  icon: Icon,
  label,
  hint,
  onClick,
  disabled,
  primary = false,
  spinning = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  spinning?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={hint}
      className={`flex min-h-[92px] items-center gap-3 rounded-2xl border p-4 text-start transition disabled:cursor-not-allowed disabled:opacity-45 ${
        primary
          ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
          : "border-[color:var(--line)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-900)] hover:bg-[color:var(--canvas-sunken)]"
      }`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${primary ? "bg-white/15" : "bg-blue-50 text-blue-600"}`}>
        <Icon className={`h-5 w-5 ${spinning ? "animate-spin" : ""}`} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-black">{label}</span>
        <span className={`mt-1 block truncate text-xs font-bold ${primary ? "text-white/80" : "text-[color:var(--ink-500)]"}`}>
          {hint}
        </span>
      </span>
    </button>
  );
}

export function IconMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-3 text-start shadow-sm">
      <Icon className="h-4 w-4 text-blue-600" aria-hidden />
      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--ink-400)]">{label}</p>
      <p className="mt-1 truncate text-xs font-black text-[color:var(--ink-900)]">{value}</p>
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-3">
      <p className="text-[11px] font-black text-[color:var(--ink-400)]">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-[color:var(--ink-900)]">{value}</p>
    </div>
  );
}

export function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-3 py-2">
      <p className="text-[11px] font-black text-[color:var(--ink-400)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[color:var(--ink-800)]">{value}</p>
    </div>
  );
}

export function ResultRows({
  title,
  rows,
}: {
  title: string;
  rows: { main: string; meta: string; amount: string }[];
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] shadow-sm">
      <div className="flex items-center gap-2 border-b border-[color:var(--line)] px-3 py-3">
        <ClipboardCheck className="h-4 w-4 text-blue-600" aria-hidden />
        <p className="text-sm font-black text-[color:var(--ink-900)]">{title}</p>
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        {rows.slice(0, 50).map((row, index) => (
          <div key={`${row.main}-${index}`} className="grid grid-cols-[1fr_90px] gap-3 border-b border-[color:var(--line-subtle)] px-3 py-2 last:border-b-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[color:var(--ink-900)]">{row.main}</p>
              <p className="mt-0.5 truncate text-[11px] font-semibold text-[color:var(--ink-500)]">{row.meta || "-"}</p>
            </div>
            <p className="text-end text-sm font-black tabular-nums text-[color:var(--ink-800)]">{row.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Capability({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-[color:var(--canvas-sunken)] p-2">
      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
      <span>{text}</span>
    </div>
  );
}
