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
      <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.05] shadow-2xl shadow-black/40 backdrop-blur-xl">
        {/* Header */}
        <div className="relative border-b border-white/[0.07] bg-white/[0.04] px-8 py-7 text-center">
          {icon ? (
            <div className="mb-4 flex justify-center text-indigo-400">{icon}</div>
          ) : (
            <div className="mb-4 flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-black text-white shadow-lg shadow-indigo-500/30">
                B
              </div>
            </div>
          )}
          <h1 className="text-2xl font-black tracking-tight text-white">
            {title}
          </h1>
          {subtitle ? (
            <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-white/45">
              {subtitle}
            </p>
          ) : null}
        </div>
        {/* Body */}
        <div className="px-8 pb-8 pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
