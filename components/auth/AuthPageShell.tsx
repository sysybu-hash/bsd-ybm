import Link from "next/link";
import type { ReactNode } from "react";

type Props = Readonly<{
  children: ReactNode;
  secondaryNav: { href: string; label: string };
}>;

export default function AuthPageShell({ children, secondaryNav }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900" dir="rtl">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-black">B</span>
            <span className="text-blue-600">BSD-</span>
            <span className="text-slate-900">YBM</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden text-sm font-medium text-slate-500 hover:text-slate-900 transition sm:inline"
            >
              לאתר
            </Link>
            <Link
              href={secondaryNav.href}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              {secondaryNav.label}
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} BSD-YBM
      </footer>
    </div>
  );
}
