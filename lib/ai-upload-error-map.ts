import type { ProcessDocumentResult } from "@/app/actions/process-document";

type FailedProcess = Extract<ProcessDocumentResult, { success: false }>;

/**
 * מיפוי תוצאת כשל מ־processDocumentAction ל־HTTP עקבי עם requireAiScanCredit (402 + ok:false).
 */
export function mapProcessDocumentFailureToHttp(failure: FailedProcess): {
  status: number;
  body: Record<string, unknown>;
} {
  if (failure.code === "QUOTA_EXCEEDED") {
    return {
      status: 402,
      body: {
        ok: false,
        error: failure.error ?? "חרגת ממכסת הסריקות",
        code: failure.code ?? "QUOTA_EXCEEDED",
        billingUrl: "/app/settings/billing",
      },
    };
  }

  return {
    status: 500,
    body: {
      error: failure.error ?? "אירעה שגיאה בפענוח המסמך",
      ...(failure.code !== undefined ? { code: failure.code } : {}),
    },
  };
}
