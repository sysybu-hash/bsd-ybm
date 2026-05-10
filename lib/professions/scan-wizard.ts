import type { ScanModeV5 } from "@/lib/scan-schema-v5";
import type { EngineRunMode, SaveTarget } from "@/components/scan/state/scan-machine";
import type { IndustryType } from "@/lib/professions/config";
import type { ConstructionTradeId } from "@/lib/construction-trades";
import { normalizeIndustryType } from "@/lib/professions/config";
import { normalizeConstructionTrade } from "@/lib/construction-trades";

/**
 * Scan-wizard profile: the per-industry/per-trade content that drives
 * every label, prompt, example, engine recommendation and result column
 * shown inside the new ScanWizardShell.
 *
 * Same skeleton for every profession; only this config differs.
 */

export type EngineCardId = "RECOMMENDED" | "FAST" | "ADVANCED";

export type EngineCardConfig = {
  id: EngineCardId;
  label: string;
  hint: string;
  engineRunMode: EngineRunMode;
  estimatedSeconds: number;
  creditsCost: number;
};

export type ScanModeOption = {
  id: ScanModeV5;
  label: string;
  description: string;
  icon: "invoice" | "drawing" | "general";
};

export type ContextFieldConfig = {
  key: "project" | "client" | "instruction";
  label: string;
  placeholder: string;
  required: boolean;
  multiline?: boolean;
};

export type InstructionExample = {
  id: string;
  text: string;
};

export type ResultColumnConfig = {
  key: string;
  label: string;
  /** איזה שדות ב-aiData / lineItem להעדיף, לפי סדר */
  candidates?: string[];
  align?: "start" | "end";
  emphasize?: boolean;
};

export type ScanWizardProfile = {
  /** מזהה הענף + תווית מקצוע (קבלן ראשי / חשמלאי / וכו') לתצוגה */
  industryId: IndustryType;
  industryLabel: string;
  tradeId?: ConstructionTradeId;
  tradeLabel?: string;

  /** כותרת ראשית של ה-Hero (לדוגמה: "אשף סריקה לקבלן ראשי") */
  heroTitle: string;
  heroSubtitle: string;

  /** מצבי סריקה זמינים, בסדר תצוגה */
  scanModes: ScanModeOption[];
  defaultScanMode: ScanModeV5;

  /** רמזים בעת העלאת קבצים */
  uploadAcceptHint: string;
  uploadSizeHint: string;

  /** שלב 2: הקשר */
  contextFields: ContextFieldConfig[];
  instructionExamples: InstructionExample[];

  /** שלב 3: מנועים — 3 כרטיסים */
  engineCards: EngineCardConfig[];
  defaultEngineCard: EngineCardId;

  /** שלב 4: תוצאה */
  resultColumns: ResultColumnConfig[];
  /** "ספק" / "מטופל" / "צד" — איך מציגים את ה-vendor הראשי */
  vendorLabel: string;
  /** "סך" / "סכום העסקה" */
  totalLabel: string;
  /** מילה לפריטי שורה: "פריטים" / "עבודות" / "שירותים" */
  lineItemsLabel: string;

  /** ברירת מחדל ליעד שמירה */
  defaultSaveTarget: SaveTarget;
  saveTargetLabels: { ERP: string; CRM: string };

  /** כמה קרדיטים זמינים בחבילה — נתונים אינדיקטיביים בלבד (UI). השרת אוכף בנפרד. */
  hintCreditsLabel: string;
};

const ENGINE_CARDS_DEFAULT: EngineCardConfig[] = [
  {
    id: "RECOMMENDED",
    label: "מומלץ",
    hint: "מנוע אחד שהוכיח את עצמו לתחום שלך",
    engineRunMode: "AUTO",
    estimatedSeconds: 18,
    creditsCost: 1,
  },
  {
    id: "FAST",
    label: "מהיר",
    hint: "תוצאה זריזה מ-Gemini בלבד",
    engineRunMode: "SINGLE_GEMINI",
    estimatedSeconds: 10,
    creditsCost: 1,
  },
  {
    id: "ADVANCED",
    label: "מתקדם",
    hint: "כל המנועים במקביל — דיוק מקסימלי",
    engineRunMode: "MULTI_PARALLEL",
    estimatedSeconds: 35,
    creditsCost: 3,
  },
];

