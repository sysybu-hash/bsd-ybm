import Link from "next/link";
import type { ReactNode } from "react";

type Props = Readonly<{
  children: ReactNode;
  secondaryNav: { href: string; label: string };
}>;

export default function AuthPageShell({ children, secondaryNav }: Props) {
  return (
    <div className="min-h-screen relative flex flex-col overflow-x-hidden bg-slate-950 text-slate-900" dir="rtl">

      {/* Background mesh */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 70% 50% at 20% 50%, rgba(37,99,235,0.15) 0%, transparent 60%),
              radial-gradient(ellipse 60% 60% at 80% 20%, rgba(99,102,241,0.12) 0%, transparent 55%)
            `,
          }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='%23ffffff'/%3E%3C/svg%3E")`,
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      {/* Navbar */}
      <header className="relative z-20 border-b border-white/8">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-black italic tracking-tight"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white text-xs font-black shadow-lg"
              style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
            >B</span>
            <span style={{ color: "var(--primary-color, #2563eb)" }}>BSD-</span>
            <span className="text-white">YBM</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-sm font-medium text-slate-400 transition hover:text-white sm:inline"
            >
              לאתר
            </Link>
            <Link
              href={secondaryNav.href}
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/15"
            >
              {secondaryNav.label}
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/6 py-4 text-center text-[11px] text-slate-600">
        © {new Date().getFullYear()} BSD-YBM · גישה מאובטחת · JWT + OAuth 2.0
      </footer>
    </div>
  );
}
