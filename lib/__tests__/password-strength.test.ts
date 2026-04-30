import { generateProvisionPassword, validatePasswordStrength } from "@/lib/password";

describe("validatePasswordStrength", () => {
  it("rejects short passwords", () => {
    expect(validatePasswordStrength("Aa123456")).toEqual({
      ok: false,
      message: "הסיסמה חייבת להכיל לפחות 12 תווים.",
    });
  });

  it("rejects passwords without mixed case and a digit", () => {
    expect(validatePasswordStrength("lowercaseonly")).toEqual({
      ok: false,
      message: "הסיסמה חייבת לכלול אות גדולה, אות קטנה וספרה.",
    });
  });

  it("accepts generated provisioning passwords", () => {
    expect(validatePasswordStrength(generateProvisionPassword()).ok).toBe(true);
  });
});
