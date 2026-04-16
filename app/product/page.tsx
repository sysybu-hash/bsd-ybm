import type { Metadata } from "next";
import { cookies } from "next/headers";
import { COOKIE_LOCALE, normalizeLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/load-messages";
import ProductPageClient from "./ProductPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const jar = await cookies();
  const m = getMessages(normalizeLocale(jar.get(COOKIE_LOCALE)?.value)) as Record<string, unknown>;
  const mp = m.marketingProduct as { metaTitle?: string; metaDescription?: string };
  return {
    title: `${mp.metaTitle ?? "המוצר"} | BSD-YBM`,
    description: mp.metaDescription ?? "",
  };
}

export default function ProductPage() {
  return <ProductPageClient />;
}
