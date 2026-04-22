import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  jsonBadRequest,
  jsonServerError,
  jsonServiceUnavailable,
  jsonTooManyRequests,
  jsonUnauthorized,
} from "@/lib/api-json";
import { isGeminiConfigured } from "@/lib/ai-providers";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  runErpProjectNotebookChat,
  type NotebookChatMessage,
  type NotebookPdfPart,
} from "@/lib/erp-project-notebook";
import { loadRecentBillOfQuantitiesContext } from "@/lib/load-recent-bill-of-quantities-context";

const MAX_PDFS = 8;
const MAX_RAW_BYTES_PER_FILE = 6 * 1024 * 1024;
const MAX_TOTAL_RAW_BYTES = 18 * 1024 * 1024;
const REQUESTS_PER_HOUR = 40;

function estimateRawBytesFromBase64(b64: string): number {
  const len = b64.length;
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((len * 3) / 4) - padding;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return jsonUnauthorized();
    }

    if (!isGeminiConfigured()) {
      return jsonServiceUnavailable(
        "Gemini לא מוגדר. הגדירו GOOGLE_GENERATIVE_AI_API_KEY או GEMINI_API_KEY.",
        "gemini_not_configured",
      );
    }

    const orgId = session.user.organizationId ?? "";
    const rateKey = orgId
      ? `erp-notebook:org:${orgId}`
      : `erp-notebook:user:${session.user.id}`;
    const rl = await checkRateLimit(rateKey, REQUESTS_PER_HOUR, 60 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Try again after ${rl.resetAt.toISOString()}.`,
          resetAt: rl.resetAt,
        },
        { status: 429 },
      );
    }

    const body = (await req.json()) as {
      messages?: NotebookChatMessage[];
      pdfs?: Array<{ fileName?: string; base64?: string; mimeType?: string }>;
    };

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const rawPdfs = Array.isArray(body.pdfs) ? body.pdfs : [];

    if (rawPdfs.length > MAX_PDFS) {
      return jsonBadRequest(`ניתן להעלות לכל היותר ${MAX_PDFS} קבצי PDF.`, "too_many_pdfs");
    }

    let totalRaw = 0;
    const pdfs: NotebookPdfPart[] = [];
    for (const p of rawPdfs) {
      const fileName = (p.fileName ?? "document.pdf").trim() || "document.pdf";
      const base64 = p.base64?.trim();
      const mimeType = (p.mimeType ?? "application/pdf").trim();
      if (!base64) continue;
      if (mimeType !== "application/pdf") {
        return jsonBadRequest("נתמך רק application/pdf.", "invalid_mime");
      }
      const rawSize = estimateRawBytesFromBase64(base64);
      if (rawSize > MAX_RAW_BYTES_PER_FILE) {
        return jsonBadRequest(
          `הקובץ "${fileName}" חורג ממגבלת ${MAX_RAW_BYTES_PER_FILE / 1024 / 1024}MB.`,
          "file_too_large",
        );
      }
      totalRaw += rawSize;
      pdfs.push({ fileName, base64, mimeType });
    }

    if (totalRaw > MAX_TOTAL_RAW_BYTES) {
      return jsonBadRequest(
        `סה״כ גודל ה-PDF חורג מ-${MAX_TOTAL_RAW_BYTES / 1024 / 1024}MB. הסירו או דחסו קבצים.`,
        "total_size_exceeded",
      );
    }

    const normalizedMessages: NotebookChatMessage[] = messages
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "model") &&
          typeof m.content === "string",
      )
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, 120_000),
      }));

    if (!normalizedMessages.length) {
      return jsonBadRequest("חסרות הודעות (messages).", "missing_messages");
    }

    const boqContext =
      orgId ? await loadRecentBillOfQuantitiesContext(orgId) : null;

    const { text, model } = await runErpProjectNotebookChat({
      messages: normalizedMessages,
      pdfs,
      billOfQuantitiesContext: boqContext,
    });

    return NextResponse.json({ answer: text, model });
  } catch (error) {
    console.error("project-notebook chat:", error);
    const msg =
      error instanceof Error ? error.message : "Notebook chat failed.";
    return jsonServerError(msg.slice(0, 500));
  }
}
