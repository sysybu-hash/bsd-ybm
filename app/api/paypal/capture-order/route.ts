import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { CompanyType, DocStatus, DocType, type SubscriptionTier } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VAT_RATE } from "@/lib/billing-calculations";
import { isPayPalServerConfigured, paypalCaptureOrder } from "@/lib/paypal-server";
import { sendPayPalSubscriptionConfirmationEmail } from "@/lib/mail";
import { tierLabelHe, defaultScanBalancesForTier, parseSubscriptionTier } from "@/lib/subscription-tier-config";
import { getEffectiveTierMonthlyPriceIls } from "@/lib/billing-pricing";

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
  const kind = parts[1]?.trim().toUpperCase();
  const payload = parts[2]?.trim();

  if (!orgIdFromOrder || !kind || !payload || orgIdFromOrder !== orgIdSession) {
    return NextResponse.json({ ok: false, error: "הזמנה לא תואמת לארגון" }, { status: 403 });
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

  const paidTotal = parsed.paid;
  let amountNet = paidTotal;
  let vatAmt = 0;
  if (org.isReportable && org.companyType !== CompanyType.EXEMPT_DEALER) {
    amountNet = Math.round((paidTotal / (1 + VAT_RATE)) * 100) / 100;
    vatAmt = Math.round((paidTotal - amountNet) * 100) / 100;
  }

  const docType = org.isReportable ? DocType.INVOICE_RECEIPT : DocType.RECEIPT;

  let planLabel = "";
  let descriptionLine = "";

  try {
    if (kind === "BUNDLE") {
      const bundle = await prisma.scanBundle.findFirst({
        where: { id: payload, isActive: true },
      });
      if (!bundle) {
        return NextResponse.json({ ok: false, error: "חבילה לא תואמת" }, { status: 400 });
      }
      if (Math.abs(paidTotal - bundle.priceIls) > 0.02) {
        return NextResponse.json({ ok: false, error: "סכום לא תואם לחבילה" }, { status: 400 });
      }
      planLabel = bundle.name;
      descriptionLine = `חבילת סריקות BSD-YBM — ${bundle.name} (PayPal)`;

      await prisma.$transaction(async (tx) => {
        await tx.organization.update({
          where: { id: orgIdSession },
          data: {
            cheapScansRemaining: { increment: bundle.cheapAdds },
            premiumScansRemaining: { increment: bundle.premiumAdds },
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
                desc: descriptionLine,
                qty: 1,
                price: amountNet,
              },
            ],
          },
        });
      });
    } else if (kind === "TIER") {
      const tier = parseSubscriptionTier(payload) as SubscriptionTier | null;
      if (!tier || tier === "FREE") {
        return NextResponse.json({ ok: false, error: "רמת מנוי לא חוקית" }, { status: 400 });
      }
      const expected = await getEffectiveTierMonthlyPriceIls(tier);
      if (expected == null || Math.abs(paidTotal - expected) > 0.02) {
        return NextResponse.json({ ok: false, error: "סכום לא תואם לרמת המנוי" }, { status: 400 });
      }
      const balances = defaultScanBalancesForTier(tier);
      planLabel = tierLabelHe(tier);
      descriptionLine = `מנוי BSD-YBM — ${planLabel} (תשלום PayPal)`;

      await prisma.$transaction(async (tx) => {
        await tx.organization.update({
          where: { id: orgIdSession },
          data: {
            subscriptionTier: tier,
            subscriptionStatus: "ACTIVE",
            cheapScansRemaining: balances.cheapScansRemaining,
            premiumScansRemaining: balances.premiumScansRemaining,
            maxCompanies: balances.maxCompanies,
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
                desc: descriptionLine,
                qty: 1,
                price: amountNet,
              },
            ],
          },
        });
      });
    } else {
      return NextResponse.json({ ok: false, error: "סוג הזמנה לא מוכר" }, { status: 400 });
    }
  } catch (e) {
    console.error("[capture-order] db", e);
    return NextResponse.json(
      { ok: false, error: "עדכון מסד נתונים נכשל — פנה לתמיכה עם מזהה PayPal" },
      { status: 500 },
    );
  }

  void sendPayPalSubscriptionConfirmationEmail(userEmail, {
    planLabel: planLabel || "רכישה",
    amountIls: paidTotal.toLocaleString("he-IL", { minimumFractionDigits: 2 }),
    orgName: org.name,
  });

revalidatePath("/app/documents/erp");
revalidatePath("/app/billing");
revalidatePath("/app");
  revalidatePath("/app/billing");
  revalidatePath("/app");

  return NextResponse.json({
    ok: true,
    message:
      "תודה! הרכישה נרשמה. ברוך הבא לשדרה שמחברת בין כולם",
  });
}
