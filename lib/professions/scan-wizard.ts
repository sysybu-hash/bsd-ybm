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

/** משרד עורכי דין */
const PROFILE_LEGAL: ScanWizardProfile = {
  industryId: "LEGAL",
  industryLabel: "משרד עורכי דין",
  heroTitle: "אשף סריקה משפטי",
  heroSubtitle: "חוזים, כתבי טענות, פרוטוקולים והסכמים — חילוץ צדדים, מועדים, סעיפים ושיוך לתיק.",
  scanModes: [
    { id: "GENERAL_DOCUMENT", label: "חוזה / כתב טענות", description: "צדדים, סעיפים, מועדים", icon: "general" },
    { id: "INVOICE_FINANCIAL", label: "שכר טרחה", description: "חיוב לקוח, מע״מ", icon: "invoice" },
  ],
  defaultScanMode: "GENERAL_DOCUMENT",
  uploadAcceptHint: "PDF, JPG, PNG עד 25MB",
  uploadSizeHint: "אפשר להעלות מספר קבצים",
  contextFields: [
    { key: "project", label: "תיק / מספר תיק", placeholder: "למשל: 12345/24 או הדס בע״מ נ׳ פלוני", required: false },
    { key: "client", label: "מיוצג", placeholder: "שם המיוצג / החברה המיוצגת", required: false },
    { key: "instruction", label: "הנחיה ל-AI (אופציונלי)", placeholder: "התמקד בסעיפי שיפוי ובמועדי הגשה", required: false, multiline: true },
  ],
  instructionExamples: [
    { id: "ex-parties", text: "סכם צדדים וסעיפי הפרה" },
    { id: "ex-dates", text: "חלץ מועדים קריטיים" },
    { id: "ex-clauses", text: "סמן סעיפי שיפוי ואחריות" },
    { id: "ex-court", text: "זהה בית משפט וסעדים מבוקשים" },
  ],
  engineCards: ENGINE_CARDS_DEFAULT,
  defaultEngineCard: "RECOMMENDED",
  resultColumns: [
    { key: "description", label: "סעיף", candidates: ["description", "name", "clause"] },
    { key: "party", label: "צד", candidates: ["party", "party_names"] },
    { key: "date", label: "מועד", candidates: ["date", "critical_date", "deadline"], align: "end" },
    { key: "amount", label: "סכום", candidates: ["amount", "lineTotal", "value"], align: "end", emphasize: true },
  ],
  vendorLabel: "צד עיקרי",
  totalLabel: "סכום עסקה",
  lineItemsLabel: "סעיפים",
  defaultSaveTarget: "CRM",
  saveTargetLabels: { ERP: "שמור ב-ERP (חיוב)", CRM: "שמור בתיק לקוח" },
  hintCreditsLabel: "סריקות",
};

/** ראיית חשבון / ייעוץ מס */
const PROFILE_ACCOUNTING: ScanWizardProfile = {
  industryId: "ACCOUNTING",
  industryLabel: "ראיית חשבון",
  heroTitle: "אשף סריקה לרואה חשבון",
  heroSubtitle: "חבילות חשבוניות, תדפיסי בנק ודוחות — חילוץ שורה-שורה עם סיווג לסעיפי מאזן.",
  scanModes: [
    { id: "INVOICE_FINANCIAL", label: "חשבונית מס", description: "פירוט מלא + מע״מ + ח״פ", icon: "invoice" },
    { id: "GENERAL_DOCUMENT", label: "תדפיס בנק / דוח", description: "פעולות, יתרות, סיכומים", icon: "general" },
  ],
  defaultScanMode: "INVOICE_FINANCIAL",
  uploadAcceptHint: "PDF, JPG, PNG עד 25MB",
  uploadSizeHint: "אפשר להעלות חבילה שלמה",
  contextFields: [
    { key: "project", label: "ביקורת / דוח", placeholder: "למשל: ביקורת 2024 — חברת אבן בע״מ", required: false },
    { key: "client", label: "נישום / לקוח", placeholder: "שם הלקוח או הח״פ", required: false },
    { key: "instruction", label: "הנחיה ל-AI (אופציונלי)", placeholder: "סווג כל שורה לסעיף מאזן", required: false, multiline: true },
  ],
  instructionExamples: [
    { id: "ex-vat", text: "פצל מע״מ מסכום כולל" },
    { id: "ex-class", text: "סווג כל שורה לסעיף הנה״ח" },
    { id: "ex-tax", text: "זהה ח״פ ספק לכל חשבונית" },
    { id: "ex-recon", text: "הצלב מול תדפיס בנק" },
  ],
  engineCards: ENGINE_CARDS_DEFAULT,
  defaultEngineCard: "ADVANCED",
  resultColumns: [
    { key: "description", label: "תיאור", candidates: ["description", "name"] },
    { key: "tax_id", label: "ח״פ ספק", candidates: ["tax_id", "vendor_tax_id"], align: "end" },
    { key: "vat_total", label: "מע״מ", candidates: ["vat_total", "vat", "tax"], align: "end" },
    { key: "lineTotal", label: "סה״כ", candidates: ["lineTotal", "total"], align: "end", emphasize: true },
  ],
  vendorLabel: "ספק",
  totalLabel: "סה״כ כולל מע״מ",
  lineItemsLabel: "שורות חיוב",
  defaultSaveTarget: "ERP",
  saveTargetLabels: { ERP: "שמור ב-ERP (פקודת יומן)", CRM: "שמור בתיק לקוח" },
  hintCreditsLabel: "סריקות",
};

