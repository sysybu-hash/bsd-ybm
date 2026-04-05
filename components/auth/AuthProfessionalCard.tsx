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
      <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
        <div className="relative border-b border-gray-200 bg-gray-50 px-8 py-6">
          <div className="absolute inset-y-0 start-0 w-1.5 bg-indigo-600" aria-hidden />
          {icon ? <div className="mb-4 flex justify-center text-indigo-600">{icon}</div> : null}
          <h1 className="text-center text-2xl font-black tracking-tight text-gray-900">
            {title}
          </h1>
          {subtitle ? (
            <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-relaxed text-gray-500">
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
