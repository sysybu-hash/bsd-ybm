jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

import {
  parseTriEngineRunMode,
  triEngineCreditKindFor,
  validateTriEngineRequest,
  type ParsedTriEngineForm,
} from "@/lib/tri-engine-api-common";

function parsed(overrides: Partial<ParsedTriEngineForm> = {}): ParsedTriEngineForm {
  return {
    file: new File(["x"], "scan.pdf", { type: "application/pdf" }),
    scanMode: "GENERAL_DOCUMENT",
    persist: false,
    projectLabel: null,
    clientLabel: null,
    engineRunMode: "SINGLE_GEMINI",
    ...overrides,
  };
}

describe("tri-engine request policy", () => {
  const originalGemini = process.env.GEMINI_API_KEY;
  const originalOpenAi = process.env.OPENAI_API_KEY;
  const originalDocAiProcessor = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID;
  const originalDocAiOcrProcessor = process.env.GOOGLE_DOCUMENT_AI_OCR_PROCESSOR_ID;
  const originalDocAiExpenseProcessor = process.env.GOOGLE_DOCUMENT_AI_EXPENSE_PROCESSOR_ID;
  const originalDocAiInvoiceProcessor = process.env.GOOGLE_DOCUMENT_AI_INVOICE_PROCESSOR_ID;
  const originalDocAiFormProcessor = process.env.GOOGLE_DOCUMENT_AI_FORM_PROCESSOR_ID;
  const originalDocAiCreds = process.env.GOOGLE_DOCUMENT_AI_CREDENTIALS;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-gemini";
    process.env.OPENAI_API_KEY = "test-openai";
    delete process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID;
    process.env.GOOGLE_DOCUMENT_AI_OCR_PROCESSOR_ID = "test-docai-ocr";
    process.env.GOOGLE_DOCUMENT_AI_EXPENSE_PROCESSOR_ID = "test-docai-expense";
    process.env.GOOGLE_DOCUMENT_AI_INVOICE_PROCESSOR_ID = "test-docai-invoice";
    process.env.GOOGLE_DOCUMENT_AI_FORM_PROCESSOR_ID = "test-docai-form";
    process.env.GOOGLE_DOCUMENT_AI_CREDENTIALS = "{}";
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalGemini;
    process.env.OPENAI_API_KEY = originalOpenAi;
    process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID = originalDocAiProcessor;
    process.env.GOOGLE_DOCUMENT_AI_OCR_PROCESSOR_ID = originalDocAiOcrProcessor;
    process.env.GOOGLE_DOCUMENT_AI_EXPENSE_PROCESSOR_ID = originalDocAiExpenseProcessor;
    process.env.GOOGLE_DOCUMENT_AI_INVOICE_PROCESSOR_ID = originalDocAiInvoiceProcessor;
    process.env.GOOGLE_DOCUMENT_AI_FORM_PROCESSOR_ID = originalDocAiFormProcessor;
    process.env.GOOGLE_DOCUMENT_AI_CREDENTIALS = originalDocAiCreds;
  });

  test("normalizes unknown run modes to auto", () => {
    expect(parseTriEngineRunMode("single_gemini")).toBe("SINGLE_GEMINI");
    expect(parseTriEngineRunMode("surprise")).toBe("AUTO");
  });

  test("charges cheap credits for Gemini-only scans and premium for multi/paid engines", () => {
    expect(triEngineCreditKindFor("GENERAL_DOCUMENT", "SINGLE_GEMINI")).toBe("cheap");
    expect(triEngineCreditKindFor("GENERAL_DOCUMENT", "AUTO")).toBe("cheap");
    expect(triEngineCreditKindFor("DRAWING_BOQ", "AUTO")).toBe("premium");
    expect(triEngineCreditKindFor("INVOICE_FINANCIAL", "SINGLE_DOCUMENT_AI")).toBe("premium");
    expect(triEngineCreditKindFor("GENERAL_DOCUMENT", "SINGLE_OPENAI")).toBe("premium");
    expect(triEngineCreditKindFor("DRAWING_BOQ", "MULTI_PARALLEL")).toBe("premium");
  });

  test("rejects invalid uploads before credits are charged", () => {
    const empty = validateTriEngineRequest(parsed({ file: new File([], "scan.pdf", { type: "application/pdf" }) }));
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.code).toBe("empty_file");

    const unsupported = validateTriEngineRequest(parsed({ file: new File(["x"], "scan.exe", { type: "application/x-msdownload" }) }));
    expect(unsupported.ok).toBe(false);
    if (!unsupported.ok) expect(unsupported.code).toBe("unsupported_file_type");
  });

  test("allows Document AI mode across scan types because OCR and Form Parser are supported", () => {
    const result = validateTriEngineRequest(
      parsed({ scanMode: "DRAWING_BOQ", engineRunMode: "SINGLE_DOCUMENT_AI" }),
    );
    expect(result.ok).toBe(true);
  });

  test("rejects a selected single engine when it is not configured", () => {
    delete process.env.OPENAI_API_KEY;
    const result = validateTriEngineRequest(parsed({ engineRunMode: "SINGLE_OPENAI" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("selected_engine_not_configured");
  });
});
