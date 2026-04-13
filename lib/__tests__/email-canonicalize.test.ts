import { canonicalizeLoginEmail } from "@/lib/email-canonicalize";

describe("canonicalizeLoginEmail", () => {
  test("returns empty string for missing input", () => {
    expect(canonicalizeLoginEmail(undefined)).toBe("");
  });

  test("normalizes case and trims whitespace", () => {
    expect(canonicalizeLoginEmail("  User@Example.com  ")).toBe(
      "user@example.com",
    );
  });

  test("removes dots for gmail addresses", () => {
    expect(canonicalizeLoginEmail("First.Last@gmail.com")).toBe(
      "firstlast@gmail.com",
    );
    expect(canonicalizeLoginEmail("first.last@googlemail.com")).toBe(
      "firstlast@googlemail.com",
    );
  });

  test("preserves dots for non-gmail domains", () => {
    expect(canonicalizeLoginEmail("first.last@company.com")).toBe(
      "first.last@company.com",
    );
  });
});
