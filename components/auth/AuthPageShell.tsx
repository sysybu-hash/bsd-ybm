import Link from "next/link";
import type { ReactNode } from "react";

type Props = Readonly<{
  children: ReactNode;
  secondaryNav: { href: string; label: string };
}>;

export default function AuthPageShell({ children, secondaryNav }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5ff] text-gray-900" dir="rtl">
      {/* Navbar */}
      <header className="bg-indigo-950 border-b border-indigo-800/40">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-400 text-indigo-950 text-xs font-black shadow-md">B</span>
            <span className="text-sm font-black text-indigo-100 tracking-wide">BSD-YBM</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden text-xs font-medium text-indigo-300/60 hover:text-indigo-100 transition sm:inline"
            >
              לאתר
            </Link>
            <Link
              href={secondaryNav.href}
              className="rounded-xl border border-indigo-400/30 bg-indigo-400/15 px-4 py-2 text-xs font-bold text-indigo-200 hover:bg-indigo-400/25 transition"
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
      <footer className="border-t border-indigo-100 py-4 text-center text-xs text-indigo-400/50">
        © {new Date().getFullYear()} BSD-YBM Platform
      </footer>
    </div>
  );
}
