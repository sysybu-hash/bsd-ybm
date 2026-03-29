import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function mockAllowed() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.PAYPLUS_ALLOW_MOCK === "true"
  );
}

export async function POST(req: Request) {
  if (!mockAllowed()) {
    return NextResponse.json(
      { error: "סימולציית תשלום אינה זמינה בסביבה זו" },
      { status: 403 },
    );
  }

  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;
  if (!session?.user?.id || !orgId) {
    return NextResponse.json({ error: "נדרשת התחברות עם ארגון" }, { status: 401 });
  }

  let body: { invoiceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const invoiceId = typeof body.invoiceId === "string" ? body.invoiceId.trim() : "";
  if (!invoiceId) {
    return NextResponse.json({ error: "חסר מזהה חשבונית" }, { status: 400 });
  }

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: orgId },
    });
    if (!invoice) {
      return NextResponse.json({ error: "חשבונית לא נמצאה" }, { status: 404 });
    }
    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "חשבונית כבר מסומנת כשולמה" }, { status: 400 });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        payplusTransactionId: `mock_txn_${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      },
    });

    return NextResponse.json({ success: true, invoice: updatedInvoice });
  } catch (e) {
    console.error("mock-payment:", e);
    return NextResponse.json({ error: "שגיאה בסימולציית התשלום" }, { status: 500 });
  }
}
