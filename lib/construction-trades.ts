import {
  INDUSTRY_CONFIGS,
  normalizeIndustryType,
  type IndustryConfig,
  type IndustryType,
} from "@/lib/professions/config";

export const CONSTRUCTION_TRADE_IDS = [
  "GENERAL_CONTRACTOR",
  "ELECTRICAL",
  "PLUMBING",
  "HVAC",
  "PAINTING",
  "FLOORING",
  "ALUMINUM",
  "FINISHING",
  "LANDSCAPING",
  "SUBCONTRACTOR_OTHER",
] as const;

export type ConstructionTradeId = (typeof CONSTRUCTION_TRADE_IDS)[number];

const LABELS_HE: Record<ConstructionTradeId, string> = {
  GENERAL_CONTRACTOR: "קבלן ראשי / ליווי פרויקט",
  ELECTRICAL: "חשמלאי / עבודות חשמל",
  PLUMBING: "אינסטלציה ותברואה",
  HVAC: "מיזוג אוויר",
  PAINTING: "צבע, טיח ושליכט",
  FLOORING: "ריצוף, אבן וקרמיקה",
  ALUMINUM: "אלומיניום וזכוכית",
  FINISHING: "גמר פנים (דלתות, מטבח…)",
  LANDSCAPING: "גינון קשיח / חוץ",
  SUBCONTRACTOR_OTHER: "קבלן משנה / אחר",
};

/** שינוי סורק/AI יחסית לבסיס CONSTRUCTION ב־INDUSTRY_CONFIGS */
type TradeScannerPatch = {
  scanner: Partial<IndustryConfig["scanner"]> & {
    analysisTypes?: IndustryConfig["scanner"]["analysisTypes"];
    resultColumns?: IndustryConfig["scanner"]["resultColumns"];
  };
  aiInstructionsSuffix?: string;
};

