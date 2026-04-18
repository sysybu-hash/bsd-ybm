/**
 * ערכי ברירת מחדל לשדות AI/מסמך כשאין נתונים — חייבים להיות זהים ל־`app/app/documents/page.tsx`.
 * התצוגה מתורגמת ב־UI; הערך המאוחסן נשאר יציב לסינון ולשמירה.
 */
export const DOC_UI_FALLBACK = {
  unknownVendor: "ספק לא זוהה",
  noSummary: "עדיין אין תקציר זמין למסמך הזה.",
  unknownDocType: "סוג מסמך לא זוהה",
} as const;
