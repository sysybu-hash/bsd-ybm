"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { saveScannedDocumentAction } from "@/app/actions/save-scanned-document";
import { dispatchScanComplete } from "@/components/app-shell/ScanResultCardPortal";
import type { ScanEvent, ScanState, SaveTarget } from "@/components/scan/state/scan-machine";

type Options = {
  state: ScanState;
  dispatch: (event: ScanEvent) => void;
};

/** שמירת תוצאה ל-ERP/CRM + שידור אירוע סיום שמפעיל את ScanResultCard. */
export function useScanSave({ state, dispatch }: Options) {
  const save = useCallback(
    async (target: SaveTarget) => {
      const file = state.files[state.activeFileIndex];
      if (!file || !state.aiData) return;

      dispatch({ type: "SAVE_STARTED", target });
      try {
        const result = await saveScannedDocumentAction(
          file.name,
          state.aiData,
          target,
          target === "CRM" && state.selectedContactId ? state.selectedContactId : undefined,
        );
        if (!result.success || !result.documentId) {
          const message = result.error ?? "השמירה נכשלה";
          dispatch({ type: "SAVE_FAILED", error: message });
          toast.error(message);
          return;
        }
        dispatch({ type: "SAVE_COMPLETED", documentId: result.documentId });
        dispatchScanComplete({ documentId: result.documentId, target });
        toast.success(target === "ERP" ? "נשמר ל-ERP" : "נשמר ל-CRM");
      } catch (error) {
        const message = error instanceof Error ? error.message : "השמירה נכשלה";
        dispatch({ type: "SAVE_FAILED", error: message });
        toast.error(message);
      }
    },
    [state, dispatch],
  );

  return { save };
}
