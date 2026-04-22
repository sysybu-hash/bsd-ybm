"use client";

import { Loader2 } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useTransition,
  type ReactNode,
} from "react";
import { useI18n } from "@/components/I18nProvider";

type RunFn = (fn: () => void | Promise<void>) => void;

const WorkspaceShellTransitionContext = createContext<RunFn | null>(null);

function TransitionOverlay() {
  const { t } = useI18n();
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center bg-white/60 backdrop-blur-[3px]"
      aria-busy
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-5 py-4 text-sm font-bold text-slate-800 shadow-xl">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[color:var(--axis-clients)]" aria-hidden />
        <span>{t("workspaceShell.refreshingOverlay")}</span>
      </div>
    </div>
  );
}

/**
 * עוטף פעולות כמו `router.refresh()` / `update()` ב־`startTransition` ומציג שכבת טעינה קלה.
 * משתמש בהגדרות אחרי שמירת מקצוע: `runWithShellTransition(async () => { await update(); router.refresh(); })`.
 */
export function WorkspaceShellTransitionProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition();

  const runWithShellTransition = useCallback<RunFn>((fn) => {
    startTransition(() => {
      void Promise.resolve(fn());
    });
  }, []);

  const value = useMemo(() => runWithShellTransition, [runWithShellTransition]);

  return (
    <WorkspaceShellTransitionContext.Provider value={value}>
      {isPending ? <TransitionOverlay /> : null}
      {children}
    </WorkspaceShellTransitionContext.Provider>
  );
}

export function useWorkspaceShellTransition(): RunFn {
  const ctx = useContext(WorkspaceShellTransitionContext);
  if (!ctx) {
    return (fn) => {
      void Promise.resolve(fn());
    };
  }
  return ctx;
}
