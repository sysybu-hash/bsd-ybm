import type { ReactNode } from "react";

type Props = Readonly<{
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}>;

export default function AuthProfessionalCard({ children, title, subtitle, icon }: Props) {
  return (
    <div className="w-full max-w-md">
      <div className="tile overflow-hidden shadow-[0_40px_120px_-55px_rgba(15,23,42,0.4)]">
        <div className="border-b border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,249,245,0.95),rgba(255,255,255,0.98))] px-7 py-7 text-center sm:px-8">
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
        <div className="px-7 pb-7 pt-6 sm:px-8">{children}</div>
      </div>
    </div>
  );
}
