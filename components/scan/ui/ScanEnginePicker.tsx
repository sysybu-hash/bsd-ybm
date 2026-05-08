"use client";

import type { EngineRunMode } from "@/components/scan/state/scan-machine";

type Props = {
  value: EngineRunMode;
  onChange: (mode: EngineRunMode) => void;
};

const OPTIONS: Array<{ id: EngineRunMode; label: string; hint: string }> = [
  { id: "AUTO", label: "אוטומטי", hint: "AI בוחר את המנוע הנכון" },
  { id: "MULTI_PARALLEL", label: "כל המנועים במקביל", hint: "הכי מהיר ועמיד לטעויות" },
  { id: "MULTI_SEQUENTIAL", label: "טור עם נפילה רכה", hint: "חוסך עלות, fallback אוטומטי" },
  { id: "SINGLE_GEMINI", label: "Gemini בלבד", hint: "ראיית עומק כללית" },
  { id: "SINGLE_DOCUMENT_AI", label: "Document AI", hint: "מצוין לחשבוניות" },
  { id: "SINGLE_OPENAI", label: "OpenAI", hint: "Vision ומבנה חופשי" },
];

export default function ScanEnginePicker({ value, onChange }: Props) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {OPTIONS.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-start transition ${
              active
                ? "border-slate-900 bg-slate-950 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            <span className="text-sm font-black">{option.label}</span>
            <span className={`text-[11px] font-semibold ${active ? "text-white/80" : "text-slate-500"}`}>
              {option.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
