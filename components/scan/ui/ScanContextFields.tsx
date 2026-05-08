"use client";

type Props = {
  projectLabel: string;
  clientLabel: string;
  userInstruction: string;
  onProjectChange: (value: string) => void;
  onClientChange: (value: string) => void;
  onInstructionChange: (value: string) => void;
};

export default function ScanContextFields({
  projectLabel,
  clientLabel,
  userInstruction,
  onProjectChange,
  onClientChange,
  onInstructionChange,
}: Props) {
  return (
    <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-black text-slate-700">
          פרויקט
          <input
            type="text"
            value={projectLabel}
            onChange={(e) => onProjectChange(e.target.value)}
            placeholder="אופציונלי"
            className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:bg-white"
          />
        </label>
        <label className="text-xs font-black text-slate-700">
          לקוח/ספק
          <input
            type="text"
            value={clientLabel}
            onChange={(e) => onClientChange(e.target.value)}
            placeholder="אופציונלי"
            className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:bg-white"
          />
        </label>
      </div>
      <label className="text-xs font-black text-slate-700">
        הנחיה ל-AI (אופציונלי)
        <textarea
          value={userInstruction}
          onChange={(e) => onInstructionChange(e.target.value)}
          placeholder="לדוגמה: התעלם משורות מע״מ, רק פריטי ברזל"
          rows={2}
          className="mt-1 block w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:bg-white"
        />
      </label>
    </div>
  );
}
