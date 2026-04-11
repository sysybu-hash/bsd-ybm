/**
 * פרטי זיהוי לאתר המשפטי — עדכן כאן או דרך משתני סביבה (ראו למטה).
 * אין כאן ייעוץ משפטי; הנוסחים למילוי על ידי בעל העסק / יועץ.
 */
export const legalSite = {
  siteName: "BSD-YBM Intelligence",
  /** שם מפעיל / חברה — לעדכן */
  operatorDisplayName: "יוחנן בוקשפן",
  /** כתובת אתר רשמית */
  publicUrl: "https://www.bsd-ybm.co.il",
  /** אימייל לפניות משפטיות — עדיף להגדיר NEXT_PUBLIC_LEGAL_CONTACT_EMAIL ב-Vercel */
  contactEmail:
    typeof process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL === "string" &&
    process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL.length > 0
      ? process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL
      : "yb@bsd-ybm.co.il",
  /** תאריך עדכון אחרון של מסמכים (מחרוזת להצגה) */
  documentsLastUpdated: "מרץ BSD-YBM",
} as const;
