"use client";

import type { DropzoneState } from "react-dropzone";
import { UploadCloud } from "lucide-react";

type Props = Pick<DropzoneState, "getRootProps" | "getInputProps" | "isDragActive">;

export default function ScanDropzone({ getRootProps, getInputProps, isDragActive }: Props) {
  return (
    <div
      {...getRootProps()}
      className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition ${
        isDragActive
          ? "border-violet-500 bg-violet-50/70"
          : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
        <UploadCloud className="h-6 w-6" aria-hidden />
      </div>
      <div>
        <p className="text-base font-black text-slate-950">
          {isDragActive ? "שחרר כאן" : "גרור קובץ או הקלק לבחירה"}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          PDF, JPG, PNG · עד 25MB · ניתן לבחור מספר קבצים
        </p>
      </div>
    </div>
  );
}
