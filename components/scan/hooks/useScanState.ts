"use client";

import { useReducer } from "react";
import { initialScanState, scanReducer, type ScanEvent, type ScanState } from "@/components/scan/state/scan-machine";

/** React adapter סביב ה-state machine. נקודת הכניסה היחידה ל-state ב-ScanBoard. */
export function useScanState(): {
  state: ScanState;
  dispatch: (event: ScanEvent) => void;
} {
  const [state, dispatch] = useReducer(scanReducer, initialScanState);
  return { state, dispatch };
}
