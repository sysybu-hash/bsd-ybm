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
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
        {/* Header */}
        <div className="relative border-b border-gray-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-8 py-7 text-center">
          {icon ? (
            <div className="mb-4 flex justify-center text-indigo-600">{icon}</div>
          ) : (
            <div className="mb-4 flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-black text-white shadow-lg shadow-indigo-500/30">
                B
              </div>
            </div>
          )}
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            {title}
          </h1>
          {subtitle ? (
            <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-gray-500">
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
