import { templateDraftMode } from "@/lib/professional-template-draft";
import type { ProfessionalDocumentTemplate } from "@/lib/professions/runtime";

describe("templateDraftMode", () => {
  it("מסמך רשמי עם סוג הנפקה — מסלול הפקה", () => {
    const template: ProfessionalDocumentTemplate = {
      id: "INVOICE",
      label: "חשבונית",
      description: "…",
      kind: "OFFICIAL",
      issuedDocumentType: "INVOICE",
    };
    expect(templateDraftMode(template)).toBe("issue");
  });

  it("דוח — טיוטה במסמכים מונפקים", () => {
    const template: ProfessionalDocumentTemplate = {
      id: "SITE_LOG",
      label: "יומן",
      description: "…",
      kind: "REPORT",
    };
    expect(templateDraftMode(template)).toBe("placeholder");
  });
});
