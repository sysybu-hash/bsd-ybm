import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  jsonBadGateway,
  jsonBadRequest,
  jsonServiceUnavailable,
  jsonUnauthorized,
} from "@/lib/api-json";
import { isPayPalServerConfigured, paypalCreateOrderBody } from "@/lib/paypal-server";
import {
  parseSubscriptionTier,
  tierLabelHe,
} from "@/lib/subscription-tier-config";
import { getEffectiveTierMonthlyPriceIls } from "@/lib/billing-pricing";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  if (!isPayPalServerConfigured()) {
    return jsonServiceUnavailable(
      "PayPal לא מוגדר בשרת (חסר מפתח סודי או מזהה לקוח)",
      "paypal_not_configured",
    );
  }

  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;
  if (!session?.user?.id || !orgId) {
    return jsonUnauthorized("נדרשת התחברות וארגון.");
  }

  let body: { tier?: string; bundleId?: string };
  try {
    body = (await req.json()) as { tier?: string; bundleId?: string };
  } catch {
    return jsonBadRequest("גוף בקשה לא תקין", "invalid_json");
  }

  const tierRaw = String(body.tier ?? "").trim().toUpperCase();
  const bundleId = String(body.bundleId ?? "").trim();

  if (bundleId) {
    const bundle = await prisma.scanBundle.findFirst({
      where: { id: bundleId, isActive: true },
    });
    if (!bundle) {
      return jsonBadRequest("חבילה לא נמצאה או לא פעילה", "bundle_not_found");
    }
    const value = bundle.priceIls.toFixed(2);
    const customId = `${orgId}|BUNDLE|${bundle.id}`.slice(0, 127);
    try {
      const { id } = await paypalCreateOrderBody({
        amountValue: value,
        description: `BSD-YBM — ${bundle.name}`,
        customId,
      });
      return NextResponse.json({ id });
    } catch (e) {
      console.error("[create-order bundle]", e);
      return jsonBadGateway(e instanceof Error ? e.message : "יצירת הזמנה נכשלה");
    }
  }

  const tier = parseSubscriptionTier(tierRaw);
  if (!tier || tier === "FREE") {
    return jsonBadRequest("רמת מנוי לא זמינה לתשלום", "invalid_tier");
  }

  const price = await getEffectiveTierMonthlyPriceIls(tier);
  if (price == null) {
    return jsonBadRequest("אין מחיר לרמה זו — פנו לתמיכה", "no_price");
  }

  const value = price.toFixed(2);
  const customId = `${orgId}|TIER|${tier}`.slice(0, 127);

  try {
    const { id } = await paypalCreateOrderBody({
      amountValue: value,
      description: `BSD-YBM — מנוי ${tierLabelHe(tier)}`,
      customId,
    });
    return NextResponse.json({ id });
  } catch (e) {
    console.error("[create-order tier]", e);
    return jsonBadGateway(e instanceof Error ? e.message : "יצירת הזמנה נכשלה");
  }
}
