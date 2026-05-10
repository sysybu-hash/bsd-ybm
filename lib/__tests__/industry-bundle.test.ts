import { getIndustryBundle } from "@/lib/professions/bundle";
import { getIndustryProfile } from "@/lib/professions/runtime";

const ALL_INDUSTRIES = [
  "GENERAL",
  "LEGAL",
  "ACCOUNTING",
  "CONSTRUCTION",
  "MEDICAL",
  "RETAIL",
  "REAL_ESTATE",
] as const;

describe("IndustryBundle — מקור אמת מאוחד", () => {
  it.each(ALL_INDUSTRIES)("%s מחזיר bundle תקף עם כל השדות החובה", (industry) => {
    const bundle = getIndustryBundle(industry);
    expect(bundle.industryId).toBe(industry);
    expect(bundle.industryLabel.length).toBeGreaterThan(0);
    expect(bundle.vocabulary.client.length).toBeGreaterThan(0);
    expect(bundle.vocabulary.project.length).toBeGreaterThan(0);
    expect(bundle.vocabulary.document.length).toBeGreaterThan(0);
    expect(bundle.labels.clients.length).toBeGreaterThan(0);
    expect(bundle.labels.documents.length).toBeGreaterThan(0);
    expect(bundle.labels.records.length).toBeGreaterThan(0);
    expect(bundle.labels.homeTitle.length).toBeGreaterThan(0);
    expect(bundle.templates.length).toBeGreaterThan(0);
    expect(bundle.scan.industryId).toBe(industry);
    expect(bundle.scan.scanModes.length).toBeGreaterThan(0);
    expect(bundle.scan.engineCards.length).toBe(3);
    expect(bundle.scan.contextFields.length).toBeGreaterThan(0);
    expect(bundle.scan.resultColumns.length).toBeGreaterThan(0);
    expect(bundle.aiInstructions.length).toBeGreaterThan(0);
  });

  it("getIndustryProfile (legacy shim) מסכים על השדות עם getIndustryBundle", () => {
    for (const industry of ALL_INDUSTRIES) {
      const bundle = getIndustryBundle(industry);
      const profile = getIndustryProfile(industry);
      expect(profile.id).toBe(bundle.industryId);
      expect(profile.industryLabel).toBe(bundle.industryLabel);
      expect(profile.clientsLabel).toBe(bundle.labels.clients);
      expect(profile.documentsLabel).toBe(bundle.labels.documents);
      expect(profile.recordsLabel).toBe(bundle.labels.records);
      expect(profile.homeTitle).toBe(bundle.labels.homeTitle);
      expect(profile.vocabulary).toEqual({
        client: bundle.vocabulary.client,
        project: bundle.vocabulary.project,
        document: bundle.vocabulary.document,
      });
      expect(profile.templates).toEqual(bundle.templates);
    }
  });

  it("CONSTRUCTION עם trade=ELECTRICAL מקבל overlay ושומר על industryId", () => {
    const bundle = getIndustryBundle("CONSTRUCTION", undefined, "ELECTRICAL");
    expect(bundle.industryId).toBe("CONSTRUCTION");
    expect(bundle.tradeId).toBe("ELECTRICAL");
    expect(bundle.tradeLabel).toBeTruthy();
    expect(bundle.documentsLabel ?? bundle.labels.documents).toContain("חשמל");
    expect(bundle.scan.industryId).toBe("CONSTRUCTION");
  });

  it("LEGAL bundle מציע ברירת מחדל CRM ולא ERP", () => {
    const bundle = getIndustryBundle("LEGAL");
    expect(bundle.scan.defaultSaveTarget).toBe("CRM");
  });

  it("CONSTRUCTION bundle מציע ברירת מחדל ERP", () => {
    const bundle = getIndustryBundle("CONSTRUCTION");
    expect(bundle.scan.defaultSaveTarget).toBe("ERP");
  });

  it("customLabels מ-rawConfig דורסים את ברירות המחדל", () => {
    const bundle = getIndustryBundle("GENERAL", {
      customLabels: { clients: "המשתמשים שלי", project: "מבצע" },
    });
    expect(bundle.labels.clients).toBe("המשתמשים שלי");
    expect(bundle.vocabulary.project).toBe("מבצע");
  });
});
