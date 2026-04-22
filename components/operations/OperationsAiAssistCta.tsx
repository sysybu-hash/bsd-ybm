"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSession } from "next-auth/react";
import AiAssistInlineLauncher from "@/components/ai/AiAssistInlineLauncher";
import { useI18n } from "@/components/I18nProvider";
import { getIndustryProfile } from "@/lib/professions/runtime";

type Props = {
  organizationName: string;
};

/** עוזר תפעולי במקום — בלי חובה לעבור למסך AI מרכזי */
export default function OperationsAiAssistCta({ organizationName }: Props) {
  const { data: session } = useSession();
  const { messages } = useI18n();
  const orgId = session?.user?.organizationId ?? null;

  const userFirstName =
    (session?.user?.name ?? "").trim().split(" ")[0] ||
    session?.user?.email?.split("@")[0] ||
    "";

  const industryProfile = useMemo(
    () =>
      getIndustryProfile(
        (session?.user as { organizationIndustry?: string | null })?.organizationIndustry ?? "CONSTRUCTION",
        null,
        (session?.user as { organizationConstructionTrade?: string | null })?.organizationConstructionTrade ?? null,
        messages,
      ),
    [session, messages],
  );

  if (!orgId) {
    return (
      <Link
        href="/app/ai#assistant"
        className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-700"
      >
        פתח עוזר תפעולי
      </Link>
    );
  }

  return (
    <AiAssistInlineLauncher
      orgId={orgId}
      industryProfile={industryProfile}
      sectionLabel="תפעול"
      sectionSummary={`ארגון: ${organizationName}. סקירת בריאות תפעולית, אוטומציות והמלצות.`}
      userFirstName={userFirstName}
      triggerLabel="פתח עוזר תפעולי"
      triggerClassName="rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-700"
      triggerShowArrow={false}
    />
  );
}
