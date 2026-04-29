"use client";

import { useCallback, useState } from "react";
import { createExpenseDraftFromAiAction } from "@/app/actions/expenses";
import { toastClientActionFeedback } from "@/lib/polish/action-response-toast";
import { isExpenseLikeScanV5, scanV5ToExpenseAmounts } from "@/lib/expense-from-scan-v5";
import { SCAN_SCHEMA_V5, type ScanExtractionV5 } from "@/lib/scan-schema-v5";
import type { IndustryType } from "@/lib/professions/config";
import type { ScanHubPreviewPayload } from "@/components/MultiEngineScanner";
import ErpMultiEngineScannerLazy from "@/components/erp/ErpMultiEngineScannerLazy";
import { FileText, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  industry: IndustryType;
};

function isV5Extraction(x: unknown): x is ScanExtractionV5 {
  return (
    typeof x === "object" && x !== null && (x as { schemaVersion?: number }).schemaVersion === SCAN_SCHEMA_V5
  );
}

export default function ErpScanExpenseBridge({ industry }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<{
    fileName: string | null;
    extraction: ScanExtractionV5;
  } | null>(null);

  const onScanHubPreviewUpdate = useCallback((snap: ScanHubPreviewPayload) => {
    if (!isV5Extraction(snap.extraction) || !isExpenseLikeScanV5(snap.extraction)) {
      setPreview(null);
      return;
    }
    setPreview({ fileName: snap.fileName, extraction: snap.extraction });
  }, []);

  const onCreateDraft = useCallback(() => {
    if (!preview) return;
    const e = preview.extraction;
    const { amountNet, vat, total } = scanV5ToExpenseAmounts(e);
    const dateYmd = e.date?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? e.documentMetadata?.documentDate?.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    void (async () => {
      setPending(true);
      try {
        const r = await toastClientActionFeedback(
          () =>
            createExpenseDraftFromAiAction({
              vendorName: e.vendor?.trim() || "ספק (השלימו)",
              amountNet,
              vat,
              total,
              expenseDate: dateYmd,
              description: e.summary?.trim() || (e.docType && e.docType !== "UNKNOWN" ? e.docType : undefined),
              aiExtractedJson: e as object,
            }),
          {
            successMessage: "נוצרה טיוטת הוצאה — ניתן לערוך בטאב «הוצאות»",
            loadingMessage: "יוצר טיוטה מהסריקה…",
            errorFallback: "יצירת טיוטת ההוצאה מהסריקה נכשלה",
          },
        );
        if (r && typeof r === "object" && "ok" in r && (r as { ok: boolean }).ok) {
          setPreview(null);
          router.push("/app/erp?tab=expenses");
          router.refresh();
        }
      } finally {
        setPending(false);
      }
    })();
  }, [preview, router]);

  return (
    <div className="w-full min-w-0 space-y-4" id="erp-scan-expense">
      {preview ? (
        <div
          className="rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] p-4 shadow-sm"
          dir="rtl"
        >
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 shrink-0 text-[color:var(--axis-ai)]" aria-hidden />
            <span className="font-black text-[color:var(--ink-900)]">זוהו נתוני הוצאה / חשבונית ספק</span>
            {preview.fileName ? (
              <span className="inline-flex items-center gap-1 text-xs text-[color:var(--ink-500)]">
                <FileText className="h-3.5 w-3.5" aria-hidden />
                {preview.fileName}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-[color:var(--ink-600)]">
            ספק: <span className="font-bold text-[color:var(--ink-800)]">{preview.extraction.vendor}</span>
            {" · "}
            {(() => {
              const { total } = scanV5ToExpenseAmounts(preview.extraction);
              return <>סה״כ מוערך: ₪{total.toFixed(2)}</>;
            })()}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={onCreateDraft}
              className="rounded-xl bg-[color:var(--axis-finance)] px-4 py-2 text-sm font-black text-white shadow-sm hover:opacity-95 disabled:opacity-50"
            >
              צרו טיוטת הוצאה
            </button>
          </div>
        </div>
      ) : null}
      <ErpMultiEngineScannerLazy industry={industry} onScanHubPreviewUpdate={onScanHubPreviewUpdate} />
    </div>
  );
}
