'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { useProjectTimelineEvents } from '@/hooks/useProjectTimelineEvents';
import type { ProjectTimelineEvent, ProjectTimelineVariant } from '@/types/projectTimeline';
import TimelineSlideOver from '@/components/project/TimelineSlideOver';

const ORANGE = '#FF8C00';
const BLUE = '#004694';
const GREEN = '#22c55e';

const GLOW: Record<string, string> = {
  blue: `0 0 16px ${BLUE}aa, 0 0 32px ${BLUE}44`,
  orange: `0 0 16px ${ORANGE}cc, 0 0 32px ${ORANGE}44`,
  green: `0 0 16px ${GREEN}aa, 0 0 28px ${GREEN}33`,
};

function iconFor(kind: ProjectTimelineEvent['kind']): string {
  switch (kind) {
    case 'finance_labor':
      return '👷';
    case 'scan':
      return '📄';
    case 'communication':
      return '💬';
    case 'milestone':
      return '⭐';
    case 'finance_revenue':
    case 'finance_expense':
      return '💰';
    default:
      return '•';
  }
}

function TimelineNode({
  ev,
  isLast,
  onSelect,
}: {
  ev: ProjectTimelineEvent;
  isLast: boolean;
  onSelect: () => void;
}) {
  const glow = GLOW[ev.color] ?? GLOW.blue;

  return (
    <li className="relative flex w-full items-stretch justify-center gap-4">
      <div className="flex w-12 shrink-0 flex-col items-center">
        <motion.button
          type="button"
          onClick={onSelect}
          className="relative z-[2] flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#FDFDFD] text-xl shadow-md"
          style={{ boxShadow: glow }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.96 }}
          aria-label={`פתח פירוט: ${ev.title}`}
        >
          <span aria-hidden>{iconFor(ev.kind)}</span>
        </motion.button>
        {!isLast && (
          <div
            className="mt-1 w-0.5 flex-1 min-h-[1.25rem] shrink-0 rounded-full bg-gradient-to-b from-gray-300 to-gray-100"
            aria-hidden
          />
        )}
      </div>
      <motion.button
        type="button"
        onClick={onSelect}
        className="mb-4 flex min-h-[4.5rem] flex-1 flex-col items-center justify-center gap-2 rounded-4xl border border-gray-100 bg-[#FDFDFD] p-4 text-center transition-shadow hover:shadow-md"
        style={{ boxShadow: `0 4px 20px rgba(0,70,148,0.06)` }}
        whileHover={{ y: -2 }}
      >
        <span className="text-sm font-black text-[#004694]">{ev.title}</span>
        <span className="line-clamp-2 text-xs text-gray-600">{ev.subtitle}</span>
      </motion.button>
    </li>
  );
}

export default function ProjectTimeline({
  companyId,
  projectId,
  variant = 'full',
  heading = 'ציר זמן פרויקט',
  subheading,
  showFinanceFab = true,
}: {
  companyId: string;
  projectId: string;
  variant?: ProjectTimelineVariant;
  heading?: string;
  subheading?: string;
  showFinanceFab?: boolean;
}) {
  const { events, error, loading } = useProjectTimelineEvents(companyId, projectId, variant);
  const [selected, setSelected] = useState<ProjectTimelineEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDetail = (ev: ProjectTimelineEvent) => {
    setSelected(ev);
    setDrawerOpen(true);
  };

  const closeDetail = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelected(null), 300);
  };

  return (
    <>
      <section
        className="relative flex w-full max-w-2xl flex-col items-center justify-center gap-4 rounded-4xl border border-gray-100 bg-[#FDFDFD] p-6 pt-safe pb-safe sm:p-8"
        aria-labelledby="project-timeline-heading"
      >
        <h2 id="project-timeline-heading" className="text-center text-lg font-black text-[#1a1a1a] sm:text-xl">
          {heading}
        </h2>
        <p className="text-center text-sm text-gray-500">
          {subheading ??
            (variant === 'client'
              ? 'עדכונים מאושרים ללקוח — הודעות ומשימות בלבד'
              : 'אירועים בזמן אמת: תקשורת, אבני דרך, כספים, סריקות AI ונוכחות')}
        </p>

        {loading && <p className="text-center text-sm text-gray-400">טוען ציר זמן…</p>}
        {error && (
          <p className="w-full rounded-4xl border border-red-100 bg-red-50 py-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}

        {!loading && events.length === 0 && !error && (
          <p className="rounded-4xl border border-gray-100 bg-white py-8 text-center text-sm text-gray-400">
            אין אירועים עדיין.
          </p>
        )}

        <ol className="flex w-full flex-col items-center gap-4 pt-2">
          {events.map((ev, i) => (
            <TimelineNode
              key={ev.id}
              ev={ev}
              isLast={i === events.length - 1}
              onSelect={() => openDetail(ev)}
            />
          ))}
        </ol>
      </section>

      {showFinanceFab && variant === 'full' && (
        <Link
          href="/dashboard/finance"
          className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center justify-center gap-2 rounded-4xl border border-white px-6 py-4 text-sm font-black text-white shadow-xl"
          style={{
            backgroundColor: ORANGE,
            boxShadow: `0 8px 32px ${ORANGE}99, 0 0 24px ${ORANGE}66`,
          }}
        >
          <Wallet className="h-5 w-5" aria-hidden />
          חזרה ללוח פיננסי
        </Link>
      )}

      <TimelineSlideOver
        open={drawerOpen}
        onClose={closeDetail}
        event={selected}
        projectId={projectId}
        allowStaffActions={variant === 'full'}
      />
    </>
  );
}