const RESULT_COLUMNS_DEFAULT: ResultColumnConfig[] = [
  { key: "description", label: "פריט", candidates: ["description", "name", "item"] },
  { key: "quantity", label: "כמות", candidates: ["quantity", "qty"], align: "end" },
  { key: "unitPrice", label: "מחיר יחידה", candidates: ["unitPrice", "price", "rate"], align: "end" },
  { key: "lineTotal", label: "סה״כ", candidates: ["lineTotal", "total", "amount"], align: "end", emphasize: true },
];

/**
 * Profile עבור קבלן ראשי / ליווי פרויקט (CONSTRUCTION + GENERAL_CONTRACTOR).
 * זהו הפרופיל הראשון שנכתב במלואו — הוא ישמש כברירת מחדל לכל ה-CONSTRUCTION
 * עד שיהיו פרופילים ייעודיים לחשמלאי/אינסטלטור/וכו׳.
 */
const PROFILE_GENERAL_CONTRACTOR: ScanWizardProfile = {
  industryId: "CONSTRUCTION",
  industryLabel: "קבלנות / בנייה",
  tradeId: "GENERAL_CONTRACTOR",
  tradeLabel: "קבלן ראשי / ליווי פרויקט",
  heroTitle: "אשף סריקה לקבלן ראשי",
  heroSubtitle: "חשבוניות חומרים, יומני עבודה, אישורי מהנדס וכתבי כמויות — סריקה אחת, כל המידע בפנים.",
  scanModes: [
    {
      id: "INVOICE_FINANCIAL",
      label: "חשבונית / קבלה",
      description: "ספק חומרים, סכום, פריטים",
      icon: "invoice",
    },
    {
      id: "DRAWING_BOQ",
      label: "כתב כמויות / תכנית",
      description: "BOQ, אומדן, פירוט שלבים",
      icon: "drawing",
    },
    {
      id: "GENERAL_DOCUMENT",
      label: "מסמך כללי",
      description: "יומן עבודה, אישור מהנדס, חוזה",
      icon: "general",
    },
  ],
  defaultScanMode: "INVOICE_FINANCIAL",
  uploadAcceptHint: "PDF, JPG, PNG עד 25MB",
  uploadSizeHint: "אפשר להעלות מספר קבצים",
  contextFields: [
    { key: "project", label: "פרויקט / אתר עבודה", placeholder: "למשל: בניין משרדים רחוב הרצל", required: false },
    { key: "client", label: "ספק / יזם", placeholder: "למשל: כליל בטונים בע״מ", required: false },
    {
      key: "instruction",
      label: "הנחיה ל-AI (אופציונלי)",
      placeholder: "התעלם משורות מע״מ, רק פריטי ברזל וברגים",
      required: false,
      multiline: true,
    },
  ],
  instructionExamples: [
    { id: "ex-iron", text: "תתמקד בכמויות ברזל ובטון" },
    { id: "ex-vat", text: "התעלם משורות מע״מ" },
    { id: "ex-stage", text: "סווג לפי שלב ביצוע" },
    { id: "ex-cost", text: "סמן פריטים שחורגים מהאומדן" },
  ],
  engineCards: ENGINE_CARDS_DEFAULT,
  defaultEngineCard: "RECOMMENDED",
  resultColumns: [
    { key: "description", label: "חומר / שירות", candidates: ["description", "name", "material_or_service"] },
    { key: "quantity", label: "כמות", candidates: ["quantity", "qty"], align: "end" },
    { key: "unit", label: 'יח׳', candidates: ["unit", "uom"], align: "end" },
    { key: "unitPrice", label: "מחיר", candidates: ["unitPrice", "price"], align: "end" },
    { key: "lineTotal", label: "סה״כ", candidates: ["lineTotal", "total", "total_amount"], align: "end", emphasize: true },
  ],
  vendorLabel: "ספק",
  totalLabel: "סה״כ לתשלום",
  lineItemsLabel: "פריטים",
  defaultSaveTarget: "ERP",
  saveTargetLabels: { ERP: "שמור ב-ERP (כספים ופרויקט)", CRM: "שמור ב-CRM (איש קשר)" },
  hintCreditsLabel: "סריקות",
};

