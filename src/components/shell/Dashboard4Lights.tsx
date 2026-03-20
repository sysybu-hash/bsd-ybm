'use client';

import React from 'react';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';

export type FleetLightState = 'green' | 'amber' | 'red' | 'off';

export type FleetLight = {
  id: string;
  label: string;
  state: FleetLightState;
  detail?: string;
  /** When true with `red`, LED pulses (Phase 14 anomaly). */
  flash?: boolean;
};

const LED: Record<FleetLightState, { bg: string; glow: string }> = {
  green: { bg: '#22c55e', glow: 'rgba(34,197,94,0.55)' },
  amber: { bg: '#f59e0b', glow: 'rgba(245,158,11,0.5)' },
  red: { bg: '#ef4444', glow: 'rgba(239,68,68,0.55)' },
  off: { bg: '#94a3b8', glow: 'transparent' },
};

function LightOrb({ state, flash }: { state: FleetLightState; flash?: boolean }) {
  const c = LED[state];
  const animate = state === 'red' && flash;
  return (
    <span
      className={`mx-auto block h-4 w-4 rounded-full border border-white/50 sm:h-5 sm:w-5 ${animate ? 'bsd-led-flash' : ''}`}
      style={{
        backgroundColor: c.bg,
        boxShadow: state === 'off' ? 'none' : `0 0 14px 3px ${c.glow}`,
        opacity: state === 'off' ? 0.45 : 1,
      }}
      aria-hidden
    />
  );
}

/**
 * Fleet / ops row — four or five status LEDs; pass live data from health + anomaly APIs.
 */
export default function Dashboard4Lights({
  lights,
  title = 'בקרת צי — ארגונים',
}: {
  lights: FleetLight[];
  title?: string;
}) {
  const n = lights.length;
  const grid =
    n >= 5
      ? 'grid-cols-2 sm:grid-cols-5'
      : n === 4
        ? 'grid-cols-2 sm:grid-cols-4'
        : 'grid-cols-2 sm:grid-cols-3';

  return (
    <section
      className="w-full rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-6"
      style={{ boxShadow: '0 12px 48px rgba(0,26,77,0.08)' }}
      aria-labelledby="fleet-lights-heading"
    >
      <style>{`
        @keyframes bsd-led-pulse {
          0%, 100% { opacity: 1; filter: brightness(1); transform: scale(1); }
          50% { opacity: 0.65; filter: brightness(1.35); transform: scale(1.08); }
        }
        .bsd-led-flash {
          animation: bsd-led-pulse 0.9s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .bsd-led-flash { animation: none; }
        }
      `}</style>
      <h2 id="fleet-lights-heading" className="mb-6 text-center text-lg font-black" style={{ color: MEUHEDET.blue }}>
        {title}
      </h2>
      <div className={`grid ${grid} items-stretch justify-items-center gap-4`}>
        {lights.map((L) => (
          <div
            key={L.id}
            className="flex w-full max-w-[200px] flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-100 bg-[#FDFDFD] p-6 text-center"
          >
            <LightOrb state={L.state} flash={L.flash} />
            <span className="text-sm font-bold text-[#001A4D]">{L.label}</span>
            {L.detail ? <span className="text-xs text-gray-500">{L.detail}</span> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
