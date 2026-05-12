"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GripHorizontal, X } from "lucide-react";

export type AdaptiveWidgetShellProps = Readonly<{
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  /** מיקום התחלתי בפיקסלים (מגבולות הקנבס) */
  initialOffset?: { x: number; y: number };
  defaultOpen?: boolean;
  onDismiss?: () => void;
  className?: string;
}>;

/**
 * עטיפת וידג'ט שנוצר דינמית — זכוכית, גרירה מדומה, סגירה מהירה.
 */
export default function AdaptiveWidgetShell({
  title,
  subtitle,
  badge,
  children,
  initialOffset = { x: 0, y: 0 },
  defaultOpen = true,
  onDismiss,
  className = "",
}: AdaptiveWidgetShellProps) {
  const reduceMotion = useReducedMotion();
  const shellId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [offset, setOffset] = useState(initialOffset);
  const dragState = useRef<{
    active: boolean;
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    captureEl: HTMLElement | null;
  } | null>(null);

  const handleDismiss = useCallback(() => {
    setOpen(false);
    onDismiss?.();
  }, [onDismiss]);

  useEffect(() => {
    if (!dragState.current?.active) return;

    const onMove = (ev: PointerEvent) => {
      const s = dragState.current;
      if (!s?.active || ev.pointerId !== s.pointerId) return;
      const dx = ev.clientX - s.startX;
      const dy = ev.clientY - s.startY;
      setOffset({ x: s.originX + dx, y: s.originY + dy });
    };

    const onUp = (ev: PointerEvent) => {
      const s = dragState.current;
      if (!s?.active || ev.pointerId !== s.pointerId) return;
      dragState.current = null;
      try {
        s.captureEl?.releasePointerCapture(ev.pointerId);
      } catch {
        /* אלמנט כבר unmount או לכידה שוחררה */
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const onHeaderPointerDown = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (ev.button !== 0) return;
    const el = ev.currentTarget;
    el.setPointerCapture(ev.pointerId);
    dragState.current = {
      active: true,
      pointerId: ev.pointerId,
      startX: ev.clientX,
      startY: ev.clientY,
      originX: offset.x,
      originY: offset.y,
      captureEl: el,
    };
  };

  const spring = { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.85 };
  const transition = reduceMotion
    ? { duration: 0.2 }
    : {
        opacity: spring,
        scale: spring,
        x: { type: "tween" as const, duration: 0 },
        y: { type: "tween" as const, duration: 0 },
      };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="region"
          aria-labelledby={`${shellId}-title`}
          layout={false}
          initial={
            reduceMotion
              ? false
              : { opacity: 0, scale: 0.94, x: offset.x, y: offset.y + 16 }
          }
          animate={{ opacity: 1, scale: 1, x: offset.x, y: offset.y }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: offset.y + 10 }}
          transition={transition}
          className={[
            "pointer-events-auto relative w-[min(100%,22rem)] max-w-[min(92vw,24rem)]",
            "rounded-[1.35rem] border border-white/[0.14] bg-gradient-to-br from-white/[0.12] via-white/[0.06] to-white/[0.03]",
            "shadow-[0_24px_80px_-24px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12)]",
            "backdrop-blur-2xl backdrop-saturate-150",
            "before:pointer-events-none before:absolute before:inset-0 before:rounded-[1.35rem]",
            "before:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(120,200,255,0.14),transparent_55%)]",
            "after:pointer-events-none after:absolute after:inset-px after:rounded-[1.3rem] after:ring-1 after:ring-white/10",
            className,
          ].join(" ")}
        >
          <div
            className="relative z-10 flex cursor-grab select-none items-center gap-2 border-b border-white/[0.08] px-3 py-2.5 active:cursor-grabbing"
            onPointerDown={onHeaderPointerDown}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-white/70 ring-1 ring-white/10">
              <GripHorizontal className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p id={`${shellId}-title`} className="truncate text-sm font-semibold tracking-tight text-white">
                  {title}
                </p>
                {badge ? (
                  <span className="shrink-0 rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-100/90 ring-1 ring-cyan-300/25">
                    {badge}
                  </span>
                ) : null}
              </div>
              {subtitle ? <p className="truncate text-xs text-white/55">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300/70"
              aria-label="סגור וידג'ט"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="relative z-10 max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain px-3 py-3 text-white/90">
            {children}
          </div>

          <div
            className="pointer-events-none absolute -inset-px rounded-[1.35rem] opacity-70 blur-xl"
            style={{
              background:
                "radial-gradient(60% 80% at 50% 0%, rgba(56,189,248,0.22), transparent 70%), radial-gradient(70% 60% at 100% 100%, rgba(168,85,247,0.18), transparent 65%)",
            }}
            aria-hidden
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
