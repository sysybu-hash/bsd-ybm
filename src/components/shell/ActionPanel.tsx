'use client';

import React from 'react';
import Link from 'next/link';
import {
  Truck,
  Wallet,
  ShieldCheck,
  Camera,
  CalendarDays,
  ScanEye,
  HardHat,
  BadgeCheck,
  Bot,
  BarChart3,
} from 'lucide-react';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';

type IconTone = 'blue' | 'orange' | 'teal';

type ActionItem = {
  href: string;
  label: string;
  Icon: typeof Truck;
  tone: IconTone;
};

/** Row 1–2 labels match Meuhedet → BSD-YBM mapping from spec. */
const ROW1: ActionItem[] = [
  { href: '/scan', label: 'סריקת תעודות משלוח', Icon: Truck, tone: 'orange' },
  { href: '/dashboard/finance', label: 'בקשת תקציב/רכש', Icon: Wallet, tone: 'blue' },
  { href: '/dashboard/projects', label: 'בדיקת בטיחות (Safety)', Icon: ShieldCheck, tone: 'teal' },
  { href: '/dashboard', label: 'דיווח מהשטח (Field Log)', Icon: Camera, tone: 'blue' },
  { href: '/dashboard', label: 'יומן גוגל (Schedule)', Icon: CalendarDays, tone: 'orange' },
];

const ROW2: ActionItem[] = [
  { href: '/scan', label: 'מנוע גרמושקה (Vision)', Icon: ScanEye, tone: 'teal' },
  { href: '/dashboard/projects', label: 'ניהול קבלנים', Icon: HardHat, tone: 'orange' },
  { href: '/dashboard/settings/users', label: 'אישורי כניסה', Icon: BadgeCheck, tone: 'blue' },
  { href: '/dashboard', label: 'קבלת מסמכים מבוט', Icon: Bot, tone: 'teal' },
  { href: '/dashboard/finance', label: 'דוחות ביצועים (Analytics)', Icon: BarChart3, tone: 'orange' },
];

function toneColor(t: IconTone): string {
  switch (t) {
    case 'orange':
      return MEUHEDET.orange;
    case 'teal':
      return MEUHEDET.teal;
    default:
      return MEUHEDET.blue;
  }
}

/** Meuhedet-like tile: light circular well, flat glyph, label under (no heavy rings). */
function ActionTile({ item }: { item: ActionItem }) {
  const c = toneColor(item.tone);
  return (
    <Link
      href={item.href}
      className="group flex w-full max-w-[112px] flex-col items-center justify-start gap-3 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--bsd-accent-orange)] sm:max-w-[120px]"
    >
      <span
        className="flex h-[72px] w-[72px] items-center justify-center rounded-full border transition-transform group-active:scale-[0.97] sm:h-[76px] sm:w-[76px]"
        style={{
          backgroundColor: 'var(--bsd-icon-well)',
          borderColor: 'var(--bsd-icon-well-border)',
          boxShadow: '0 2px 8px rgba(0,26,77,0.06)',
        }}
      >
        <item.Icon className="h-[30px] w-[30px] sm:h-8 sm:w-8" style={{ color: c }} strokeWidth={1.75} aria-hidden />
      </span>
      <span
        className="min-h-[36px] max-w-[108px] text-[11px] font-bold leading-snug sm:min-h-[40px] sm:max-w-[118px] sm:text-[12px]"
        style={{ color: 'var(--bsd-royal-blue)' }}
      >
        {item.label}
      </span>
    </Link>
  );
}

export default function ActionPanel() {
  return (
    <section
      className="w-full max-w-[1040px] rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_8px_40px_rgba(0,26,77,0.1)] md:p-6"
      aria-labelledby="action-panel-title"
      style={{ boxShadow: '0 10px 48px rgba(0, 26, 77, 0.11)' }}
    >
      <h2 id="action-panel-title" className="sr-only">
        פעולות מהירות BSD-YBM AI Solutions
      </h2>
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="grid w-full grid-cols-2 justify-items-center gap-4 sm:grid-cols-5">
          {ROW1.map((item) => (
            <ActionTile key={item.label} item={item} />
          ))}
        </div>
        <div className="grid w-full grid-cols-2 justify-items-center gap-4 sm:grid-cols-5">
          {ROW2.map((item) => (
            <ActionTile key={item.label} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
