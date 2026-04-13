import {
  CORPORATE_MAX_COMPANIES_EFFECTIVE,
  defaultScanBalancesForTier,
  legacyPlanToTierKey,
  parseSubscriptionTier,
  paypalPurchasableTiers,
  tierAllowance,
  tierRank,
} from "@/lib/subscription-tier-config";

describe("subscription-tier-config", () => {
  test("falls back to FREE allowance for unknown tiers", () => {
    expect(tierAllowance("unknown")).toMatchObject({
      cheapScans: 10,
      premiumScans: 0,
      maxCompanies: 1,
      monthlyPriceIls: 0,
    });
  });

  test("returns corporate balances with effective unlimited companies", () => {
    expect(defaultScanBalancesForTier("CORPORATE")).toEqual({
      cheapScansRemaining: 500,
      premiumScansRemaining: 100,
      maxCompanies: CORPORATE_MAX_COMPANIES_EFFECTIVE,
    });
  });

  test("parses only supported tier keys", () => {
    expect(parseSubscriptionTier(" dealer ")).toBe("DEALER");
    expect(parseSubscriptionTier("business")).toBeNull();
  });

  test("maps legacy plans into current tier keys", () => {
    expect(legacyPlanToTierKey("PRO")).toBe("HOUSEHOLD");
    expect(legacyPlanToTierKey("BUSINESS")).toBe("COMPANY");
    expect(legacyPlanToTierKey("ENTERPRISE")).toBe("CORPORATE");
  });

  test("returns increasing rank by tier order", () => {
    expect(tierRank("FREE")).toBeLessThan(tierRank("COMPANY"));
    expect(tierRank("COMPANY")).toBeLessThan(tierRank("CORPORATE"));
  });

  test("excludes FREE from PayPal purchasable tiers", () => {
    expect(paypalPurchasableTiers()).toEqual([
      "HOUSEHOLD",
      "DEALER",
      "COMPANY",
      "CORPORATE",
    ]);
  });
});
