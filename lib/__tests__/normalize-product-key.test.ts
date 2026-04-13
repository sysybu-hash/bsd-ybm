import { normalizeProductKey } from "@/lib/normalize-product-key";

describe("normalizeProductKey", () => {
  test("normalizes whitespace, casing, and quotes", () => {
    expect(normalizeProductKey(`  Premium   "Widget"  'XL'  `)).toBe(
      "premium widget xl",
    );
  });

  test("truncates keys to 160 characters", () => {
    const input = ` ${"A".repeat(200)} `;
    expect(normalizeProductKey(input)).toHaveLength(160);
  });
});
