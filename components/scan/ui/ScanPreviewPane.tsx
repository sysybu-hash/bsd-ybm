"use client";

import { FileText } from "lucide-react";

type Props = {
  file: File | null;
  url: string | null;
};

export default function ScanPreviewPane({ file, url }: Props) {
  if (!file) {
    return (
      <div className="flex h-full min-h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-400">
        אין תצוגה מקדימה
      </div>
    );
  }

  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  return (
    <div className="h-full min-h-[260px] overflow-hidden rounded-xl border border-slate-200 bg-white">
      {isImage && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={file.name} className="h-full w-full object-contain" />
      ) : isPdf && url ? (
        <iframe src={url} title={file.name} className="h-full w-full" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
          <FileText className="h-10 w-10 text-slate-400" aria-hidden />
          <p className="text-sm font-black text-slate-900">{file.name}</p>
          <p className="text-xs font-semibold text-slate-500">תצוגה מקדימה לא זמינה לסוג זה</p>
        </div>
      )}
    </div>
  );
}
