'use client';

import React from 'react';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';

/**
 * BSD-YBM mark: buildings + data flow (Meuhedet-style horizontal logo strip).
 * Right-aligned in RTL header — reads logo then wordmark.
 */
export default function BsybmLogoMark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-row items-center justify-center gap-3 sm:gap-4 ${className}`}>
      <svg
        width="132"
        height="52"
        viewBox="0 0 132 52"
        className="h-11 w-auto shrink-0 sm:h-[52px]"
        aria-hidden
      >
        <title>BSD-YBM</title>
        {/* Data nodes */}
        <circle cx="14" cy="14" r="5" fill={MEUHEDET.white} opacity="0.95" />
        <circle cx="118" cy="14" r="5" fill={MEUHEDET.teal} />
        <circle cx="118" cy="38" r="5" fill={MEUHEDET.orange} />
        {/* Flow curves (building ↔ cloud pipeline) */}
        <path
          d="M19 14 H44 M74 14 H113"
          stroke={MEUHEDET.white}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M118 19 L118 33"
          stroke={MEUHEDET.white}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Buildings cluster */}
        <rect x="36" y="22" width="14" height="26" rx="2" fill={MEUHEDET.orange} />
        <rect x="52" y="14" width="18" height="34" rx="2" fill={MEUHEDET.white} opacity="0.98" />
        <rect x="72" y="18" width="12" height="30" rx="2" fill={MEUHEDET.teal} />
        <rect x="86" y="24" width="10" height="24" rx="2" fill={MEUHEDET.white} opacity="0.35" />
        {/* Window ticks */}
        <rect x="56" y="20" width="10" height="3" rx="1" fill={MEUHEDET.blue} opacity="0.25" />
        <rect x="56" y="26" width="10" height="3" rx="1" fill={MEUHEDET.blue} opacity="0.25" />
        <rect x="56" y="32" width="10" height="3" rx="1" fill={MEUHEDET.blue} opacity="0.25" />
      </svg>
      <div className="flex flex-col items-start justify-center leading-none">
        <span className="text-[15px] font-bold tracking-tight text-white sm:text-[17px]">BSD-YBM</span>
        <span className="mt-0.5 text-[10px] font-semibold text-white/80 sm:text-[11px]">AI Solutions</span>
      </div>
    </div>
  );
}
