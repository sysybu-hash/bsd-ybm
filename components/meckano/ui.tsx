import { AlertCircle, Loader2 } from "lucide-react";

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${active ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-100 text-gray-400"}`}>
      {active ? "פעיל" : "לא פעיל"}
    </span>
  );
}

export function CheckStateBadge({ state }: { state: number }) {
  const map: Record<number, { label: string; cls: string }> = {
    0: { label: "לא נרשם", cls: "bg-gray-100 text-gray-400" },
    1: { label: "כניסה", cls: "bg-teal-500/15 text-teal-300" },
    2: { label: "יציאה", cls: "bg-orange-500/20 text-orange-400" },
  };
  const info = map[state] ?? map[0];
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${info.cls}`}>{info.label}</span>;
}

export function MeckanoEmptyHint({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <AlertCircle size={36} className="mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={32} className="animate-spin text-teal-500" />
    </div>
  );
}
