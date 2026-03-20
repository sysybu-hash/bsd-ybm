/**
 * Hebrew date + Israeli holidays (Hebcal). Safe for client bundles.
 */
import { HebrewCalendar, HDate } from '@hebcal/core';

export type HolidayLite = { title: string; desc: string; date: Date };

export function formatHebrewDate(d: Date = new Date()): string {
  const hd = new HDate(d);
  try {
    return hd.render('he') || hd.render('en') || hd.toString();
  } catch {
    return hd.toString();
  }
}

export function getIsraelHolidaysForGregorianMonth(year: number, monthIndex0: number): HolidayLite[] {
  const month = monthIndex0 + 1;
  const ev = HebrewCalendar.calendar({
    year,
    month,
    isHebrewYear: false,
    il: true,
  });
  const out: HolidayLite[] = [];
  for (const e of ev) {
    const desc = e.getDesc();
    if (!desc) continue;
    out.push({
      title: e.render('he') || desc,
      desc,
      date: e.greg(),
    });
  }
  return out;
}

export function todayHolidayTitlesIsrael(d: Date = new Date()): string[] {
  const y = d.getFullYear();
  const m = d.getMonth();
  return getIsraelHolidaysForGregorianMonth(y, m)
    .filter((h) => {
      const t = h.date.getTime();
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      return (
        new Date(t).getFullYear() === new Date(day).getFullYear() &&
        new Date(t).getMonth() === new Date(day).getMonth() &&
        new Date(t).getDate() === new Date(day).getDate()
      );
    })
    .map((h) => h.title);
}

export { HDate };
