import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;

if (!secret) {
  console.warn("STRIPE_SECRET_KEY חסר – תשלומי Stripe לא יעבדו עד להגדרה.");
}

/** לקוח Stripe – null אם אין מפתח (נתיבים בודקים לפני שימוש) */
export const stripe: Stripe | null = secret
  ? new Stripe(secret, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- גרסת API מול ה-SDK
      apiVersion: "2025-01-27.acacia" as any,
      appInfo: {
        name: "BSD-YBM Intelligence",
        version: "1.0.0",
      },
    })
  : null;
