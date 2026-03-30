import type { ReactNode } from "react";

type Props = Readonly<{
  children: ReactNode;
  /** כותרת כרטיס */
  title: string;
  subtitle?: string;
  /** איקון מעל הכותרת */
  icon?: ReactNode;
}>;

/** „חלון” מרכזי — כרטיס עם פס מותג וצל עומק */
export default function AuthProfessionalCard({ children, title, subtitle, icon }: Props) {
  return (
    <div className="w-full max-w-[440px]">
      <div className="crystal-border overflow-hidden rounded-[1.75rem] bg-white/95 shadow-[0_25px_60px_-12px_rgba(15,23,42,0.22)] backdrop-blur-xl">
        <div
          className="h-1.5 w-full bg-gradient-to-l from-amber-600 via-orange-500 to-amber-500"
          aria-hidden
        />
        <div className="px-6 pb-8 pt-7 sm:px-9 sm:pb-10 sm:pt-8">
          {icon ? <div className="mb-6 flex justify-center">{icon}</div> : null}
          <h1 className="text-center text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-relaxed text-slate-500">
              {subtitle}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
