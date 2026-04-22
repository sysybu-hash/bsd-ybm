import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * מעטפת ויזואלית אחידה (glass / industrial slate) למסכי workspace.
 */
/** אחידות זכוכית עם Dock: blur + רוויה + גבול עדין */
export default function WorkspaceEngineeringShell({ children, className = "" }: Props) {
  return (
    <div
      className={`w-full min-w-0 space-y-6 rounded-2xl border border-slate-200/10 bg-[color:var(--canvas-raised)]/82 p-4 shadow-xl backdrop-blur-xl backdrop-saturate-150 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}
