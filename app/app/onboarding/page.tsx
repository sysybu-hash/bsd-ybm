import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TradePickerClient from "@/components/onboarding/TradePickerClient";
import AppPageChrome from "@/components/workspace/AppPageChrome";
import { CONSTRUCTION_TRADE_IDS } from "@/lib/construction-trades";

export const dynamic = "force-dynamic";

const TRADE_LABELS: Record<string, string> = {
  GENERAL_CONTRACTOR: "קבלן ראשי / ליווי פרויקט",
  ELECTRICAL:         "חשמלאי / עבודות חשמל",
  PLUMBING:           "אינסטלציה ותברואה",
  HVAC:               "מיזוג אוויר",
  PAINTING:           "צבע, טיח ושליכט",
  FLOORING:           "ריצוף, אבן וקרמיקה",
  ALUMINUM:           "אלומיניום וזכוכית",
  FINISHING:          "גמר פנים (דלתות, מטבח…)",
  LANDSCAPING:        "גינון קשיח / חוץ",
  SUBCONTRACTOR_OTHER:"קבלן משנה / אחר",
};

const TRADE_EMOJI: Record<string, string> = {
  GENERAL_CONTRACTOR: "🏗️",
  ELECTRICAL:         "⚡",
  PLUMBING:           "🔧",
  HVAC:               "❄️",
  PAINTING:           "🎨",
  FLOORING:           "🪵",
  ALUMINUM:           "🪟",
  FINISHING:          "🚪",
  LANDSCAPING:        "🌿",
  SUBCONTRACTOR_OTHER:"🔨",
};

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;

  if (!organizationId) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { constructionTrade: true },
  });

  const trades = CONSTRUCTION_TRADE_IDS.map((id) => ({
    id,
    label: TRADE_LABELS[id] ?? id,
    emoji: TRADE_EMOJI[id] ?? "🔨",
  }));

  return (
    <AppPageChrome>
    <TradePickerClient
      trades={trades}
      currentTrade={org?.constructionTrade ?? null}
    />
    </AppPageChrome>
  );
}