const TRADE_PATCHES: Record<ConstructionTradeId, TradeScannerPatch | null> = {
  GENERAL_CONTRACTOR: null,
  ELECTRICAL: {
    scanner: {
      title: "פענוח מסמכי חשמל ושטח",
      subtitle: "תעודות בדיקה, הזמנות חומר, חשבוניות ספק — בהקשר חשמלאי",
      dropzoneTitle: "העלה תעודות בדיקה, חשבוניות או הזמנות חומר",
      analysisTypes: [
        {
          id: "ELECTRICAL_TEST_CERT",
          label: "תעודת בדיקה / אישור התקנה",
          description: "זיהוי תקן, תאריך בדיקה, קבלן מאשר",
        },
        {
          id: "MATERIAL_ORDER",
          label: "הזמנת חומרים / ספק",
          description: "כבלים, לוחות, תאורה — כמויות ומחירים",
        },
        {
          id: "SITE_LOG",
          label: "יומן עבודה באתר",
          description: "כוח אדם, שלבים והתקדמות יומית",
        },
      ],
      resultColumns: [
        { key: "site_or_panel", label: "אתר / לוח" },
        { key: "standard_ref", label: "תקן / אישור" },
        { key: "approval_status", label: "סטטוס" },
      ],
    },
    aiInstructionsSuffix:
      "Focus on electrical installation context: panels, circuits, standards (Israeli norms when visible), and safety-related notes.",
  },
  PLUMBING: {
    scanner: {
      title: "פענוח מסמכי אינסטלציה",
      subtitle: "הזמנות צינורות, אספקה, קולטים וספקים",
      analysisTypes: [
        {
          id: "PLUMBING_SUPPLY_ORDER",
          label: "הזמנת חומר (צינורות/אביזרים)",
          description: "פירוט פריטים, כמויות וספק",
        },
        {
          id: "PRESSURE_TEST_REPORT",
          label: "בדיקת לחץ / אטימות",
          description: "תאריכים, תוצאות ואישור",
        },
        {
          id: "SITE_LOG",
          label: "יומן עבודה",
          description: "התקדמות צוות באתר",
        },
      ],
      resultColumns: [
        { key: "system_type", label: "מערכת (קולט/ביוב/מים)" },
        { key: "material_type", label: "חומר עיקרי" },
        { key: "supplier", label: "ספק" },
      ],
    },
    aiInstructionsSuffix: "Emphasize plumbing systems: water, drainage, fixtures, and supplier invoices.",
  },
  HVAC: {
    scanner: {
      title: "פענוח מסמכי מיזוג אוויר",
      subtitle: "יחידות, צ׳ילרים, התקנות ואיזון",
      analysisTypes: [
        {
          id: "HVAC_ORDER",
          label: "הזמנת ציוד מיזוג",
          description: "דגמים, BTU/קילווט, כמויות",
        },
        {
          id: "COMMISSIONING_DOC",
          label: "השלמת התקנה / כיול",
          description: "בדיקות הפעלה ותאריכים",
        },
        { id: "SITE_LOG", label: "יומן עבודה", description: "צוות והתקדמות" },
      ],
      resultColumns: [
        { key: "equipment_tag", label: "ציוד / דגם" },
        { key: "capacity", label: "הספק / נפח" },
        { key: "location", label: "מיקום באתר" },
      ],
    },
    aiInstructionsSuffix: "Focus on HVAC equipment tags, capacities, and installation milestones.",
  },
  PAINTING: {
    scanner: {
      title: "פענוח מסמכי צבע וגמר",
      subtitle: "כמויות שטח, חומרים ושכבות",
      analysisTypes: [
        {
          id: "PAINT_QUANTITY",
          label: "כמויות צבע / שטחים",
          description: "מ״ר, מספר שכבות, סוג צבע",
        },
        {
          id: "MATERIAL_ORDER",
          label: "הזמנת חומר",
          description: "דליים, רולרים, מריחה",
        },
        { id: "SITE_LOG", label: "יומן עבודה", description: "שלבי גמר" },
      ],
      resultColumns: [
        { key: "area_sqm", label: "שטח (מ״ר)" },
        { key: "layers", label: "שכבות" },
        { key: "color_code", label: "גוון / קוד" },
      ],
    },
    aiInstructionsSuffix: "Highlight surface areas, paint systems, and finishing scope.",
  },
  FLOORING: {
    scanner: {
      title: "פענוח מסמכי ריצוף ואבן",
      subtitle: "חתכים, כמויות ואספקה",
      analysisTypes: [
        {
          id: "TILE_ORDER",
          label: "הזמנת ריצוף / קרמיקה",
          description: "מידות, מ״ר, אצווה",
        },
        {
          id: "DELIVERY_NOTE",
          label: "תעודת משלוח",
          description: "פריטים שהגיעו לאתר",
        },
        { id: "SITE_LOG", label: "יומן עבודה", description: "התקדמות" },
      ],
      resultColumns: [
        { key: "tile_sku", label: "דגם / מידה" },
        { key: "qty_sqm", label: "כמות מ״ר" },
        { key: "batch", label: "אצווה" },
      ],
    },
    aiInstructionsSuffix: "Focus on flooring quantities, SKUs, and delivery batches.",
  },
  ALUMINUM: {
    scanner: {
      title: "פענוח מסמכי אלומיניום וזכוכית",
      subtitle: "מסגרות, מידות וייצור",
      analysisTypes: [
        {
          id: "ALU_MEASUREMENT",
          label: "מדידות / שרטוט כנף",
          description: "מידות פתחים ופרופילים",
        },
        {
          id: "GLASS_ORDER",
          label: "הזמנת זכוכית",
          description: "עובי, סוג ומידות",
        },
        { id: "SITE_LOG", label: "יומן התקנה", description: "ביצוע באתר" },
      ],
      resultColumns: [
        { key: "opening_ref", label: "פתח" },
        { key: "profile", label: "פרופיל" },
        { key: "glass_spec", label: "מפרט זכוכית" },
      ],
    },
    aiInstructionsSuffix: "Emphasize openings, profiles, glass specs, and installation notes.",
  },
  FINISHING: {
    scanner: {
      title: "פענוח מסמכי גמר פנים",
      subtitle: "דלתות, מטבחים, ארונות — הזמנות ואספקה",
      analysisTypes: [
        {
          id: "JOINERY_ORDER",
          label: "הזמנת נגרות / מטבח",
          description: "מפרטים ותאריכי אספקה",
        },
        {
          id: "DELIVERY_NOTE",
          label: "תעודת משלוח",
          description: "פריטים שהגיעו",
        },
        { id: "SITE_LOG", label: "יומן עבודה", description: "התקנה" },
      ],
      resultColumns: [
        { key: "room_ref", label: "חלל" },
        { key: "item_desc", label: "פריט" },
        { key: "supplier", label: "ספק" },
      ],
    },
    aiInstructionsSuffix: "Focus on interior finishing orders: kitchens, doors, built-ins.",
  },
  LANDSCAPING: {
    scanner: {
      title: "פענוח מסמכי גינון וחוץ",
      subtitle: "צמחייה, השקיה, ריצוף חוץ",
      analysisTypes: [
        {
          id: "LANDSCAPE_QUOTE",
          label: "הצעת גינון",
          description: "שטחים, עצים, מערכת השקיה",
        },
        {
          id: "IRRIGATION_PARTS",
          label: "רכיבי השקיה",
          description: "ממטרות, צינורות, בקרה",
        },
        { id: "SITE_LOG", label: "יומן עבודה", description: "ביצוע" },
      ],
      resultColumns: [
        { key: "zone", label: "אזור" },
        { key: "plant_or_material", label: "חומר / צמח" },
        { key: "qty", label: "כמות" },
      ],
    },
    aiInstructionsSuffix: "Emphasize landscaping scope, irrigation, and hardscape elements.",
  },
  SUBCONTRACTOR_OTHER: {
    scanner: {
      title: "פענוח מסמכי קבלן משנה",
      subtitle: "הצעות מחיר, חשבוניות ותעודות מהשטח",
      analysisTypes: [
        {
          id: "SUB_QUOTE",
          label: "הצעת מחיר משנה",
          description: "היקף, יחידות ומחירים",
        },
        {
          id: "PROGRESS_INVOICE",
          label: "חשבון ביצוע / התקדמות",
          description: "אחוזים ושלבים",
        },
        { id: "SITE_LOG", label: "יומן עבודה", description: "דיווח שטח" },
      ],
      resultColumns: [
        { key: "project_site", label: "אתר" },
        { key: "phase", label: "שלב" },
        { key: "total", label: "סה״כ" },
      ],
    },
    aiInstructionsSuffix: "Focus on subcontractor quotes, progress billing, and site reporting.",
  },
};

