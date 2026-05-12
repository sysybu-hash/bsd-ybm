"use client";

import dynamic from "next/dynamic";
import type { IndustryProfile } from "@/lib/professions/runtime";
import type { ScanHubPreviewPayload } from "@/components/multi-engine-scanner/types";
import type { ScanWizardShellVariant } from "@/components/scan/wizard/ScanWizardShell";

const ScanWizardShell = dynamic(() => import("@/components/scan/wizard/ScanWizardShell"), { ssr: false });

type Props = {
  industryProfile: IndustryProfile;
  geminiConfigured: boolean;
  compactHeader?: boolean;
  dockWizard?: boolean;
  /** כפיית מצב מהיר (3 שלבים) גם בדף מלא — ברירת מחדל: false, וב־dock/embed נכפה אוטומטית ב־Shell */
  expressMode?: boolean;
  hubPreviewMode?: boolean;
  onScanHubPreviewUpdate?: (snapshot: ScanHubPreviewPayload) => void;
  onHubPreviewFocusRequest?: () => void;
};

function resolveVariant(props: Props): ScanWizardShellVariant {
  if (props.dockWizard) return "dock";
  if (props.compactHeader) return "embed";
  return "page";
}

/** עטיפה דינמית סביב ScanWizardShell — תאימות ל-importים קיימים ב-ERP ובמסמכים */
export default function ErpMultiEngineScannerLazy(props: Props) {
  const variant = resolveVariant(props);
  return (
    <ScanWizardShell
      industryProfile={props.industryProfile}
      geminiConfigured={props.geminiConfigured}
      variant={variant}
      expressMode={props.expressMode}
      hubPreviewMode={props.hubPreviewMode}
      onScanHubPreviewUpdate={props.onScanHubPreviewUpdate}
      onHubPreviewFocusRequest={props.onHubPreviewFocusRequest}
    />
  );
}
