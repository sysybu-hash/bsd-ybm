"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";

type Variant = "marketing-dark" | "marketing-light" | "sidebar" | "footer-dark";

type Props = Readonly<{
  /** קישור — אם לא מועבר, רק הלוגו */
  href?: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  className?: string;
  subtitle?: ReactNode;
  /** רק סימן המותג (לסרגל צד צר / אייקון) */
  iconOnly?: boolean;
}>;

/** סימן מותג: זרימה + מבנה — טיל על רקע כהה / לבן על רקע בהיר */
function Mark({ className, gid }: { className?: string; gid: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* Base shape with rich dark gradient */}
      <rect width="40" height="40" rx="12" fill={`url(#${gid}-bg)`} />
      
      {/* Glass border and reflection */}
      <rect x="0.5" y="0.5" width="39" height="39" rx="11.5" stroke={`url(#${gid}-border)`} strokeWidth="1" />
      <path d="M0 12C0 5.373 5.373 0 12 0h16c6.627 0 12 5.373 12 12v6C28 14 12 14 0 18v-6z" fill={`url(#${gid}-reflection)`} opacity="0.4" />
      
      {/* 3D abstract shape (Building/Rocket hybrid) */}
      <path d="M11 26c4-9 8-13 14-13 3.5 0 6 1.5 8 4" stroke={`url(#${gid}-stroke)`} strokeWidth="3" strokeLinecap="round" filter={`url(#${gid}-glow)`} />
      <path d="M13 15h14v3H13z" fill={`url(#${gid}-accent)`} filter={`url(#${gid}-shadow)`} />
      <path d="M15 19h10v1.5H15z" fill="white" opacity="0.75" />

      <defs>
        <linearGradient id={`${gid}-bg`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0f172a" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id={`${gid}-border`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.4)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
        <linearGradient id={`${gid}-reflection`} x1="0" y1="0" x2="0" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.3" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${gid}-stroke`} x1="11" y1="26" x2="33" y2="13" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id={`${gid}-accent`} x1="13" y1="15" x2="27" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5eead4" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
        <filter id={`${gid}-glow`} x="0" y="0" width="50" height="50" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2dd4bf" floodOpacity="0.4" />
        </filter>
        <filter id={`${gid}-shadow`} x="0" y="0" width="50" height="50" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.3" />
        </filter>
      </defs>
    </svg>
  );
}

function MarkLight({ className, gid }: { className?: string; gid: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* Light glass background */}
      <rect width="40" height="40" rx="12" fill={`url(#${gid}-bg-l)`} />
      
      {/* Glass border and reflection */}
      <rect x="0.5" y="0.5" width="39" height="39" rx="11.5" stroke={`url(#${gid}-border-l)`} strokeWidth="1" />
      <path d="M0 12C0 5.373 5.373 0 12 0h16c6.627 0 12 5.373 12 12v6C28 14 12 14 0 18v-6z" fill={`url(#${gid}-reflection-l)`} opacity="0.6" />
      
      {/* 3D abstract shape */}
      <path d="M11 26c4-9 8-13 14-13 3.5 0 6 1.5 8 4" stroke={`url(#${gid}-stroke-l)`} strokeWidth="3" strokeLinecap="round" filter={`url(#${gid}-glow-l)`} />
      <path d="M13 15h14v3H13z" fill={`url(#${gid}-accent-l)`} filter={`url(#${gid}-shadow-l)`} />
      <path d="M15 19h10v1.5H15z" fill="white" opacity="0.9" />

      <defs>
        <linearGradient id={`${gid}-bg-l`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.15)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
        <linearGradient id={`${gid}-border-l`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.6)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.1)" />
        </linearGradient>
        <linearGradient id={`${gid}-reflection-l`} x1="0" y1="0" x2="0" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.4" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${gid}-stroke-l`} x1="11" y1="26" x2="33" y2="13" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5eead4" />
          <stop offset="1" stopColor="#2dd4bf" />
        </linearGradient>
        <linearGradient id={`${gid}-accent-l`} x1="13" y1="15" x2="27" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ccfbf1" />
          <stop offset="1" stopColor="#5eead4" />
        </linearGradient>
        <filter id={`${gid}-glow-l`} x="0" y="0" width="50" height="50" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#5eead4" floodOpacity="0.5" />
        </filter>
        <filter id={`${gid}-shadow-l`} x="0" y="0" width="50" height="50" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.15" />
        </filter>
      </defs>
    </svg>
  );
}

const sizeMap = {
  sm: { mark: "h-8 w-8", text: "text-base", sub: "text-[10px]" },
  md: { mark: "h-10 w-10", text: "text-lg", sub: "text-xs" },
  lg: { mark: "h-12 w-12", text: "text-xl sm:text-2xl", sub: "text-xs sm:text-sm" },
};

export default function BsdYbmLogo({
  href = "/",
  variant = "marketing-light",
  size = "md",
  className = "",
  subtitle,
  iconOnly = false,
}: Props) {
  const gid = useId().replace(/:/g, "");
  const s = sizeMap[size];
  const isDark =
    variant === "marketing-dark" || variant === "footer-dark" || variant === "sidebar";

  if (iconOnly) {
    const markInner = !isDark ? (
      <Mark gid={gid} className={`shrink-0 ${s.mark}`} />
    ) : (
      <MarkLight gid={gid} className={`shrink-0 ${s.mark}`} />
    );
    const wrapClass = `flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition hover:bg-white/10 ${className}`.trim();
    if (href) {
      return (
        <Link
          href={href}
          className={`${wrapClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14b8a8] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--app-sidebar-bg,#0f172a)]`}
          aria-label="BSD-YBM — בית"
        >
          {markInner}
        </Link>
      );
    }
    return <span className={wrapClass}>{markInner}</span>;
  }

  const textClass =
    variant === "marketing-dark" || variant === "footer-dark"
      ? "text-white"
      : variant === "sidebar"
        ? "text-white"
        : "text-slate-900";

  const accentClass =
    variant === "marketing-dark" || variant === "footer-dark"
      ? "text-[#5eead4]"
      : variant === "sidebar"
        ? "text-[#5eead4]"
        : "text-[#0d9488]";

  const inner = (
    <span className={`flex items-center gap-2.5 ${className}`}>
      {!isDark ? (
        <Mark gid={gid} className={`shrink-0 ${s.mark}`} />
      ) : (
        <MarkLight gid={gid} className={`shrink-0 ${s.mark}`} />
      )}
      <span className="min-w-0 text-right leading-tight">
        <span className={`block font-black tracking-[-0.06em] ${s.text} ${textClass}`}>
          <span className={accentClass}>BSD</span>
          <span className={variant === "marketing-light" ? "text-slate-800" : "text-white"}>-YBM</span>
        </span>
        {subtitle !== undefined ? (
          subtitle
        ) : (
          <span className={`mt-0.5 block font-semibold ${s.sub} text-slate-500 ${variant === "marketing-dark" || variant === "footer-dark" || variant === "sidebar" ? "!text-slate-400" : ""}`}>
            פלטפורמה לפרויקטי בנייה
          </span>
        )}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14b8a8] focus-visible:ring-offset-2 rounded-xl">
        {inner}
      </Link>
    );
  }
  return inner;
}