/** רפואה / קליניקה */
const PROFILE_MEDICAL: ScanWizardProfile = {
  industryId: "MEDICAL",
  industryLabel: "קליניקה",
  heroTitle: "אשף סריקה רפואי",
  heroSubtitle: "מעבדה, מרשמים, הפניות — סימון ערכים חריגים, מינונים וסיכום קליני.",
  scanModes: [
    { id: "GENERAL_DOCUMENT", label: "תוצאות מעבדה / מרשם", description: "ערכים, תרופות, הפניות", icon: "general" },
    { id: "INVOICE_FINANCIAL", label: "קבלה לטיפול", description: "תשלום מטופל / קופת חולים", icon: "invoice" },
  ],
  defaultScanMode: "GENERAL_DOCUMENT",
  uploadAcceptHint: "PDF, JPG, PNG עד 25MB",
  uploadSizeHint: "אפשר להעלות מספר קבצים",
  contextFields: [
    { key: "project", label: "סדרת טיפולים / ביקור", placeholder: "למשל: שיניים — ביקור 3", required: false },
    { key: "client", label: "מטופל", placeholder: "שם המטופל (לא ת.ז.)", required: false },
    { key: "instruction", label: "הנחיה ל-AI (אופציונלי)", placeholder: "סמן ערכים מחוץ לטווח התקין", required: false, multiline: true },
  ],
  instructionExamples: [
    { id: "ex-out", text: "סמן ערכים חריגים" },
    { id: "ex-meds", text: "זהה תרופות ומינונים" },
    { id: "ex-refer", text: "סכם המלצות והפניות" },
    { id: "ex-trend", text: "השווה למעבדה קודמת" },
  ],
  engineCards: ENGINE_CARDS_DEFAULT,
  defaultEngineCard: "RECOMMENDED",
  resultColumns: [
    { key: "description", label: "ממצא / פריט", candidates: ["description", "name", "clinical_finding", "test"] },
    { key: "value", label: "ערך", candidates: ["value", "result", "quantity"], align: "end" },
    { key: "range", label: "טווח תקין", candidates: ["range", "reference", "normal_range"], align: "end" },
    { key: "urgency", label: "דחיפות", candidates: ["urgency", "flag", "severity"], align: "end", emphasize: true },
  ],
  vendorLabel: "מטופל",
  totalLabel: "סך לתשלום",
  lineItemsLabel: "ממצאים",
  defaultSaveTarget: "CRM",
  saveTargetLabels: { ERP: "שמור ב-ERP (חיוב)", CRM: "שמור בתיק מטופל" },
  hintCreditsLabel: "סריקות",
};

