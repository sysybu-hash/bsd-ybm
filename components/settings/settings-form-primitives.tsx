"use client";

import type { ReactNode } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

export const inputClass =
  "w-full rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-3.5 py-2.5 text-sm font-semibold text-[color:var(--ink-900)] outline-none transition placeholder:text-[color:var(--ink-400)] focus:border-[color:var(--ops-indigo)] focus:ring-2 focus:ring-[color:var(--axis-ai-glow)]";

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
      className="bento-btn bento-btn--primary"
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
    <section className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
      <div className="mb-4 flex items-start gap-3 border-b border-[color:var(--line-subtle)] pb-4">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--axis-ai-soft)", color: "var(--ops-indigo)" }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-[17px] font-black tracking-tight text-[color:var(--ink-900)]">{title}</h2>
          <p className="mt-1 text-[13px] leading-6 text-[color:var(--ink-500)]">{body}</p>
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

export type ActionResult = { ok: boolean; error?: string };
export type SettingsFormAction = (formData: FormData) => Promise<ActionResult>;
