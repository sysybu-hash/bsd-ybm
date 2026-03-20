/** Calendar dates (YYYY-MM-DD) → unix seconds for Meckano `from_ts` / `to_ts`. */
export function isoDateRangeToUnixSeconds(
  fromDate: string,
  toDate: string
): { from_ts: number; to_ts: number } {
  const fromMs = Date.parse(`${fromDate.trim()}T00:00:00.000Z`);
  const toMs = Date.parse(`${toDate.trim()}T23:59:59.999Z`);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || fromMs > toMs) {
    throw new Error('invalid_date_range');
  }
  return { from_ts: Math.floor(fromMs / 1000), to_ts: Math.floor(toMs / 1000) };
}