/** מסחר וקמעונאות */
const PROFILE_RETAIL: ScanWizardProfile = {
  industryId: "RETAIL",
  industryLabel: "מסחר וקמעונאות",
  heroTitle: "אשף סריקה למסחר",
  heroSubtitle: "תעודות משלוח, חשבוניות רכש ומלאי — עדכון אוטומטי של מק״טים ועלויות.",
  scanModes: [
    { id: "INVOICE_FINANCIAL", label: "חשבונית רכש / משלוח", description: "ספק, פריטים, עלות", icon: "invoice" },
    { id: "GENERAL_DOCUMENT", label: "הזמנת רכש / קטלוג", description: "פריטים מבוקשים", icon: "general" },
  ],
  defaultScanMode: "INVOICE_FINANCIAL",
  uploadAcceptHint: "PDF, JPG, PNG עד 25MB",
  uploadSizeHint: "אפשר להעלות מספר תעודות",
  contextFields: [
    { key: "project", label: "ספק / הזמנה", placeholder: "למשל: הזמנה 4521 / קוקה-קולה", required: false },
    { key: "client", label: "מחסן / סניף", placeholder: "למשל: סניף ראשי / מחסן צפון", required: false },
    { key: "instruction", label: "הנחיה ל-AI (אופציונלי)", placeholder: "התעלם מסיכום מע״מ, רק פריטים", required: false, multiline: true },
  ],
  instructionExamples: [
    { id: "ex-sku", text: "חלץ מק״ט לכל פריט" },
    { id: "ex-cost", text: "השווה עלות לקטלוג קודם" },
    { id: "ex-batch", text: "זהה אצוות ותאריכי תפוגה" },
    { id: "ex-bar", text: "חלץ ברקודים אם קיימים" },
  ],
  engineCards: ENGINE_CARDS_DEFAULT,
  defaultEngineCard: "RECOMMENDED",
  resultColumns: [
    { key: "sku", label: "מק״ט", candidates: ["sku", "code", "barcode"] },
    { key: "description", label: "תיאור פריט", candidates: ["description", "name", "item"] },
    { key: "quantity", label: "כמות", candidates: ["quantity", "qty", "sku_count"], align: "end" },
    { key: "unitPrice", label: "עלות יחידה", candidates: ["unitPrice", "price", "cost"], align: "end" },
    { key: "lineTotal", label: "סה״כ", candidates: ["lineTotal", "total", "total_cost"], align: "end", emphasize: true },
  ],
  vendorLabel: "ספק",
  totalLabel: "עלות רכש",
  lineItemsLabel: "פריטים",
  defaultSaveTarget: "ERP",
  saveTargetLabels: { ERP: "שמור ב-ERP (עדכון מלאי)", CRM: "שמור ברשומת ספק" },
  hintCreditsLabel: "סריקות",
};

/** נדל״ן ותיווך */
const PROFILE_REAL_ESTATE: ScanWizardProfile = {
  industryId: "REAL_ESTATE",
  industryLabel: "נדל״ן ותיווך",
  heroTitle: "אשף סריקה לנדל״ן",
  heroSubtitle: "נסחי טאבו, הסכמי מכר ושכירות — חילוץ גוש/חלקה, בעלים, לוח תשלומים.",
  scanModes: [
    { id: "GENERAL_DOCUMENT", label: "נסח טאבו / חוזה", description: "בעלות, הערות, מועדים", icon: "general" },
    { id: "INVOICE_FINANCIAL", label: "חשבונית תיווך / ניהול", description: "חיוב לקוח", icon: "invoice" },
  ],
  defaultScanMode: "GENERAL_DOCUMENT",
  uploadAcceptHint: "PDF, JPG, PNG עד 25MB",
  uploadSizeHint: "אפשר להעלות מספר מסמכים",
  contextFields: [
    { key: "project", label: "נכס", placeholder: "כתובת, גוש/חלקה או מזהה פנימי", required: false },
    { key: "client", label: "קונה / שוכר / בעלים", placeholder: "שם הצד בעסקה", required: false },
    { key: "instruction", label: "הנחיה ל-AI (אופציונלי)", placeholder: "התמקד בלוח תשלומים והערות אזהרה", required: false, multiline: true },
  ],
  instructionExamples: [
    { id: "ex-tabu", text: "חלץ בעלות והערות אזהרה" },
    { id: "ex-pay", text: "זהה לוח תשלומים" },
    { id: "ex-sqm", text: "חלץ שטח, מ״ר ומספר חדרים" },
    { id: "ex-handover", text: "סמן מועד מסירה" },
  ],
  engineCards: ENGINE_CARDS_DEFAULT,
  defaultEngineCard: "RECOMMENDED",
  resultColumns: [
    { key: "block_parcel", label: "גוש/חלקה", candidates: ["block_parcel", "block", "parcel"] },
    { key: "owner_name", label: "בעלים", candidates: ["owner_name", "owner", "party"] },
    { key: "sq_meters", label: "שטח (מ״ר)", candidates: ["sq_meters", "area", "sqm"], align: "end" },
    { key: "amount", label: "סכום", candidates: ["amount", "value", "lineTotal"], align: "end", emphasize: true },
  ],
  vendorLabel: "צד בעסקה",
  totalLabel: "שווי / חיוב",
  lineItemsLabel: "סעיפי חוזה",
  defaultSaveTarget: "CRM",
  saveTargetLabels: { ERP: "שמור ב-ERP (חיוב תיווך)", CRM: "שמור בכרטיס נכס/לקוח" },
  hintCreditsLabel: "סריקות",
};

