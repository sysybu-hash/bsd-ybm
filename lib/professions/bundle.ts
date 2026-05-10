import type { MessageTree } from "@/lib/i18n/keys";
import {
  INDUSTRY_CONFIGS,
  normalizeIndustryType,
  type AnalysisType,
  type IndustryConfig,
  type IndustryType,
} from "@/lib/professions/config";
import {
  constructionTradeLabelHe,
  getConstructionTradeProfileOverlay,
  getMergedIndustryConfig,
  normalizeConstructionTrade,
  type ConstructionTradeId,
} from "@/lib/construction-trades";
import {
  mergeConstructionTradeLabel,
  mergeTradeProfileFromMessages,
} from "@/lib/construction-trades-i18n";
import type {
  IndustryProfile,
  ProfessionalDocumentTemplate,
} from "@/lib/professions/runtime";
import {
  getScanWizardProfile,
  type ScanWizardProfile,
} from "@/lib/professions/scan-wizard";

/**
 * IndustryBundle — מקור אמת אחד לכל מה שתלוי-תעשייה.
 *
 * עד היום, כל תכונה של פרופיל המקצוע חיה בקובץ נפרד:
 *   - lib/professions/config.ts          → vocabulary, features, scanner, AI
 *   - lib/professions/runtime.ts         → IndustryProfile (תוויות לתפריטים)
 *   - lib/professions/scan-wizard.ts     → ScanWizardProfile (Wizard החדש)
 *   - lib/construction-trades.ts          → overlay לפי trade
 *
 * Bundle מאחד את כולם במבנה אחד שנבנה בקריאה אחת. הקבצים הישנים
 * הופכים ל-thin selectors מעליו (compat shims) — כך שאין צורך לעדכן 17
 * call-sites בבת אחת. שימוש חדש צריך לעבור דרך getIndustryBundle().
 */
export type IndustryBundle = {
  /** זהות */
  industryId: IndustryType;
  industryLabel: string;
  tradeId?: ConstructionTradeId;
  tradeLabel?: string;

  /** אוצר מילים לתפריטים ולכותרות */
  vocabulary: {
    client: string;
    project: string;
    document: string;
    inventory?: string;
  };

  /** תוויות מערכת (תפריטי שורש, מסכי בית) */
  labels: {
    clients: string;
    documents: string;
    records: string;
    financeNav?: string;
    homeTitle: string;
    homeDescription: string;
  };

  /** תבניות הנפקה ואישורים זמינות */
  templates: ProfessionalDocumentTemplate[];

  /** תכונות מותאמות מקצוע (CRM/ERP/Inventory/Fleet/Vault) */
  features: IndustryConfig["features"];

  /** קונפיגורציית הסורק (legacy) — עדיין בשימוש על ידי tri-engine-extract */
  scanner: IndustryConfig["scanner"];
  scannerAnalysisTypes: AnalysisType[];

  /** הוראות מערכת ל-AI לפי תחום */
  aiInstructions: string;

  /** ה-Wizard החדש — כל הקונפיג של אשף הסריקה */
  scan: ScanWizardProfile;
};

type IndustryOverrides = {
  customLabels?: Partial<{
    clients: string;
    documents: string;
    records: string;
    client: string;
    project: string;
    document: string;
  }>;
};

type IndustryProfileBaseDefaults = {
  clientsLabel: string;
  documentsLabel: string;
  recordsLabel: string;
  financeNavLabel?: string;
  homeTitle: string;
  homeDescription: string;
  templates: ProfessionalDocumentTemplate[];
};

