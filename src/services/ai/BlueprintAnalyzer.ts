/**
 * Vision Blueprint Decoder ("The Gramoshka") — Gemini 1.5 Pro vision for drawings / BOQ drafts.
 * Server-side only (requires API key). Budget sync writes optional Firestore `boqDrafts` under the project.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_ID = 'gemini-1.5-pro';

export type BlueprintWallSegment = {
  id: string;
  label?: string;
  lengthM: number | null;
  notes?: string;
};

export type BlueprintRoom = {
  id: string;
  name: string;
  areaM2: number | null;
};

export type BlueprintFixture = {
  category: string;
  count: number;
  notes?: string;
};

/** Draft bill-of-quantities line for budget alignment. */
export type DraftBoqLine = {
  code: string;
  description: string;
  quantity: number;
  unit: string;
  unitRateNis?: number | null;
  lineTotalNis?: number | null;
};

export type BlueprintAnalysisResult = {
  scaleDetected: string | null;
  confidenceNotes: string[];
  walls: BlueprintWallSegment[];
  rooms: BlueprintRoom[];
  fixtures: BlueprintFixture[];
  draftBoq: DraftBoqLine[];
  rawModelText?: string;
};

const ANALYSIS_PROMPT = `You are a senior quantity surveyor AI for construction (BSD-YBM). Analyze this blueprint or architectural drawing image.

Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "scaleDetected": string | null,
  "confidenceNotes": string[],
  "walls": [{ "id": string, "label"?: string, "lengthM": number | null, "notes"?: string }],
  "rooms": [{ "id": string, "name": string, "areaM2": number | null }],
  "fixtures": [{ "category": string, "count": number, "notes"?: string }],
  "draftBoq": [{ "code": string, "description": string, "quantity": number, "unit": string, "unitRateNis"?: number | null, "lineTotalNis"?: number | null }]
}

Rules:
- Infer scale from bar scale, dimensions, or title block when visible; otherwise scaleDetected null and explain in confidenceNotes.
- Wall lengths: estimate in meters when possible from visible dimensions; else null with short note.
- Room areas in m² when deducible from dimensions or labels.
- Fixtures: count doors, windows, sanitary fixtures, electrical outlets as separate categories when visible.
- draftBoq: derive plausible quantity lines from geometry (e.g. wall area m², concrete m³ stubs) — mark estimates clearly in description.
- Use Hebrew or English labels as shown on the drawing for room names.
`;

function safeParseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function coerceResult(parsed: Record<string, unknown> | null, rawText: string): BlueprintAnalysisResult {
  if (!parsed) {
    return {
      scaleDetected: null,
      confidenceNotes: ['Model returned non-JSON; manual review required.'],
      walls: [],
      rooms: [],
      fixtures: [],
      draftBoq: [],
      rawModelText: rawText.slice(0, 8000),
    };
  }

  const wallsRaw = Array.isArray(parsed.walls) ? parsed.walls : [];
  const roomsRaw = Array.isArray(parsed.rooms) ? parsed.rooms : [];
  const fixturesRaw = Array.isArray(parsed.fixtures) ? parsed.fixtures : [];
  const boqRaw = Array.isArray(parsed.draftBoq) ? parsed.draftBoq : [];
  const notesRaw = Array.isArray(parsed.confidenceNotes) ? parsed.confidenceNotes : [];

  const walls: BlueprintWallSegment[] = wallsRaw.map((w, i) => {
    const o = w as Record<string, unknown>;
    return {
      id: String(o.id ?? `w-${i + 1}`),
      label: typeof o.label === 'string' ? o.label : undefined,
      lengthM: num(o.lengthM),
      notes: typeof o.notes === 'string' ? o.notes : undefined,
    };
  });

  const rooms: BlueprintRoom[] = roomsRaw.map((r, i) => {
    const o = r as Record<string, unknown>;
    return {
      id: String(o.id ?? `r-${i + 1}`),
      name: String(o.name ?? `Room ${i + 1}`),
      areaM2: num(o.areaM2),
    };
  });

  const fixtures: BlueprintFixture[] = fixturesRaw.map((f, i) => {
    const o = f as Record<string, unknown>;
    const c = num(o.count);
    return {
      category: String(o.category ?? `fixture-${i + 1}`),
      count: c != null ? Math.max(0, Math.round(c)) : 0,
      notes: typeof o.notes === 'string' ? o.notes : undefined,
    };
  });

  const draftBoq: DraftBoqLine[] = boqRaw.map((b, i) => {
    const o = b as Record<string, unknown>;
    const qty = num(o.quantity);
    return {
      code: String(o.code ?? `BOQ-${i + 1}`),
      description: String(o.description ?? ''),
      quantity: qty != null ? qty : 0,
      unit: String(o.unit ?? 'ea'),
      unitRateNis: num(o.unitRateNis),
      lineTotalNis: num(o.lineTotalNis),
    };
  });

  return {
    scaleDetected: typeof parsed.scaleDetected === 'string' ? parsed.scaleDetected : null,
    confidenceNotes: notesRaw.map((x) => String(x)),
    walls,
    rooms,
    fixtures,
    draftBoq,
    rawModelText: rawText.length > 4000 ? undefined : rawText,
  };
}

export type BlueprintAnalyzeInput = {
  apiKey: string;
  imageBase64: string;
  mimeType: string;
};

/**
 * Run Gemini 1.5 Pro vision on a single blueprint image (or PDF page rasterized client-side as image).
 */
export async function analyzeBlueprintWithVision(input: BlueprintAnalyzeInput): Promise<BlueprintAnalysisResult> {
  const { apiKey, imageBase64, mimeType } = input;
  if (!apiKey.trim()) {
    throw new Error('Gemini API key missing');
  }
  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const model = genAI.getGenerativeModel({ model: MODEL_ID });

  const part = {
    inlineData: {
      data: imageBase64,
      mimeType: mimeType || 'image/png',
    },
  };

  const result = await model.generateContent([{ text: ANALYSIS_PROMPT }, part]);
  const text = result.response.text();
  const parsed = safeParseJsonObject(text);
  return coerceResult(parsed, text);
}
