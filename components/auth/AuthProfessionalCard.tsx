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
      <div className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-lg shadow-indigo-900/8">
        {/* Indigo top bar */}
        <div className="bg-gradient-to-r from-indigo-950 to-indigo-900 px-8 py-6">
          {icon ? <div className="mb-4 flex justify-center">{icon}</div> : null}
          <h1 className="text-center text-2xl font-black tracking-tight text-white">
            {title}
          </h1>
          {subtitle ? (
            <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-relaxed text-indigo-300/70">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="px-8 pb-8 pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
