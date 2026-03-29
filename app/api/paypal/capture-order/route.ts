import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { CompanyType, DocStatus, DocType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VAT_RATE } from "@/lib/billing-calculations";
import { isPayPalServerConfigured, paypalCaptureOrder } from "@/lib/paypal-server";
import { sendPayPalSubscriptionConfirmationEmail } from "@/lib/mail";
import { planDefaultCredits, planLabelHe, planPriceIls } from "@/lib/subscription-plans";

function parseCapturePayload(data: Record<string, unknown>): {
  customId: string;
  paid: number;
  currency: string;
  captureStatus: string;
} | null {
  const orderStatus = String(data.status || "");
  const units = data.purchase_units as unknown[] | undefined;
  const u0 = units?.[0] as Record<string, unknown> | undefined;
  if (!u0 || orderStatus !== "COMPLETED") return null;
  const customId = String(u0.custom_id || "");
  const payments = u0.payments as Record<string, unknown> | undefined;
  const captures = payments?.captures as unknown[] | undefined;
  const cap0 = captures?.[0] as Record<string, unknown> | undefined;
  const amount = cap0?.amount as Record<string, unknown> | undefined;
  const value = amount?.value != null ? parseFloat(String(amount.value)) : NaN;
  const currency = String(amount?.currency_code || "");
  const capStatus = String(cap0?.status || "");
  if (!customId || !Number.isFinite(value) || capStatus !== "COMPLETED") return null;
  return { customId, paid: value, currency, captureStatus: capStatus };
}

export async function POST(req: Request) {
  if (!isPayPalServerConfigured()) {
    return NextResponse.json(
      { ok: false, error: "PayPal לא מוגדר בשרת" },
      { status: 503 },
    );
  }

  const session = await getServerSession(authOptions);
  const orgIdSession = session?.user?.organizationId;
  const userEmail = session?.user?.email;
  if (!session?.user?.id || !orgIdSession || !userEmail) {
    return NextResponse.json({ ok: false, error: "נדרשת התחברות" }, { status: 401 });
  }

  let body: { orderID?: string };
  try {
    body = (await req.json()) as { orderID?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const orderID = String(body.orderID || "").trim();
  if (!orderID) {
    return NextResponse.json({ ok: false, error: "חסר מזהה הזמנה" }, { status: 400 });
  }

  let raw: Record<string, unknown>;
  try {
    raw = await paypalCaptureOrder(orderID);
  } catch (e) {
    console.error("[capture-order] capture", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Capture נכשל" },
      { status: 502 },
    );
  }

  const parsed = parseCapturePayload(raw);
  if (!parsed || parsed.captureStatus !== "COMPLETED") {
    return NextResponse.json({ ok: false, error: "תשלום לא הושלם" }, { status: 400 });
  }

  if (parsed.currency !== "ILS") {
    return NextResponse.json({ ok: false, error: "מטבע לא צפוי" }, { status: 400 });
  }

  const parts = parsed.customId.split("|");
  const orgIdFromOrder = parts[0]?.trim();
  const planFromOrder = parts[1]?.trim().toUpperCase();
  if (!orgIdFromOrder || !planFromOrder || orgIdFromOrder !== orgIdSession) {
    return NextResponse.json({ ok: false, error: "הזמנה לא תואמת לארגון" }, { status: 403 });
  }

  const expected = planPriceIls(planFromOrder);
  if (expected == null || Math.abs(parsed.paid - expected) > 0.02) {
    return NextResponse.json({ ok: false, error: "סכום לא תואם לתוכנית" }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgIdSession },
    select: {
      name: true,
      companyType: true,
      isReportable: true,
    },
  });
  if (!org) {
    return NextResponse.json({ ok: false, error: "ארגון לא נמצא" }, { status: 404 });
  }

  const credits = planDefaultCredits(planFromOrder);
  const planLabel = planLabelHe(planFromOrder);
  const paidTotal = parsed.paid;

  let amountNet = paidTotal;
  let vatAmt = 0;
  if (org.isReportable && org.companyType !== CompanyType.EXEMPT_DEALER) {
    amountNet = Math.round((paidTotal / (1 + VAT_RATE)) * 100) / 100;
    vatAmt = Math.round((paidTotal - amountNet) * 100) / 100;
  }

  const docType = org.isReportable ? DocType.INVOICE_RECEIPT : DocType.RECEIPT;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: orgIdSession },
        data: {
          plan: planFromOrder,
          subscriptionStatus: "ACTIVE",
          creditsRemaining: credits,
          monthlyAllowance: credits,
        },
      });

      const lastDoc = await tx.issuedDocument.findFirst({
        where: { organizationId: orgIdSession, type: docType },
        orderBy: { number: "desc" },
        select: { number: true },
      });
      const nextNumber = (lastDoc?.number ?? 1000) + 1;

      await tx.issuedDocument.create({
        data: {
          organizationId: orgIdSession,
          type: docType,
          number: nextNumber,
          clientName: org.name,
          amount: amountNet,
          vat: vatAmt,
          total: paidTotal,
          status: DocStatus.PAID,
          items: [
            {
              desc: `מנוי BSD-YBM — ${planLabel} (תשלום PayPal)`,
              qty: 1,
              price: amountNet,
            },
          ],
        },
      });
    });
  } catch (e) {
    console.error("[capture-order] db", e);
    return NextResponse.json(
      { ok: false, error: "עדכון מסד נתונים נכשל — פנה לתמיכה עם מזהה PayPal" },
      { status: 500 },
    );
  }

  void sendPayPalSubscriptionConfirmationEmail(userEmail, {
    planLabel,
    amountIls: paidTotal.toLocaleString("he-IL", { minimumFractionDigits: 2 }),
    orgName: org.name,
  });

  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard");

  return NextResponse.json({
    ok: true,
    message:
      "תודה! המנוי שלך הופעל. ברוך הבא לשדרה שמחברת בין כולם",
  });
}
