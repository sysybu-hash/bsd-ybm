import Link from "next/link";
import type { ReactNode } from "react";

type Props = Readonly<{
  children: ReactNode;
  /** קישור משני בכותרת (למשל הרשמה בדף כניסה) */
  secondaryNav: { href: string; label: string };
}>;

/** רקע ומסגרת עליונה — אותה שפה ויזואלית כמו לוח הבקרה */
export default function AuthPageShell({ children, secondaryNav }: Props) {
  return (
    <div className="min-h-app relative flex flex-col overflow-x-hidden bg-slate-50 text-slate-900" dir="rtl">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 85% 65% at 100% 0%, rgba(232, 121, 52, 0.14), transparent 52%),
              radial-gradient(ellipse 70% 55% at 0% 100%, rgba(184, 134, 11, 0.12), transparent 48%),
              radial-gradient(ellipse 50% 40% at 50% 50%, rgba(148, 163, 184, 0.06), transparent 62%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='28' height='28' viewBox='0 0 28 28' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.9' fill='%2394a3b8' fill-opacity='0.18'/%3E%3C/svg%3E")`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <header className="relative z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link
            href="/"
            className="group text-xl font-black italic tracking-tighter transition-opacity hover:opacity-90 sm:text-2xl"
            style={{ color: "var(--primary-color, #b8860b)" }}
          >
            BSD-YBM<span className="text-slate-900">.</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href={secondaryNav.href}
              className="rounded-full border border-slate-200/90 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-amber-300/60 hover:text-amber-950 sm:px-4 sm:text-sm"
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

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        {children}
      </main>

      <footer className="relative z-10 border-t border-slate-200/70 bg-white/60 py-4 text-center text-[11px] text-slate-400 backdrop-blur-sm sm:text-xs">
        © {new Date().getFullYear()} BSD-YBM · גישה מאובטחת (JWT + OAuth)
      </footer>
    </div>
  );
}
