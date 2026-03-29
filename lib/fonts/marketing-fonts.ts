import { Heebo } from "next/font/google";

/** תפריט ציבורי / מגירה — עברית מודרנית */
export const marketingSans = Heebo({
  subsets: ["hebrew", "latin"],
  display: "swap",
  adjustFontFallback: true,
});
