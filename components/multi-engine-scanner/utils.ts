import {
  CheckCircle2,
  ChevronLeft,
  Gauge,
  Loader2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ScanExtractionV5 } from "@/lib/scan-schema-v5";
import type { EnginePhase } from "./types";

export function truncateText(value: string, max: number) {
  const text = value.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

export function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export function readV5FromAiData(ai: Record<string, unknown> | null): ScanExtractionV5 | null {
  if (!ai) return null;
  const raw = ai._v5;
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;
  if (candidate.schemaVersion !== 5) return null;
  return raw as ScanExtractionV5;
}

export function phaseLabel(phase: EnginePhase) {
  if (phase === "running") return "רץ";
  if (phase === "ok") return "הושלם";
  if (phase === "error") return "נכשל";
  if (phase === "skipped") return "דולג";
  return "מוכן";
}

export function engineProgress(phase: EnginePhase, scanning: boolean, elapsed: number, offset: number) {
  if (phase === "ok" || phase === "error" || phase === "skipped") return 100;
  if (phase === "running") return Math.min(94, 18 + elapsed * 7 + offset);
  return scanning ? 8 : 0;
}

export function progressTone(phase: EnginePhase) {
  if (phase === "ok") return "bg-emerald-500";
  if (phase === "error") return "bg-rose-500";
  if (phase === "skipped") return "bg-[color:var(--ink-300)]";
  if (phase === "running") return "bg-blue-600";
  return "bg-[color:var(--canvas-sunken)]";
}

export function phaseIcon(phase: EnginePhase): LucideIcon {
  if (phase === "running") return Loader2;
  if (phase === "ok") return CheckCircle2;
  if (phase === "error") return XCircle;
  if (phase === "skipped") return ChevronLeft;
  return Gauge;
}

export function fileSizeLabel(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
