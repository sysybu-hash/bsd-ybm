import Link from "next/link";
import type { ReactNode } from "react";

type Props = Readonly<{
  children: ReactNode;
  /** קישור משני בכותרת (למשל הרשמה בדף כניסה) */
  secondaryNav: { href: string; label: string };
}>;

/** רקע ומסגרת עליונה — כחול-לבן מקצועי */
export default function AuthPageShell({ children, secondaryNav }: Props) {
  return (
    <div className="min-h-app relative flex flex-col overflow-x-hidden bg-white text-slate-900" dir="rtl">
      {/* רקע — נקודות עדינות + גרדיאנט כחול */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 60% at 100% 0%, rgba(37, 99, 235, 0.08), transparent 55%),
              radial-gradient(ellipse 65% 50% at 0% 100%, rgba(99, 102, 241, 0.06), transparent 50%),
              radial-gradient(ellipse 45% 35% at 50% 50%, rgba(148, 163, 184, 0.04), transparent 65%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.8' fill='%2394a3b8' fill-opacity='0.2'/%3E%3C/svg%3E")`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link
            href="/"
            className="group text-xl font-black italic tracking-tighter transition-opacity hover:opacity-85 sm:text-2xl"
            style={{ color: "var(--primary-color, #2563eb)" }}
          >
            BSD-<span className="text-slate-900">YBM</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href={secondaryNav.href}
              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-100 hover:text-blue-900 sm:px-4 sm:text-sm"
            >
              {secondaryNav.label}
            </Link>
            <Link
              href="/"
              className="hidden text-sm font-medium text-slate-500 transition hover:text-slate-900 sm:inline"
            >
              לאתר
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-100 bg-white/70 py-4 text-center text-[11px] text-slate-400 backdrop-blur-sm sm:text-xs">
        © {new Date().getFullYear()} BSD-YBM · גישה מאובטחת (JWT + OAuth 2.0)
      </footer>
    </div>
  );
}
