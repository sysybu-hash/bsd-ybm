import { PLATFORM_UNLIMITED_CREDITS } from "@/lib/platform-developers";

/** מכסות "אינסוף" למפתחי פלטפורמה — לא מציגים את המספר הגולמי */
export function isEffectivelyUnlimitedCredits(value: number): boolean {
  return value >= 1_000_000_000 || value === PLATFORM_UNLIMITED_CREDITS;
}

export function formatCreditsForDisplay(value: number): string {
  if (isEffectivelyUnlimitedCredits(value)) {
    return "ללא הגבלה (מפתח פלטפורמה)";
  }
  return value.toLocaleString("he-IL");
}
