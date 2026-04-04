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
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-blue-600" aria-hidden />
        <div className="px-8 pb-8 pt-7">
          {icon ? <div className="mb-5 flex justify-center">{icon}</div> : null}
          <h1 className="text-center text-2xl font-black tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle ? (
            <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-relaxed text-slate-500">
              {subtitle}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
