import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isPayPalServerConfigured, paypalCreateOrderBody } from "@/lib/paypal-server";
import {
  parseSubscriptionTier,
  tierLabelHe,
} from "@/lib/subscription-tier-config";
import { getEffectiveTierMonthlyPriceIls } from "@/lib/billing-pricing";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  if (!isPayPalServerConfigured()) {
    return NextResponse.json(
      { error: "PayPal לא מוגדר בשרת (חסר מפתח סודי או מזהה לקוח)" },
      { status: 503 },
    );
  }

  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;
  if (!session?.user?.id || !orgId) {
    return NextResponse.json({ error: "נדרשת התחברות וארגון" }, { status: 401 });
  }

  let body: { tier?: string; bundleId?: string };
  try {
    body = (await req.json()) as { tier?: string; bundleId?: string };
  } catch {
    return NextResponse.json({ error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const tierRaw = String(body.tier ?? "").trim().toUpperCase();
  const bundleId = String(body.bundleId ?? "").trim();

  if (bundleId) {
    const bundle = await prisma.scanBundle.findFirst({
      where: { id: bundleId, isActive: true },
    });
    if (!bundle) {
      return NextResponse.json({ error: "חבילה לא נמצאה או לא פעילה" }, { status: 400 });
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
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "יצירת הזמנה נכשלה" },
        { status: 502 },
      );
    }
  }

  const tier = parseSubscriptionTier(tierRaw);
  if (!tier || tier === "FREE") {
    return NextResponse.json({ error: "רמת מנוי לא זמינה לתשלום" }, { status: 400 });
  }

  const price = await getEffectiveTierMonthlyPriceIls(tier);
  if (price == null) {
    return NextResponse.json({ error: "אין מחיר לרמה זו — פנו לתמיכה" }, { status: 400 });
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
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "יצירת הזמנה נכשלה" },
      { status: 502 },
    );
  }
}
