import type { Metadata } from "next";
import { cookies } from "next/headers";
import { COOKIE_LOCALE, normalizeLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/load-messages";
import BriefPageClient from "./BriefPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const jar = await cookies();
  const m = getMessages(normalizeLocale(jar.get(COOKIE_LOCALE)?.value)) as Record<string, unknown>;
  const b = m.brandBriefPage as { metaTitle?: string; metaDescription?: string };
  return {
    title: `${b.metaTitle ?? "בריף"} | BSD-YBM`,
    description: b.metaDescription ?? "",
  };
}

export default function BriefPage() {
  return <BriefPageClient />;
}
