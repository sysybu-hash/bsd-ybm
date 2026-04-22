import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withWorkspacesAuth } from "@/lib/api-handler";
import { jsonBadRequest } from "@/lib/api-json";

/* ───── GET  — רשימת מסמכים שהונפקו ───── */
export const GET = withWorkspacesAuth(async (_req, { orgId }) => {
  const docs = await prisma.issuedDocument.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, type: true, number: true, date: true, dueDate: true,
      clientName: true, amount: true, vat: true, total: true,
      status: true, items: true, contactId: true, createdAt: true, updatedAt: true,
    },
  });

  return NextResponse.json({ documents: docs });
});

/* ───── POST — הנפקת מסמך חדש (חשבונית / קבלה / חש״ק / זיכוי) ───── */
export const POST = withWorkspacesAuth(async (req, { orgId }) => {
  const body = await req.json();
  const { type, clientName, items, dueDate, contactId } = body as {
    type: "INVOICE" | "RECEIPT" | "INVOICE_RECEIPT" | "CREDIT_NOTE";
    clientName: string;
    items: { desc: string; qty: number; price: number }[];
    dueDate?: string;
    contactId?: string;
  };

  if (!type || !clientName || !Array.isArray(items) || items.length === 0) {
    return jsonBadRequest("נדרשים type, clientName ולפחות פריט אחד.", "invalid_issued_payload");
  }

  /* חישוב סכומים */
  const amount = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const vat = Math.round(amount * 0.17 * 100) / 100;
  const total = Math.round((amount + vat) * 100) / 100;

  /* מספר רץ — MAX(number) + 1 לסוג מסמך בתוך הארגון */
  const last = await prisma.issuedDocument.findFirst({
    where: { organizationId: orgId, type },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const nextNumber = (last?.number ?? 1000) + 1;

  /* אם נשלח contactId — וודא שהוא שייך לאותו ארגון */
  let resolvedContactId: string | undefined;
  if (contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, organizationId: orgId },
      select: { id: true },
    });
    resolvedContactId = contact?.id;
  }

  const doc = await prisma.issuedDocument.create({
    data: {
      type,
      number: nextNumber,
      clientName,
      amount,
      vat,
      total,
      items: items as unknown as object,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      organizationId: orgId,
      contactId: resolvedContactId ?? null,
    },
  });

  return NextResponse.json({ document: doc }, { status: 201 });
});
