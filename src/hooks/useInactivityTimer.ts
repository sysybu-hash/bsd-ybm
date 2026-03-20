'use client';

import { useCallback, useEffect, useRef } from 'react';

export type UseInactivityTimerOptions = {
  /** When false, listeners are not attached. */
  enabled: boolean;
  /** Idle threshold in milliseconds. */
  timeoutMs: number;
  /** Called once when idle threshold elapses (e.g. redirect home). */
  onInactive: () => void;
};

const EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'keypress',
  'scroll',
  'click',
  'touchstart',
  'wheel',
] as const;

/**
 * Resets a timer on user activity. Default consumer: dashboard session → redirect to `/` after idle.
 */
export function useInactivityTimer({ enabled, timeoutMs, onInactive }: UseInactivityTimerOptions): void {
  const onInactiveRef = useRef(onInactive);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onInactiveRef.current = onInactive;
  }, [onInactive]);

  const clear = useCallback(() => {
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const schedule = useCallback(() => {
    clear();
    if (!enabled || timeoutMs <= 0) return;
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      onInactiveRef.current();
    }, timeoutMs);
  }, [enabled, timeoutMs, clear]);

  useEffect(() => {
    if (!enabled || timeoutMs <= 0) {
      clear();
      return undefined;
    }

    schedule();

    const onActivity = () => {
      schedule();
    };

    for (const ev of EVENTS) {
      window.addEventListener(ev, onActivity as EventListener, { passive: true });
    }

    return () => {
      for (const ev of EVENTS) {
        window.removeEventListener(ev, onActivity as EventListener);
      }
      clear();
    };
  }, [enabled, timeoutMs, schedule, clear]);
}
