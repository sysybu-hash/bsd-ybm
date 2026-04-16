import type { Metadata } from "next";
import { cookies } from "next/headers";
import { COOKIE_LOCALE, normalizeLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/load-messages";
import SolutionsPageClient from "./SolutionsPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const jar = await cookies();
  const m = getMessages(normalizeLocale(jar.get(COOKIE_LOCALE)?.value)) as Record<string, unknown>;
  const ms = m.marketingSolutions as { metaTitle?: string; metaDescription?: string };
  return {
    title: `${ms.metaTitle ?? "פתרונות"} | BSD-YBM`,
    description: ms.metaDescription ?? "",
  };
}

export default function SolutionsPage() {
  return <SolutionsPageClient />;
}
