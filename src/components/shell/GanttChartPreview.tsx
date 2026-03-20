'use client';

import React, { useMemo } from 'react';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';

type GanttPhase = {
  id: string;
  label: string;
  startPct: number;
  widthPct: number;
  tone: 'orange' | 'teal' | 'blue';
};

/** Simplified architectural schedule — visual echo of central hero graphic; ties conceptually to Blueprint / Gramoshka. */
const DEFAULT_PHASES: GanttPhase[] = [
  { id: '1', label: 'תכנון + היתרים', startPct: 0, widthPct: 18, tone: 'teal' },
  { id: '2', label: 'שלד', startPct: 14, widthPct: 28, tone: 'orange' },
  { id: '3', label: 'איטום + חזיתות', startPct: 36, widthPct: 22, tone: 'blue' },
  { id: '4', label: 'MEP', startPct: 48, widthPct: 30, tone: 'teal' },
  { id: '5', label: 'גמר + הערכת גרמושקה', startPct: 72, widthPct: 26, tone: 'orange' },
];

function barColor(tone: GanttPhase['tone']): string {
  switch (tone) {
    case 'orange':
      return MEUHEDET.orange;
    case 'teal':
      return MEUHEDET.teal;
    default:
      return MEUHEDET.blueMid;
  }
}

export default function GanttChartPreview() {
  const phases = useMemo(() => DEFAULT_PHASES, []);

  return (
    <section
      className="w-full max-w-4xl rounded-[32px] border border-gray-100 bg-[#FDFDFD] p-6 shadow-inner sm:p-6"
      aria-labelledby="gantt-preview-title"
    >
      <h2 id="gantt-preview-title" className="mb-4 text-center text-lg font-black text-[#001A4D]">
        תכנון לו״ז פרויקט — מבט ארכיטקטוני
      </h2>
      <p className="mb-4 text-center text-xs font-medium text-slate-500">
        תצוגה מקושרת לניתוח תכניות (Gramoshka / BlueprintAnalyzer)
      </p>

      <div
        className="relative mx-auto flex h-48 w-full max-w-3xl items-center justify-center overflow-hidden rounded-[32px] border border-[#001A4D]/15"
        style={{ backgroundColor: 'var(--bsd-content-bg-soft)' }}
      >
        <svg viewBox="0 0 400 180" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
          <rect x="0" y="0" width="400" height="180" fill="rgba(0,26,77,0.04)" rx="24" />
          {[40, 72, 104, 136].map((y) => (
            <line key={y} x1="24" y1={y} x2="376" y2={y} stroke="#001A4D" strokeOpacity="0.08" strokeWidth="1" />
          ))}
          {phases.map((p, i) => {
            const x = 24 + (p.startPct / 100) * 352;
            const w = Math.max(8, (p.widthPct / 100) * 352);
            const y = 44 + i * 22;
            const h = 16;
            return (
              <rect
                key={p.id}
                x={x}
                y={y}
                width={w}
                height={h}
                rx="8"
                fill={barColor(p.tone)}
                opacity={0.92}
              />
            );
          })}
        </svg>
      </div>

      <ul className="mt-4 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
        {phases.map((p) => (
          <li key={p.id} className="flex items-center justify-center gap-2 text-xs font-bold text-[#001A4D]">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: barColor(p.tone) }} aria-hidden />
            {p.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
