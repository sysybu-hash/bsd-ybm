import type { MessageTree } from "@/lib/i18n/keys";
import { bundleToIndustryProfile, getIndustryBundle } from "@/lib/professions/bundle";
import type { IndustryType } from "@/lib/professions/config";
import type { ConstructionTradeId } from "@/lib/construction-trades";

export type ProfessionalTemplateKind = "OFFICIAL" | "APPROVAL" | "FORM" | "REPORT";
export type OfficialIssuedDocumentType = "INVOICE" | "RECEIPT" | "INVOICE_RECEIPT" | "CREDIT_NOTE";

export type ProfessionalDocumentTemplate = {
  id: string;
  label: string;
  description: string;
  kind: ProfessionalTemplateKind;
  issuedDocumentType?: OfficialIssuedDocumentType;
};

export type IndustryProfile = {
  id: IndustryType;
  industryLabel: string;
  clientsLabel: string;
  documentsLabel: string;
  /** תווית טאב ERP/כספים — כשלא מוגדר משתמשים ב-documentsLabel */
  financeNavLabel?: string;
  recordsLabel: string;
  homeTitle: string;
  homeDescription: string;
  vocabulary: {
    client: string;
    project: string;
    document: string;
  };
  analysisTypes: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  templates: ProfessionalDocumentTemplate[];
  /** מזהה התמחות בענף הבנייה — כשלא רלוונטי undefined */
  constructionTradeId?: ConstructionTradeId;
  constructionTradeLabel?: string;
};

/**
 * Selector מעל getIndustryBundle.
 *
 * @deprecated העדף getIndustryBundle() ישירות בקוד חדש. נשאר כ-shim כדי
 * שלא נצטרך לעדכן 14 call-sites בו-זמנית.
 */
export function getIndustryProfile(
  industryId?: string,
  rawConfig?: unknown,
  constructionTrade?: string | null,
  localeMessages?: MessageTree | null,
): IndustryProfile {
  return bundleToIndustryProfile(
    getIndustryBundle(industryId, rawConfig, constructionTrade, localeMessages),
  );
}
