/**
 * Local cache for inactivity timeout (minutes, 1–60).
 * Synced with Firestore `companies/{companyId}.inactivityTimeoutMinutes` (preferred) and `users/{uid}.inactivityTimeoutMinutes`.
 */
export const INACTIVITY_MINUTES_STORAGE_KEY = 'bsd-ybm:inactivity-timeout-minutes';

export const DEFAULT_INACTIVITY_MINUTES = 10;
export const MIN_INACTIVITY_MINUTES = 1;
export const MAX_INACTIVITY_MINUTES = 60;

export const DEFAULT_INACTIVITY_MS = DEFAULT_INACTIVITY_MINUTES * 60_000;

export function clampInactivityMinutes(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_INACTIVITY_MINUTES;
  return Math.min(MAX_INACTIVITY_MINUTES, Math.max(MIN_INACTIVITY_MINUTES, Math.round(n)));
}

export function readInactivityMinutesFromLocalStorage(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(INACTIVITY_MINUTES_STORAGE_KEY);
    if (raw == null) return null;
    return clampInactivityMinutes(Number(raw));
  } catch {
    return null;
  }
}

export function writeInactivityMinutesToLocalStorage(minutes: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(INACTIVITY_MINUTES_STORAGE_KEY, String(clampInactivityMinutes(minutes)));
  } catch {
    /* quota */
  }
}

export function minutesToMs(minutes: number): number {
  return clampInactivityMinutes(minutes) * 60_000;
}
