import Link from "next/link";
import type { ReactNode } from "react";

type Props = Readonly<{
  children: ReactNode;
  secondaryNav: { href: string; label: string };
}>;

export default function AuthPageShell({ children, secondaryNav }: Props) {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#050508] text-white overflow-hidden" dir="rtl">

      {/* Mesh gradient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 right-1/3 h-[600px] w-[600px] rounded-full bg-indigo-600/[0.15] blur-[130px]" />
        <div className="absolute top-2/3 left-0 h-[400px] w-[400px] rounded-full bg-violet-700/[0.10] blur-[100px]" />
        {/* grid */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "56px 56px" }} />
      </div>

      {/* Navbar */}
      <header className="relative z-10 border-b border-white/[0.07] bg-[#050508]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] max-w-2xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-black text-white shadow-lg shadow-indigo-500/30 transition group-hover:shadow-indigo-500/50">
              B
            </span>
            <span className="text-[15px] font-black tracking-tight text-white">
              BSD<span className="text-indigo-400">-YBM</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden text-[12px] font-medium text-white/40 transition hover:text-white sm:inline"
            >
              לאתר הראשי
            </Link>
            <Link
              href={secondaryNav.href}
              className="rounded-lg border border-white/[0.1] bg-white/[0.06] px-4 py-2 text-[12px] font-bold text-white/80 transition hover:bg-white/[0.10] hover:text-white"
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
      <footer className="relative z-10 border-t border-white/[0.05] py-4 text-center text-[11px] text-white/20">
        © {new Date().getFullYear()} BSD-YBM Platform · כל הזכויות שמורות
      </footer>
    </div>
  );
}
