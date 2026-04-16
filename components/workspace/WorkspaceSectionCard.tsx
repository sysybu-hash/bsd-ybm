"use client";

import type { FormEvent, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Loader2 } from "lucide-react";

export function WorkspaceSectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="v2-panel p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
          {icon}
        </span>
        <div>
          <h2 className="text-xl font-black text-[color:var(--v2-ink)]">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function WorkspaceSubmitButton({
  busy,
  label,
  disabled = false,
  tone = "primary",
}: {
  busy: boolean;
  label: string;
  disabled?: boolean;
  tone?: "primary" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-500"
      : "v2-button v2-button-primary";

  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className={`${toneClass} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <CheckCircle2 className="h-4 w-4" aria-hidden />
      )}
      {label}
    </button>
  );
}

export function WorkspaceActionForm({
  onSubmit,
  children,
  className = "grid gap-4",
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
    </form>
  );
}

export function WorkspaceMetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="v2-panel p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-4 text-sm font-bold text-[color:var(--v2-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[color:var(--v2-ink)]">{value}</p>
    </div>
  );
}

export function WorkspaceManagementNotice({
  visible,
  text,
}: {
  visible: boolean;
  text: string;
}) {
  if (!visible) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
      {text}
    </div>
  );
}
