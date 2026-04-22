import { Loader2 } from "lucide-react";

/** מסך טעינה קל בעת ניווט בין מקטעי `/app` (כולל רענון RSC) */
export default function AppWorkspaceLoading() {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center px-4 py-16"
      aria-busy
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-5 py-4 text-sm font-bold text-slate-700 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-[color:var(--axis-clients)]" aria-hidden />
        <span className="text-slate-600">טוען…</span>
      </div>
    </div>
  );
}
