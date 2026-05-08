"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { DROPZONE_ACCEPT, MAX_SCAN_FILE_BYTES } from "@/lib/scan-mime";
import type { ScanEvent } from "@/components/scan/state/scan-machine";

type UseScanUploadOptions = {
  dispatch: (event: ScanEvent) => void;
  files: File[];
  activeFileIndex: number;
  /** מקסימום קבצים בו-זמנית. */
  maxFiles?: number;
};

/**
 * אחראי לקלט קבצים בלבד: drag-drop, validation, יצירת preview URLs.
 * לא יודע על המנוע, על AI, על הצ'ילדרן בעץ. רק קבצים.
 */
export function useScanUpload({ dispatch, files, activeFileIndex, maxFiles = 5 }: UseScanUploadOptions) {
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);

  useEffect(() => {
    const urls = files.map((file) =>
      file.type.startsWith("image/") || file.type === "application/pdf" ? URL.createObjectURL(file) : null,
    );
    setPreviewUrls(urls);
    return () => {
      for (const url of urls) {
        if (url) URL.revokeObjectURL(url);
      }
    };
  }, [files]);

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        const first = rejections[0]?.errors[0];
        const message = first?.code === "file-too-large"
          ? "הקובץ גדול מדי. עד 25MB."
          : first?.code === "file-invalid-type"
            ? "סוג קובץ לא נתמך."
            : first?.message ?? "קובץ נדחה";
        toast.error(message);
      }
      if (accepted.length === 0) return;
      const next = [...files, ...accepted].slice(0, maxFiles);
      dispatch({ type: "FILES_SELECTED", files: next });
    },
    [dispatch, files, maxFiles],
  );

  const dropzone = useDropzone({
    onDrop,
    accept: DROPZONE_ACCEPT,
    maxSize: MAX_SCAN_FILE_BYTES,
    maxFiles,
    multiple: maxFiles > 1,
  });

  const removeFile = useCallback(
    (index: number) => dispatch({ type: "FILE_REMOVED", index }),
    [dispatch],
  );

  const setActiveFile = useCallback(
    (index: number) => dispatch({ type: "ACTIVE_FILE_CHANGED", index }),
    [dispatch],
  );

  const activePreviewUrl = previewUrls[activeFileIndex] ?? null;

  return {
    ...dropzone,
    previewUrls,
    activePreviewUrl,
    removeFile,
    setActiveFile,
  };
}
