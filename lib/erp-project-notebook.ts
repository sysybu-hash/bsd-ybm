import { GoogleGenerativeAI, type Content } from "@google/generative-ai";
import { GEMINI_FLAGSHIP_MODEL } from "@/lib/gemini-model";

/** מודל לצ'אט מחברת פרויקטים — ברירת מחדל: Gemini 3.1 Pro Stable (ניתן לעקוף ב־GEMINI_NOTEBOOK_MODEL). */
const NOTEBOOK_MODEL =
  process.env.GEMINI_NOTEBOOK_MODEL?.trim() || GEMINI_FLAGSHIP_MODEL;

function getGeminiKey(): string | undefined {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
}

export type NotebookChatMessage = { role: "user" | "model"; content: string };

export type NotebookPdfPart = {
  fileName: string;
  base64: string;
  mimeType: string;
};

const SYSTEM_NOTEBOOK_BASE = `You are an expert construction and civil engineering assistant embedded in an ERP.
The user attaches project PDFs (specifications, drawings, bills of quantities, standards, RFIs, submittals).

Rules:
- Ground answers in the attached PDFs whenever possible. If the PDFs do not contain the answer, say clearly that it is not in the sources.
- When you infer a requirement, cite what you can (e.g. drawing sheet, section title, table heading, or approximate page if obvious from structure).
- For engineering requirements, prefer structured answers: bullet lists, numbered steps, materials, grades, dimensions, tolerances, codes/standards referenced, and acceptance criteria.
- If documents conflict, point out the conflict and quote or paraphrase both sides briefly.
- When bill-of-quantities (BOQ) JSON from the organization's recent scans is provided, use it as supplementary structured context; if it conflicts with a PDF, prefer the PDF for that detail and note the discrepancy.
- Respond in the same language as the user's latest message (Hebrew or English).`;

function buildSystemInstruction(billOfQuantitiesContext: string | null | undefined): string {
  const trimmed = billOfQuantitiesContext?.trim();
  if (!trimmed) return SYSTEM_NOTEBOOK_BASE;
  return `${SYSTEM_NOTEBOOK_BASE}

--- Recent ERP scan — billOfQuantities excerpts (JSON, may be partial) ---
${trimmed.slice(0, 48_000)}`;
}

function buildHistoryWithPdfsInFirstTurn(
  prior: NotebookChatMessage[],
  pdfs: NotebookPdfPart[],
): Content[] {
  const history: Content[] = [];
  for (let i = 0; i < prior.length; i++) {
    const m = prior[i];
    if (m.role === "user" && i === 0 && pdfs.length > 0) {
      history.push({
        role: "user",
        parts: [
          ...pdfs.map((p) => ({
            inlineData: {
              mimeType: p.mimeType || "application/pdf",
              data: p.base64,
            },
          })),
          { text: m.content },
        ],
      });
    } else {
      history.push({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      });
    }
  }
  return history;
}

/**
 * מריץ סבב צ'אט אחד מול Gemini עם היסטוריה + PDFs בצעד המשתמש הראשון.
 * הלקוח שולח מחדש את ה-PDFs בכל בקשה כדי לאחסן state בשרת.
 */
export async function runErpProjectNotebookChat(params: {
  messages: NotebookChatMessage[];
  pdfs: NotebookPdfPart[];
  /** הקשר כמותי מהמסמכים הסרוקים בארגון */
  billOfQuantitiesContext?: string | null;
}): Promise<{ text: string; model: string }> {
  const key = getGeminiKey()?.trim();
  if (!key) {
    throw new Error("חסר GOOGLE_GENERATIVE_AI_API_KEY או GEMINI_API_KEY");
  }

  const { messages, pdfs, billOfQuantitiesContext } = params;
  if (!messages.length) {
    throw new Error("חסרות הודעות");
  }
  const last = messages[messages.length - 1];
  if (last.role !== "user") {
    throw new Error("ההודעה האחרונה חייבת להיות מהמשתמש");
  }
  if (!last.content?.trim()) {
    throw new Error("תוכן ההודעה ריק");
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: NOTEBOOK_MODEL,
    systemInstruction: buildSystemInstruction(billOfQuantitiesContext),
  });

  const prior = messages.slice(0, -1);
  const history = buildHistoryWithPdfsInFirstTurn(prior, pdfs);
  const chat = model.startChat({ history });

  if (prior.length === 0 && pdfs.length > 0) {
    const parts = [
      ...pdfs.map((p) => ({
        inlineData: {
          mimeType: p.mimeType || "application/pdf",
          data: p.base64,
        },
      })),
      { text: last.content.trim() },
    ];
    const result = await chat.sendMessage(parts);
    return { text: result.response.text(), model: NOTEBOOK_MODEL };
  }

  const result = await chat.sendMessage(last.content.trim());
  return { text: result.response.text(), model: NOTEBOOK_MODEL };
}
