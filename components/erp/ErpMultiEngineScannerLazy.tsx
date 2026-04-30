"use client";

import dynamic from "next/dynamic";
import type { IndustryType } from "@/lib/professions/config";
import type { ScanHubPreviewPayload } from "@/components/MultiEngineScanner";

const MultiEngineScanner = dynamic(() => import("@/components/MultiEngineScanner"), { ssr: false });

type Props = {
  industry: IndustryType;
  compactHeader?: boolean;
  dockWizard?: boolean;
  onScanHubPreviewUpdate?: (snapshot: ScanHubPreviewPayload) => void;
  hubPreviewMode?: boolean;
  onHubPreviewFocusRequest?: () => void;
};

export default function ErpMultiEngineScannerLazy({
  industry,
  compactHeader,
  dockWizard,
  onScanHubPreviewUpdate,
  hubPreviewMode,
  onHubPreviewFocusRequest,
}: Props) {
  return (
    <MultiEngineScanner
      industry={industry}
      compactHeader={compactHeader}
      dockWizard={dockWizard}
      onScanHubPreviewUpdate={onScanHubPreviewUpdate}
      hubPreviewMode={hubPreviewMode}
      onHubPreviewFocusRequest={onHubPreviewFocusRequest}
    />
  );
}
