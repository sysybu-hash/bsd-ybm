"use client";

import { FileSpreadsheet, FileText, Layers3 } from "lucide-react";
import type { ScanModeV5 } from "@/lib/scan-schema-v5";

type Props = {
  value: ScanModeV5;
  onChange: (mode: ScanModeV5) => void;
};

const MODES: Array<{ id: ScanModeV5; label: string; description: string; icon: typeof FileText }> = [
  { id: "INVOICE_FINANCIAL", label: "חשבונית", description: "ספק/סכום/פריטים", icon: FileSpreadsheet },
  { id: "DRAWING_BOQ", label: "כתב כמויות", description: "תוכניות / BOQ", icon: Layers3 },
  { id: "GENERAL_DOCUMENT", label: "כללי", description: "מסמך פתוח", icon: FileText },
];

export default function ScanModePicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const active = value === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-start transition ${
              active
                ? "border-violet-500 bg-violet-50 text-violet-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span className="text-sm font-black">{mode.label}</span>
            <span className="text-[11px] font-semibold opacity-80">{mode.description}</span>
          </button>
        );
      })}
    </div>
  );
}
