import Link from "next/link";
import type { ReactNode } from "react";

type Props = Readonly<{
  children: ReactNode;
  secondaryNav: { href: string; label: string };
}>;

export default function AuthPageShell({ children, secondaryNav }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900" dir="rtl">
      {/* Navbar */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white shadow-sm">B</span>
            <span className="text-sm font-black tracking-wide text-gray-900">BSD-YBM</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden text-xs font-medium text-gray-500 transition hover:text-gray-900 sm:inline"
            >
              לאתר
            </Link>
            <Link
              href={secondaryNav.href}
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
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
      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} BSD-YBM Platform
      </footer>
    </div>
  );
}
