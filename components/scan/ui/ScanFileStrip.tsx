"use client";

import { FileText, X } from "lucide-react";

type Props = {
  files: File[];
  activeIndex: number;
  previewUrls: (string | null)[];
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
};

function fileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export default function ScanFileStrip({ files, activeIndex, previewUrls, onSelect, onRemove }: Props) {
  if (files.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {files.map((file, index) => {
        const active = index === activeIndex;
        const url = previewUrls[index];
        return (
          <div
            key={`${file.name}-${index}`}
            className={`group relative flex shrink-0 flex-col items-stretch overflow-hidden rounded-xl border transition ${
              active ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-white hover:border-slate-300"
            }`}
            style={{ width: 132 }}
          >
            <button
              type="button"
              onClick={() => onSelect(index)}
              className="flex flex-col items-center gap-1 p-2"
            >
              <div className="flex h-16 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                {url && file.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={file.name} className="h-full w-full object-cover" />
                ) : (
                  <FileText className="h-6 w-6 text-slate-500" aria-hidden />
                )}
              </div>
              <p className="w-full truncate text-[11px] font-black text-slate-900">{file.name}</p>
              <p className="text-[10px] font-semibold text-slate-500">{fileSizeLabel(file.size)}</p>
            </button>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute end-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-slate-500 opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-rose-600"
              aria-label="הסר קובץ"
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