/** ניהול כללי / רב-תחומי — ברירת מחדל מאוזנת */
const PROFILE_GENERAL: ScanWizardProfile = {
  industryId: "GENERAL",
  industryLabel: "ניהול כללי",
  heroTitle: "אשף סריקה",
  heroSubtitle: "חשבוניות, קבלות, חוזים ודוחות — חילוץ חכם של נתונים ושיוך ל-ERP/CRM.",
  scanModes: [
    { id: "INVOICE_FINANCIAL", label: "חשבונית / קבלה", description: "ספק, סכום, פריטים", icon: "invoice" },
    { id: "GENERAL_DOCUMENT", label: "מסמך כללי", description: "חוזה, דוח, מכתב", icon: "general" },
  ],
  defaultScanMode: "INVOICE_FINANCIAL",
  uploadAcceptHint: "PDF, JPG, PNG עד 25MB",
  uploadSizeHint: "אפשר להעלות מספר קבצים",
  contextFields: [
    { key: "project", label: "פרויקט", placeholder: "אופציונלי", required: false },
    { key: "client", label: "לקוח / ספק", placeholder: "אופציונלי", required: false },
    { key: "instruction", label: "הנחיה ל-AI (אופציונלי)", placeholder: "מה חשוב לך שה-AI ישים לב אליו?", required: false, multiline: true },
  ],
  instructionExamples: [
    { id: "ex-sum", text: "סכם בקצרה" },
    { id: "ex-amount", text: "חלץ סכומים ותאריכים" },
    { id: "ex-vat", text: "פצל מע״מ" },
  ],
  engineCards: ENGINE_CARDS_DEFAULT,
  defaultEngineCard: "RECOMMENDED",
  resultColumns: RESULT_COLUMNS_DEFAULT,
  vendorLabel: "ספק / לקוח",
  totalLabel: "סך",
  lineItemsLabel: "שורות",
  defaultSaveTarget: "ERP",
  saveTargetLabels: { ERP: "שמור ב-ERP", CRM: "שמור ב-CRM" },
  hintCreditsLabel: "סריקות",
};

const PROFILE_BY_INDUSTRY: Record<IndustryType, ScanWizardProfile> = {
  GENERAL: PROFILE_GENERAL,
  LEGAL: PROFILE_LEGAL,
  ACCOUNTING: PROFILE_ACCOUNTING,
  CONSTRUCTION: PROFILE_GENERAL_CONTRACTOR,
  MEDICAL: PROFILE_MEDICAL,
  RETAIL: PROFILE_RETAIL,
  REAL_ESTATE: PROFILE_REAL_ESTATE,
};

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
 * לכל ענף יש פרופיל ייעודי. עבור CONSTRUCTION יש גם overlay לפי trade.
 */
export function getScanWizardProfile(
  industryRaw?: string | null,
  constructionTradeRaw?: string | null,
): ScanWizardProfile {
  const industryId = normalizeIndustryType(industryRaw);

  if (industryId === "CONSTRUCTION") {
    const trade = normalizeConstructionTrade(constructionTradeRaw);
    if (trade === "GENERAL_CONTRACTOR") {
      return PROFILE_GENERAL_CONTRACTOR;
    }
    // בינתיים שאר ה-trades משתמשים בתשתית של קבלן ראשי עם תווית מקצוע מתאימה.
    // כשיהיה צורך — ניתן להוסיף overlays ייעודיים (חשמלאי / אינסטלטור / וכו׳).
    return {
      ...PROFILE_GENERAL_CONTRACTOR,
      tradeId: trade,
      tradeLabel: INDUSTRY_FALLBACK_LABELS.CONSTRUCTION,
    };
  }

  return PROFILE_BY_INDUSTRY[industryId];
}
