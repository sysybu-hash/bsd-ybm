/**
 * 🚀 BSD-YBM BSD-YBM: MODULAR INDUSTRY CONFIGURATION SYSTEM
 * This system adapts the entire platform UI, AI, and Schema behavior
 * based on the user's profession.
 */

export type IndustryType = 
  | "GENERAL" 
  | "LAWYER" 
  | "ACCOUNTANT" 
  | "CONTRACTOR" 
  | "HEALTH" 
  | "RETAIL" 
  | "REAL_ESTATE";

export interface IndustryConfig {
  id: IndustryType;
  label: string;
  icon: string; // Lucide icon name
  /** Overrides for terminology across the site */
  vocabulary: {
    client: string; // e.g. "מטופל", "לקוח", "תיק"
    project: string; // e.g. "פרויקט", "דיון", "משימה"
    document: string; // e.g. "מסמך", "מרשם", "כתב תביעה"
    inventory?: string; // e.g. "מלאי", "ציוד", "סחורה"
  };
  /** UI Modules visibility */
  features: {
    hasCrm: boolean;
    hasErp: boolean;
    hasInventory: boolean;
    hasFleet: boolean;
    hasLegalVault?: boolean;
    hasConstructionPlan?: boolean;
  };
  /** Custom AI system instructions for this industry */
  aiInstructions: string;
}

export const INDUSTRY_CONFIGS: Record<IndustryType, IndustryConfig> = {
  GENERAL: {
    id: "GENERAL",
    label: "ניהול כללי",
    icon: "Building2",
    vocabulary: { client: "לקוח", project: "פרויקט", document: "מסמך", inventory: "מלאי" },
    features: { hasCrm: true, hasErp: true, hasInventory: true, hasFleet: false },
    aiInstructions: "Analyze this document for standard business accounting (vendor, date, total, VAT)."
  },
  LAWYER: {
    id: "LAWYER",
    label: "משרד עורכי דין",
    icon: "Gavel",
    vocabulary: { client: "לקוח / מיוצג", project: "תיק משפטי", document: "כתב בית-דין / נספח", inventory: "ספריייה" },
    features: { hasCrm: true, hasErp: true, hasInventory: false, hasFleet: false, hasLegalVault: true },
    aiInstructions: "Analyze this document as a legal expense or court document. Extract case numbers if present."
  },
  ACCOUNTANT: {
    id: "ACCOUNTANT",
    label: "ראיית חשבון / ייעוץ מס",
    icon: "Calculator",
    vocabulary: { client: "נישום / לקוח", project: "ביקורת / דוח", document: "מסמך חשבונאי", inventory: "ארכיון" },
    features: { hasCrm: true, hasErp: true, hasInventory: false, hasFleet: false },
    aiInstructions: "Deep accounting analysis. Look for tax deductions and specific Israeli tax forms (867, etc)."
  },
  CONTRACTOR: {
    id: "CONTRACTOR",
    label: "קבלנות / בנייה / שיפוצים",
    icon: "HardHat",
    vocabulary: { client: "יזם / לקוח", project: "אתר עבודה / פרויקט", document: "כתב כמויות / חשבונית חומרים", inventory: "ציוד וכלי עבודה" },
    features: { hasCrm: true, hasErp: true, hasInventory: true, hasFleet: true, hasConstructionPlan: true },
    aiInstructions: "Focus on materials, unit prices, and transport/delivery notes. Identify construction-specific vendors."
  },
  HEALTH: {
    id: "HEALTH",
    label: "רפואה / טיפול / קליניקה",
    icon: "Stethoscope",
    vocabulary: { client: "מטופל / פציינט", project: "סדרת טיפולים", document: "תיק רפואי / מרשם", inventory: "מלאי תרופות/ציוד" },
    features: { hasCrm: true, hasErp: true, hasInventory: true, hasFleet: false },
    aiInstructions: "Identify patient names (strictly sensitive), prescriptions, and medical diagnostic codes if present."
  },
  RETAIL: {
    id: "RETAIL",
    label: "חנות / מסחר / קמעונאות",
    icon: "ShoppingBag",
    vocabulary: { client: "לקוח קצה", project: "ספק / הזמנה", document: "תעודת משלוח / חשבונית רכש", inventory: "מדפי חנות / מחסן" },
    features: { hasCrm: true, hasErp: true, hasInventory: true, hasFleet: false },
    aiInstructions: "Focus on itemized inventory lists, unit costs, and warehouse locations."
  },
  REAL_ESTATE: {
    id: "REAL_ESTATE",
    label: "נדל\"ן / תיווך",
    icon: "Home",
    vocabulary: { client: "קונה / שוכר", project: "נכס / דירה", document: "חוזה / נסח טאבו", inventory: "מאגר נכסים" },
    features: { hasCrm: true, hasErp: true, hasInventory: false, hasFleet: false },
    aiInstructions: "Identify property addresses, square meters, and price per meter if mentioned in contracts."
  }
};

export function getIndustryConfig(id?: string): IndustryConfig {
  const normalized = (id || "GENERAL").toUpperCase() as IndustryType;
  return INDUSTRY_CONFIGS[normalized] || INDUSTRY_CONFIGS.GENERAL;
}
