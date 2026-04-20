import type { Metadata } from "next";
import { cookies } from "next/headers";
import { COOKIE_LOCALE, normalizeLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/load-messages";
import ProfessionalPageClient from "./ProfessionalPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const jar = await cookies();
  const m = getMessages(normalizeLocale(jar.get(COOKIE_LOCALE)?.value)) as Record<string, unknown>;
  const p = m.professionalPage as { metaTitle?: string; metaDescription?: string };
  return {
    title: `${p.metaTitle ?? "תוכן מקצועי"} | BSD-YBM`,
    description: p.metaDescription ?? "",
  };
}

export default function ProfessionalPage() {
  return <ProfessionalPageClient />;
}
