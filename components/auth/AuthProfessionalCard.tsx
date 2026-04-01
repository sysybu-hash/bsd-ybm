import type { ReactNode } from "react";

type Props = Readonly<{
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}>;

export default function AuthProfessionalCard({ children, title, subtitle, icon }: Props) {
  return (
    <div className="w-full max-w-[460px]">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)]">
        {/* Top gradient bar */}
        <div
          className="h-1 w-full"
          style={{ background: "linear-gradient(90deg, var(--primary-color, #2563eb) 0%, #6366f1 100%)" }}
          aria-hidden
        />
        <div className="px-7 pb-9 pt-8 sm:px-10">
          {icon ? <div className="mb-6 flex justify-center">{icon}</div> : null}
          <h1 className="text-center text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mx-auto mt-2.5 max-w-sm text-center text-sm leading-relaxed text-slate-500">
              {subtitle}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
