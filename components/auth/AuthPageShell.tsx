import Link from "next/link";
import type { ReactNode } from "react";

type Props = Readonly<{
  children: ReactNode;
  secondaryNav: { href: string; label: string };
}>;

export default function AuthPageShell({ children, secondaryNav }: Props) {
  return (
    <div className="relative min-h-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden" dir="rtl">

      {/* Subtle top gradient accent */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 right-1/3 h-[400px] w-[400px] rounded-full bg-indigo-100 blur-[120px] opacity-60" />
        <div className="absolute top-2/3 left-0 h-[300px] w-[300px] rounded-full bg-violet-100 blur-[100px] opacity-50" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] max-w-2xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-black text-white shadow-lg shadow-indigo-500/30 transition group-hover:shadow-indigo-500/50">
              B
            </span>
            <span className="text-[15px] font-black tracking-tight text-gray-900">
              BSD<span className="text-indigo-600">-YBM</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden text-[12px] font-medium text-gray-400 transition hover:text-gray-700 sm:inline"
            >
              לאתר הראשי
            </Link>
            <Link
              href={secondaryNav.href}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-[12px] font-bold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
            >
              {secondaryNav.label}
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 py-4 text-center text-[11px] text-gray-400">
        © {new Date().getFullYear()} BSD-YBM Platform · כל הזכויות שמורות
      </footer>
    </div>
  );
}
