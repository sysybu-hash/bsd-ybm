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
}>;

/** סימן מותג: זרימה + מבנה — טיל על רקע כהה / לבן על רקע בהיר */
function Mark({ className, gid }: { className?: string; gid: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="40" height="40" rx="10" className="fill-[#0f172a]" />
      <path
        d="M10 26c4-8 8-12 14-12 4 0 7 2 9 5"
        stroke={`url(#${gid}-m)`}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M12 14h16v3H12v-3z" className="fill-[#2dd4bf]" opacity="0.95" />
      <path d="M14 18h12v2H14v-2z" className="fill-white" opacity="0.35" />
      <defs>
        <linearGradient id={`${gid}-m`} x1="10" y1="26" x2="33" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MarkLight({ className, gid }: { className?: string; gid: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="40" height="40" rx="10" className="fill-white/12" stroke="white/25" strokeWidth="1" />
      <path
        d="M10 26c4-8 8-12 14-12 4 0 7 2 9 5"
        stroke={`url(#${gid}-l)`}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M12 14h16v3H12v-3z" className="fill-[#5eead4]" />
      <defs>
        <linearGradient id={`${gid}-l`} x1="10" y1="26" x2="33" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5eead4" />
          <stop offset="1" stopColor="#2dd4bf" />
        </linearGradient>
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
}: Props) {
  const gid = useId().replace(/:/g, "");
  const s = sizeMap[size];
  const isDark =
    variant === "marketing-dark" || variant === "footer-dark" || variant === "sidebar";

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
