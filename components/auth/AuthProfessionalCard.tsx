import type { ReactNode } from "react";

type Props = Readonly<{
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}>;

export default function AuthProfessionalCard({ children, title, subtitle, icon }: Props) {
  return (
    <div className="w-full max-w-xl">
      <div className="overflow-hidden rounded-[var(--cd-radius-lg)] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] shadow-[0_24px_80px_-40px_rgba(31,30,27,0.28)]">
        <div className="border-b border-[color:var(--line)] bg-[color:var(--canvas-sunken)]/45 px-8 py-8 text-center sm:px-10">
          {icon ? (
            <div className="mb-4 flex justify-center text-[color:var(--axis-clients)]">{icon}</div>
          ) : (
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--axis-clients)] text-sm font-black text-white shadow-[0_18px_40px_-20px_rgba(193,89,47,0.85)]">
                BY
              </div>
            </div>
          )}
          <h1 className="text-2xl font-black tracking-[-0.04em] text-[color:var(--ink-900)]">{title}</h1>
          {subtitle ? (
            <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-[color:var(--ink-500)]">{subtitle}</p>
          ) : null}
        </div>
        <div className="px-8 pb-8 pt-7 sm:px-10">{children}</div>
      </div>
    </div>
  );
}
