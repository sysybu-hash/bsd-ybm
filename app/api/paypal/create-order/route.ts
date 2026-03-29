import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isPayPalServerConfigured, paypalCreateOrderBody } from "@/lib/paypal-server";
import { planLabelHe, planPriceIls, isPlanPayPalPurchasable } from "@/lib/subscription-plans";

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

  let body: { plan?: string };
  try {
    body = (await req.json()) as { plan?: string };
  } catch {
    return NextResponse.json({ error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const plan = String(body.plan || "").toUpperCase();
  if (!isPlanPayPalPurchasable(plan)) {
    return NextResponse.json({ error: "תוכנית לא זמינה לתשלום" }, { status: 400 });
  }

  const price = planPriceIls(plan);
  if (price == null) {
    return NextResponse.json({ error: "אין מחיר לתוכנית" }, { status: 400 });
  }

  const value = price.toFixed(2);
  const customId = `${orgId}|${plan}`.slice(0, 127);

  try {
    const { id } = await paypalCreateOrderBody({
      amountValue: value,
      description: `BSD-YBM — מנוי ${planLabelHe(plan)}`,
      customId,
    });
    return NextResponse.json({ id });
  } catch (e) {
    console.error("[create-order]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "יצירת הזמנה נכשלה" },
      { status: 502 },
    );
  }
}
