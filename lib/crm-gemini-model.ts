/**
 * בחירת מודל Gemini לניתוח CRM: FREE → Flash, PRO/ENTERPRISE/BUSINESS או SUPER_ADMIN → Pro.
 * ניתן לעקוף ב־CRM_ANALYSIS_GEMINI_MODEL / PREMIUM_GEMINI_MODEL.
 */
export const CRM_FLASH_MODEL_DEFAULT = "gemini-2.5-flash";
export const CRM_PREMIUM_MODEL_DEFAULT = "gemini-2.5-pro";

export function resolveCrmGeminiModel(
  orgPlan: string,
  callerRole: string | undefined,
): string {
  const flash =
    process.env.CRM_ANALYSIS_GEMINI_MODEL?.trim() || CRM_FLASH_MODEL_DEFAULT;
  const pro = process.env.PREMIUM_GEMINI_MODEL?.trim() || CRM_PREMIUM_MODEL_DEFAULT;

  const plan = (orgPlan || "").toUpperCase();
  const orgPremium =
    plan === "PRO" || plan === "ENTERPRISE" || plan === "BUSINESS";
  const platformAdmin = callerRole === "SUPER_ADMIN";

  if (orgPremium || platformAdmin) {
    return pro;
  }
  return flash;
}
