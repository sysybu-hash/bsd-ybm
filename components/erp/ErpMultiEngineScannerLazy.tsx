"use client";

import dynamic from "next/dynamic";
import type { IndustryType } from "@/lib/professions/config";
import type { ScanHubPreviewPayload } from "@/components/MultiEngineScanner";

const MultiEngineScanner = dynamic(() => import("@/components/MultiEngineScanner"), { ssr: false });

type Props = {
  industry: IndustryType;
  compactHeader?: boolean;
  onScanHubPreviewUpdate?: (snapshot: ScanHubPreviewPayload) => void;
  hubPreviewMode?: boolean;
  onHubPreviewFocusRequest?: () => void;
};

export default function ErpMultiEngineScannerLazy({
  industry,
  compactHeader,
  onScanHubPreviewUpdate,
  hubPreviewMode,
  onHubPreviewFocusRequest,
}: Props) {
  return (
    <MultiEngineScanner
      industry={industry}
      compactHeader={compactHeader}
      onScanHubPreviewUpdate={onScanHubPreviewUpdate}
      hubPreviewMode={hubPreviewMode}
      onHubPreviewFocusRequest={onHubPreviewFocusRequest}
    />
  );
}
