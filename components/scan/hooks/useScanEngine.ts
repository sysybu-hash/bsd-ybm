"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ScanExtractionV5 } from "@/lib/scan-schema-v5";
import type { ScanEvent, ScanState } from "@/components/scan/state/scan-machine";

type UseScanEngineOptions = {
  state: ScanState;
  dispatch: (event: ScanEvent) => void;
};

/** שולח את הקובץ למנוע ה-AI ומפרש את זרם ה-NDJSON. ההיגיון היחיד שמדבר עם /api/scan. */
export function useScanEngine({ state, dispatch }: UseScanEngineOptions) {
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.phase !== "extracting" && state.phase !== "uploading") {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    const startedAt = Date.now();
    tickRef.current = setInterval(() => {
      dispatch({ type: "TICK", seconds: Math.floor((Date.now() - startedAt) / 1000) });
    }, 1000);
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [state.phase, dispatch]);

  const startScan = useCallback(async () => {
    const file = state.files[state.activeFileIndex];
    if (!file) return;

    dispatch({ type: "SCAN_STARTED" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("scanMode", state.scanMode);
    formData.append("engineRunMode", state.engineRunMode);
    formData.append("persist", "false");
    if (state.openAiModel) formData.append("openAiModel", state.openAiModel);
    if (state.userInstruction.trim()) formData.append("userInstruction", state.userInstruction.trim());
    if (state.projectLabel.trim()) formData.append("project", state.projectLabel.trim());
    if (state.clientLabel.trim()) formData.append("client", state.clientLabel.trim());

    try {
      const res = await fetch("/api/scan/tri-engine/stream", { method: "POST", body: formData });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        const message = parseFirstErrorLine(text) ?? "הסריקה נכשלה";
        dispatch({ type: "SCAN_FAILED", error: message });
        toast.error(message);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finishedOk = false;
      let lastError: string | null = null;

      const onLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        let event: Record<string, unknown>;
        try {
          event = JSON.parse(trimmed) as Record<string, unknown>;
        } catch {
          return;
        }
        if (event.type === "partial_v5") {
          dispatch({
            type: "STREAM_PARTIAL",
            stage: typeof event.stage === "string" ? event.stage : null,
            v5: (event.v5 as ScanExtractionV5 | null) ?? null,
          });
        } else if (event.type === "done" && event.ok === true && event.aiData) {
          finishedOk = true;
          dispatch({
            type: "SCAN_COMPLETED",
            aiData: event.aiData as Record<string, unknown>,
            v5: (event.v5 as ScanExtractionV5 | null) ?? null,
          });
        } else if (event.type === "error" && typeof event.error === "string") {
          lastError = event.error;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (value) buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        lines.forEach(onLine);
        if (done) break;
      }
      onLine(buffer);

      if (!finishedOk) {
        const message = lastError ?? "הזרם נסגר ללא תוצאה";
        dispatch({ type: "SCAN_FAILED", error: message });
        toast.error(message);
      } else {
        toast.success("הפענוח הושלם");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "שגיאת רשת";
      dispatch({ type: "SCAN_FAILED", error: message });
      toast.error(message);
    }
  }, [state, dispatch]);

  return { startScan };
}

function parseFirstErrorLine(text: string): string | null {
  const firstLine = text.split("\n").find((line) => line.trim());
  if (!firstLine) return null;
  try {
    const parsed = JSON.parse(firstLine) as { error?: string };
    return parsed.error ?? firstLine.slice(0, 500);
  } catch {
    return firstLine.slice(0, 500);
  }
}
