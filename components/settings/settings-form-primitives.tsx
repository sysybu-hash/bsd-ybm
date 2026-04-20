"use client";

import type { ReactNode } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

export const inputClass =
  "w-full rounded-2xl border border-[color:var(--v2-line)] bg-white/90 px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none transition placeholder:text-[color:var(--v2-muted)] focus:border-[color:var(--v2-accent)]";

export const textareaClass = `${inputClass} min-h-[120px] resize-y leading-7`;

export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function jsonValue(value: unknown) {
  const record = asRecord(value);
  return Object.keys(record).length === 0 ? "" : JSON.stringify(record, null, 2);
}

export function SubmitButton({
  busy,
  disabled,
  label,
}: {
  busy: boolean;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className="v2-button v2-button-primary disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
      {label}
    </button>
  );
}

export function SectionCard({
  title,
  body,
  icon,
  children,
}: {
  title: string;
  body: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="v2-panel p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-black text-[color:var(--v2-ink)]">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">{body}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export type ActionResult = { ok: boolean; error?: string };
export type SettingsFormAction = (formData: FormData) => Promise<ActionResult>;