/** ברירת מחדל גנרית — לכל תחום שעדיין אין לו פרופיל ייעודי. */
function makeFallbackProfile(industryId: IndustryType, industryLabel: string): ScanWizardProfile {
  const isLegal = industryId === "LEGAL";
  return {
    industryId,
    industryLabel,
    heroTitle: `אשף סריקה — ${industryLabel}`,
    heroSubtitle: "העלה מסמך, תן הקשר קצר, ה-AI יחלץ את הנתונים ויסנכרן למערכת.",
    scanModes: [
      {
        id: "INVOICE_FINANCIAL",
        label: "חשבונית / קבלה",
        description: "ספק, סכום, פריטים",
        icon: "invoice",
      },
      {
        id: "GENERAL_DOCUMENT",
        label: "מסמך כללי",
        description: "כל סוג של מסמך עסקי",
        icon: "general",
      },
    ],
    defaultScanMode: isLegal ? "GENERAL_DOCUMENT" : "INVOICE_FINANCIAL",
    uploadAcceptHint: "PDF, JPG, PNG עד 25MB",
    uploadSizeHint: "אפשר להעלות מספר קבצים",
    contextFields: [
      { key: "project", label: isLegal ? "תיק" : "פרויקט", placeholder: "אופציונלי", required: false },
      { key: "client", label: isLegal ? "מיוצג" : "לקוח / ספק", placeholder: "אופציונלי", required: false },
      {
        key: "instruction",
        label: "הנחיה ל-AI (אופציונלי)",
        placeholder: "מה חשוב לך שה-AI ישים לב אליו?",
        required: false,
        multiline: true,
      },
    ],
    instructionExamples: [
      { id: "ex-1", text: "סכם בקצרה" },
      { id: "ex-2", text: "חלץ סכומים ותאריכים" },
      { id: "ex-3", text: "הצמד לשפה הקיימת במסמך" },
    ],
    engineCards: ENGINE_CARDS_DEFAULT,
    defaultEngineCard: "RECOMMENDED",
    resultColumns: RESULT_COLUMNS_DEFAULT,
    vendorLabel: isLegal ? "צד" : "ספק",
    totalLabel: "סך",
    lineItemsLabel: "שורות",
    defaultSaveTarget: isLegal ? "CRM" : "ERP",
    saveTargetLabels: { ERP: "שמור ב-ERP", CRM: "שמור ב-CRM" },
    hintCreditsLabel: "סריקות",
  };
}

const INDUSTRY_FALLBACK_LABELS: Record<IndustryType, string> = {
  GENERAL: "ניהול כללי",
  LEGAL: "משרד עורכי דין",
  ACCOUNTING: "ראיית חשבון",
  CONSTRUCTION: "קבלנות / בנייה",
  MEDICAL: "קליניקה",
  RETAIL: "מסחר וקמעונאות",
  REAL_ESTATE: "נדל״ן ותיווך",
};

/**
 * נקודת הכניסה היחידה: מחזיר ScanWizardProfile מלא לפי industry + trade.
 * אם אין פרופיל ייעודי — מחזיר fallback גנרי שעובד.
 */
export function getScanWizardProfile(
  industryRaw?: string | null,
  constructionTradeRaw?: string | null,
): ScanWizardProfile {
  const industryId = normalizeIndustryType(industryRaw);
  const industryLabel = INDUSTRY_FALLBACK_LABELS[industryId];

  if (industryId === "CONSTRUCTION") {
    const trade = normalizeConstructionTrade(constructionTradeRaw);
    if (trade === "GENERAL_CONTRACTOR") {
      return PROFILE_GENERAL_CONTRACTOR;
    }
    // עד שייכתבו פרופילים ייעודיים לכל trade, נשתמש בפרופיל הקבלן הראשי
    // עם החלפת התווית כך שהמשתמש רואה את המקצוע שלו.
    return {
      ...PROFILE_GENERAL_CONTRACTOR,
      tradeId: trade,
      tradeLabel: industryLabel,
      heroTitle: PROFILE_GENERAL_CONTRACTOR.heroTitle,
    };
  }

  return makeFallbackProfile(industryId, industryLabel);
}
