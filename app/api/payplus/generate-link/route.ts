import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type PayPlusGenerateResponse = {
  results?: { status?: string; code?: number; description?: string };
  data?: {
    payment_page_link?: string;
    page_request_uid?: string;
  };
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;
  if (!orgId) {
    return NextResponse.json({ error: "נדרשת התחברות עם ארגון" }, { status: 401 });
  }

  const apiKey = process.env.PAYPLUS_API_KEY?.trim();
  const secretKey = process.env.PAYPLUS_SECRET_KEY?.trim();
  const pageUid = process.env.PAYPLUS_PAYMENT_PAGE_UID?.trim();
  const apiBase = (
    process.env.PAYPLUS_API_URL ?? "https://restapi.payplus.co.il/api/v1.0"
  ).replace(/\/$/, "");

  if (!apiKey || !secretKey || !pageUid) {
    return NextResponse.json(
      {
        error:
          "PayPlus לא מוגדר — הוסף PAYPLUS_API_KEY, PAYPLUS_SECRET_KEY, PAYPLUS_PAYMENT_PAGE_UID",
      },
      { status: 503 },
    );
  }

  let body: { invoiceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const invoiceId = body.invoiceId?.trim();
  if (!invoiceId) {
    return NextResponse.json({ error: "חסר invoiceId" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: orgId },
  });

  if (!invoice) {
    return NextResponse.json({ error: "חשבונית לא נמצאה" }, { status: 404 });
  }

  if (invoice.status === "PAID") {
    return NextResponse.json({ error: "חשבונית כבר שולמה" }, { status: 400 });
  }

  const amount = invoice.amount;
  if (amount == null || amount <= 0) {
    return NextResponse.json(
      { error: "סכום לא חוקי בחשבונית" },
      { status: 400 },
    );
  }

  const customerName =
    invoice.customerName?.trim() ||
    session.user?.name?.trim() ||
    "לקוח";
  const email =
    invoice.customerEmail?.trim() ||
    session.user?.email?.trim() ||
    "";
  if (!email) {
    return NextResponse.json(
      { error: "חסר אימייל לקוח — עדכן בחשבונית או בפרופיל" },
      { status: 400 },
    );
  }

  const baseUrl = (
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");

  const payload = {
    payment_page_uid: pageUid,
    charge_method: 1,
    amount,
    currency_code: invoice.currency || "ILS",
    sendEmailApproval: true,
    sendEmailFailure: false,
    language_code: "he",
    refURL_success: `${baseUrl}/dashboard/billing?payplus=ok`,
    refURL_failure: `${baseUrl}/dashboard/billing?payplus=fail`,
    refURL_callback: `${baseUrl}/api/webhooks/payplus`,
    more_info: invoice.id,
    customer: {
      customer_name: customerName,
      email,
    },
  };

  const res = await fetch(`${apiBase}/PaymentPages/generateLink`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
      "secret-key": secretKey,
    },
    body: JSON.stringify(payload),
  });

  const json = (await res.json()) as PayPlusGenerateResponse;

  if (!res.ok) {
    console.error("[PayPlus generateLink] HTTP", res.status, json);
    return NextResponse.json(
      { error: "PayPlus דחה את הבקשה" },
      { status: 502 },
    );
  }

  const ok =
    json.results?.status === "success" ||
    json.results?.code === 0 ||
    Boolean(json.data?.payment_page_link);

  const link = json.data?.payment_page_link;
  if (!ok || !link) {
    console.error("[PayPlus generateLink] תשובה לא צפויה:", json);
    return NextResponse.json(
      { error: json.results?.description ?? "לא התקבל קישור תשלום" },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: link });
}