/** ערכי מסך-בית/תפריטים פר-תעשייה — חיים כאן כדי שלא נצטרך לייבא runtime.ts. */
const INDUSTRY_LABEL_DEFAULTS: Record<IndustryType, IndustryProfileBaseDefaults> = {
  GENERAL: {
    clientsLabel: "לקוחות",
    documentsLabel: "מסמכים",
    recordsLabel: "מסמכים ואישורים",
    homeTitle: "מרכז עבודה אחד לכל התהליך העסקי.",
    homeDescription:
      "כל לקוח, מסמך וחיוב מסתנכרנים למסך עבודה ברור שמכוון לעסק כללי או רב-תחומי.",
    templates: [
      { id: "INVOICE", label: "חשבונית מס", description: "מסמך חיוב רשמי ללקוח.", kind: "OFFICIAL", issuedDocumentType: "INVOICE" },
      { id: "RECEIPT", label: "קבלה", description: "אישור תשלום רשמי.", kind: "OFFICIAL", issuedDocumentType: "RECEIPT" },
      { id: "SERVICE_REPORT", label: "דוח שירות", description: "סיכום ביצוע או טיפול פנימי.", kind: "REPORT" },
      { id: "WORK_APPROVAL", label: "אישור ביצוע", description: "אישור פנימי או מול לקוח על סיום משימה.", kind: "APPROVAL" },
    ],
  },
  LEGAL: {
    clientsLabel: "מיוצגים ותיקים",
    documentsLabel: "תיקים ומסמכים",
    recordsLabel: "מסמכים משפטיים ואישורים",
    homeTitle: "מרחב עבודה שמדבר שפה משפטית.",
    homeDescription:
      "התפריטים, הכותרות והמסמכים מותאמים לניהול מיוצגים, תיקים, חוזים ואישורים משפטיים.",
    templates: [
      { id: "ENGAGEMENT_AGREEMENT", label: "הסכם ייצוג", description: "מסמך פתיחת תיק והתקשרות עם לקוח.", kind: "FORM" },
      { id: "COURT_FILING_APPROVAL", label: "אישור הגשה לבית משפט", description: "אישור פנימי/חיצוני להגשת מסמך משפטי.", kind: "APPROVAL" },
      { id: "CASE_SUMMARY", label: "סיכום תיק", description: "דוח מצב תיק, מועדים וסיכונים.", kind: "REPORT" },
      { id: "INVOICE", label: "חשבונית שכר טרחה", description: "חיוב רשמי על שירות משפטי.", kind: "OFFICIAL", issuedDocumentType: "INVOICE" },
    ],
  },
  ACCOUNTING: {
    clientsLabel: "לקוחות מס וביקורת",
    documentsLabel: "דוחות ומסמכי חשבונאות",
    recordsLabel: "דוחות, מסמכים ואישורי מס",
    homeTitle: "מערכת שמותאמת למשרד חשבונאות פעיל.",
    homeDescription:
      "המסכים וה-AI בנויים לנישומים, דוחות, ביקורות ואישורי מס במקום מונחים כלליים.",
    templates: [
      { id: "BOOKKEEPING_REPORT", label: "סיכום הנהלת חשבונות", description: "סיכום חודשי או תקופתי ללקוח.", kind: "REPORT" },
      { id: "TAX_APPROVAL", label: "אישור מס", description: "אישור הגשה, תיאום או בקרה ללקוח.", kind: "APPROVAL" },
      { id: "AUDIT_MEMO", label: "מזכר ביקורת", description: "סיכום ממצאים ופעולות מתקנות.", kind: "REPORT" },
      { id: "INVOICE", label: "חשבונית שירותי הנהלת חשבונות", description: "חיוב רשמי עבור שירותי המשרד.", kind: "OFFICIAL", issuedDocumentType: "INVOICE" },
    ],
  },
  CONSTRUCTION: {
    clientsLabel: "פרויקטים",
    documentsLabel: "יומנים, תוכניות ומסמכי שטח",
    financeNavLabel: "כספים",
    recordsLabel: "אישורי שטח ומסמכי פרויקט",
    homeTitle: "מרחב עבודה לפרויקטים, אישורי שטח וחומרי בנייה.",
    homeDescription: "הממשק משנה שפה לניהול אתרים, אישורי ביצוע, יומני עבודה וחומרי גלם.",
    templates: [
      { id: "SITE_LOG", label: "יומן עבודה", description: "דיווח יומי על צוות, חומרים והתקדמות.", kind: "REPORT" },
      { id: "MATERIAL_APPROVAL", label: "אישור חומר/אספקה", description: "אישור קבלה או שימוש בחומרי בנייה.", kind: "APPROVAL" },
      { id: "WORK_COMPLETION", label: "אישור סיום שלב", description: "אישור מסירה או סיום שלב לפרויקט.", kind: "APPROVAL" },
      { id: "INVOICE", label: "חשבונית קבלן", description: "חיוב רשמי עבור עבודות או שלבים.", kind: "OFFICIAL", issuedDocumentType: "INVOICE" },
    ],
  },
  MEDICAL: {
    clientsLabel: "מטופלים ותיקים קליניים",
    documentsLabel: "תיקי טיפול ומסמכים רפואיים",
    recordsLabel: "טפסי טיפול, אישורים וסיכומים",
    homeTitle: "מרכז עבודה שמדבר קליניקה ולא רק CRM.",
    homeDescription:
      "כותרות, מסמכים ופענוחי AI מותאמים למטופלים, טיפולים, מרשמים ואישורי טיפול.",
    templates: [
      { id: "CONSENT_FORM", label: "טופס הסכמה", description: "אישור חתום או פנימי לפני טיפול.", kind: "APPROVAL" },
      { id: "TREATMENT_SUMMARY", label: "סיכום טיפול", description: "דוח מהלך טיפול והמלצות להמשך.", kind: "REPORT" },
      { id: "REFERRAL_APPROVAL", label: "אישור הפניה", description: "אישור או תיעוד להפניה חיצונית.", kind: "APPROVAL" },
      { id: "RECEIPT", label: "קבלה על טיפול", description: "אישור תשלום רשמי למטופל.", kind: "OFFICIAL", issuedDocumentType: "RECEIPT" },
    ],
  },
  RETAIL: {
    clientsLabel: "לקוחות, ספקים ומלאי",
    documentsLabel: "מסמכי מלאי וסחר",
    recordsLabel: "אישורי מלאי ומסמכי אספקה",
    homeTitle: "ניהול מסחר ומלאי מתוך מסך עבודה אחד.",
    homeDescription:
      "המערכת מתאימה את השפה להזמנות, אספקות, מלאי וספקים במקום מונחים כלליים.",
    templates: [
      { id: "DELIVERY_CONFIRMATION", label: "אישור אספקה", description: "תיעוד קבלה או מסירה של מלאי.", kind: "APPROVAL" },
      { id: "INVENTORY_REPORT", label: "דוח פערי מלאי", description: "סיכום חריגות, חוסרים ועדכון מדפים.", kind: "REPORT" },
      { id: "PURCHASE_ORDER", label: "הזמנת רכש", description: "מסמך פנימי או חיצוני להזמנה מספק.", kind: "FORM" },
      { id: "INVOICE", label: "חשבונית רכש/מכירה", description: "חיוב רשמי מול ספק או לקוח.", kind: "OFFICIAL", issuedDocumentType: "INVOICE" },
    ],
  },
  REAL_ESTATE: {
    clientsLabel: "קונים, שוכרים ונכסים",
    documentsLabel: "נכסים, חוזים ומסמכים",
    recordsLabel: "אישורי נכס ודוחות תיווך",
    homeTitle: "מרחב עבודה שמכוון לנכסים, עסקאות ואישורים.",
    homeDescription:
      "המערכת מחליפה שפה כללית בשפה של נכסים, עסקאות, שוכרים ואישורי מסירה.",
    templates: [
      { id: "PROPERTY_SUMMARY", label: "סיכום נכס", description: "סיכום נתוני נכס, בעלות וסטטוס.", kind: "REPORT" },
      { id: "TENANCY_APPROVAL", label: "אישור שכירות", description: "אישור תהליך שכירות, מסירה או חידוש.", kind: "APPROVAL" },
      { id: "VIEWING_REPORT", label: "דוח פגישה בנכס", description: "תיעוד סיור, פגישה או סטטוס עסקה.", kind: "REPORT" },
      { id: "INVOICE", label: "חשבונית תיווך/ניהול", description: "חיוב רשמי על שירותי תיווך או ניהול.", kind: "OFFICIAL", issuedDocumentType: "INVOICE" },
    ],
  },
};