export function normalizeConstructionTrade(raw?: string | null): ConstructionTradeId {
  const u = String(raw ?? "").trim().toUpperCase();
  return CONSTRUCTION_TRADE_IDS.includes(u as ConstructionTradeId)
    ? (u as ConstructionTradeId)
    : "GENERAL_CONTRACTOR";
}

export function constructionTradeLabelHe(id: ConstructionTradeId): string {
  return LABELS_HE[id] ?? LABELS_HE.GENERAL_CONTRACTOR;
}

export function listConstructionTradesForSelect(): Array<{ id: ConstructionTradeId; label: string }> {
  return CONSTRUCTION_TRADE_IDS.map((id) => ({ id, label: LABELS_HE[id] }));
}

/** מיזוג מלא של IndustryConfig לסורק — לפי ענף ואופציונלית trade בתוך בנייה */
export function getMergedIndustryConfig(
  industryRaw: string | undefined | null,
  constructionTradeRaw?: string | null,
): IndustryConfig {
  const key = normalizeIndustryType(industryRaw) as IndustryType;
  const base = INDUSTRY_CONFIGS[key] ?? INDUSTRY_CONFIGS.GENERAL;
  if (key !== "CONSTRUCTION") {
    return base;
  }
  const trade = normalizeConstructionTrade(constructionTradeRaw);
  const patch = TRADE_PATCHES[trade];
  if (!patch) {
    return base;
  }
  return {
    ...base,
    scanner: {
      ...base.scanner,
      ...patch.scanner,
      analysisTypes: patch.scanner.analysisTypes ?? base.scanner.analysisTypes,
      resultColumns: patch.scanner.resultColumns ?? base.scanner.resultColumns,
    },
    aiInstructions: patch.aiInstructionsSuffix
      ? `${base.aiInstructions} ${patch.aiInstructionsSuffix}`
      : base.aiInstructions,
  };
}
