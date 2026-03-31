import type { ReactNode } from "react";

type Props = Readonly<{
  children: ReactNode;
  /** כותרת כרטיס */
  title: string;
  subtitle?: string;
  /** איקון מעל הכותרת */
  icon?: ReactNode;
}>;

/** כרטיס מרכזי — כחול-לבן מקצועי עם פס מותג */
export default function AuthProfessionalCard({ children, title, subtitle, icon }: Props) {
  return (
    <div className="w-full max-w-[440px]">
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.15),0_4px_16px_-4px_rgba(37,99,235,0.08)] backdrop-blur-xl">
        {/* פס מותג כחול */}
        <div
          className="h-1.5 w-full"
          style={{ background: "linear-gradient(90deg, var(--primary-color, #2563eb), #4f46e5)" }}
          aria-hidden
        />
        <div className="px-6 pb-8 pt-7 sm:px-9 sm:pb-10 sm:pt-8">
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