function readOverrides(raw: unknown): IndustryOverrides {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return {};
  }
  const value = raw as Record<string, unknown>;
  const customLabelsRaw = value.customLabels;
  if (typeof customLabelsRaw !== "object" || customLabelsRaw === null || Array.isArray(customLabelsRaw)) {
    return {};
  }
  return {
    customLabels: customLabelsRaw as IndustryOverrides["customLabels"],
  };
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function pickMessageString(messages: MessageTree | undefined, key: string): string | undefined {
  if (!messages) return undefined;
  const parts = key.split(".");
  let cur: unknown = messages as unknown;
  for (const p of parts) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" && cur.trim() ? cur.trim() : undefined;
}

/**
 * נקודת הכניסה היחידה — כל הקונפיגורציה התלויה-תעשייה במקום אחד.
 *
 * @param industryRaw - מזהה תעשייה (גם aliases מקובלים: LAWYER, CONTRACTOR, …)
 * @param rawConfig - JSON מ-Organization.industryConfigJson (customLabels)
 * @param constructionTrade - אחד מ-CONSTRUCTION_TRADE_IDS (רק כש-industry === CONSTRUCTION)
 * @param localeMessages - הודעות i18n שהוטענו ל-request הנוכחי (אופציונלי)
 */
export function getIndustryBundle(
  industryRaw?: string | null,
  rawConfig?: unknown,
  constructionTrade?: string | null,
  localeMessages?: MessageTree | null,
): IndustryBundle {
  const industryId = normalizeIndustryType(industryRaw);
  const baseConfig = INDUSTRY_CONFIGS[industryId];
  const merged = getMergedIndustryConfig(industryRaw, constructionTrade, localeMessages ?? undefined);
  const labelDefaults = INDUSTRY_LABEL_DEFAULTS[industryId];
  const overrides = readOverrides(rawConfig);
  const customLabels = overrides.customLabels ?? {};

  // Construction trade overlay
  const tradeId =
    industryId === "CONSTRUCTION" ? normalizeConstructionTrade(constructionTrade) : undefined;
  const tradeLabelHe = tradeId ? constructionTradeLabelHe(tradeId) : undefined;
  const tradeLabel =
    tradeId !== undefined
      ? mergeConstructionTradeLabel(localeMessages ?? undefined, tradeId, tradeLabelHe ?? "")
      : undefined;

  let tradeProfile = industryId === "CONSTRUCTION"
    ? getConstructionTradeProfileOverlay(constructionTrade)
    : null;
  if (localeMessages && tradeProfile && tradeId) {
    tradeProfile = mergeTradeProfileFromMessages(localeMessages, tradeId, tradeProfile);
  }

  const baseIndustryLabel =
    pickMessageString(localeMessages ?? undefined, `professions.${industryId}.label`) ?? baseConfig.label;
  const industryLabel =
    industryId === "CONSTRUCTION" && tradeLabel
      ? `${baseIndustryLabel} · ${tradeLabel}`
      : baseIndustryLabel;

  const clientsBase = tradeProfile?.clientsLabel ?? labelDefaults.clientsLabel;
  const documentsBase = tradeProfile?.documentsLabel ?? labelDefaults.documentsLabel;
  const recordsBase = tradeProfile?.recordsLabel ?? labelDefaults.recordsLabel;
  const homeTitleBase = tradeProfile?.homeTitle ?? labelDefaults.homeTitle;
  const homeDescriptionBase = tradeProfile?.homeDescription ?? labelDefaults.homeDescription;
  const templatesBase = (tradeProfile?.templates ?? labelDefaults.templates) as ProfessionalDocumentTemplate[];

  return {
    industryId,
    industryLabel,
    tradeId,
    tradeLabel,
    vocabulary: {
      client: readString(customLabels.client, merged.vocabulary.client),
      project: readString(customLabels.project, merged.vocabulary.project),
      document: readString(customLabels.document, merged.vocabulary.document),
      inventory: merged.vocabulary.inventory,
    },
    labels: {
      clients: readString(customLabels.clients, clientsBase),
      documents: readString(customLabels.documents, documentsBase),
      records: readString(customLabels.records, recordsBase),
      financeNav: labelDefaults.financeNavLabel,
      homeTitle: homeTitleBase,
      homeDescription: homeDescriptionBase,
    },
    templates: templatesBase,
    features: merged.features,
    scanner: merged.scanner,
    scannerAnalysisTypes: merged.scanner.analysisTypes,
    aiInstructions: merged.aiInstructions,
    scan: getScanWizardProfile(industryRaw, constructionTrade),
  };
}

/**
 * Selector — בונה IndustryProfile (legacy) מתוך bundle. נקרא ע״י getIndustryProfile()
 * הקיים שמייצא את אותה צורה.
 */
export function bundleToIndustryProfile(bundle: IndustryBundle): IndustryProfile {
  return {
    id: bundle.industryId,
    industryLabel: bundle.industryLabel,
    clientsLabel: bundle.labels.clients,
    documentsLabel: bundle.labels.documents,
    financeNavLabel: bundle.labels.financeNav,
    recordsLabel: bundle.labels.records,
    homeTitle: bundle.labels.homeTitle,
    homeDescription: bundle.labels.homeDescription,
    vocabulary: {
      client: bundle.vocabulary.client,
      project: bundle.vocabulary.project,
      document: bundle.vocabulary.document,
    },
    analysisTypes: bundle.scannerAnalysisTypes,
    templates: bundle.templates,
    constructionTradeId: bundle.tradeId,
    constructionTradeLabel: bundle.tradeLabel,
  };
}
