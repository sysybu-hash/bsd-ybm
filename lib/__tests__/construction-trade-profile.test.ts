import { getIndustryProfile } from "@/lib/professions/runtime";
import { getMergedIndustryConfig } from "@/lib/construction-trades";

describe("התאמת פרופיל למקצוע בנייה", () => {
  it("חשמלאי מקבל תבניות ותוויות שונות מקבלן ראשי", () => {
    const general = getIndustryProfile("CONSTRUCTION", undefined, "GENERAL_CONTRACTOR");
    const electrical = getIndustryProfile("CONSTRUCTION", undefined, "ELECTRICAL");

    expect(general.templates.map((t) => t.id)).toContain("MATERIAL_APPROVAL");
    expect(electrical.templates.map((t) => t.id)).toContain("ELEC_TEST_APPROVAL");
    expect(electrical.documentsLabel).toContain("חשמל");
    expect(electrical.homeTitle).toContain("חשמל");
  });

  it("מיזוג IndustryConfig כולל אוצר מילים למקצוע", () => {
    const merged = getMergedIndustryConfig("CONSTRUCTION", "PLUMBING");
    expect(merged.vocabulary.document).toContain("לחץ");
    const profile = getIndustryProfile("CONSTRUCTION", undefined, "PLUMBING");
    expect(profile.recordsLabel).toContain("צנרת");
  });
});
