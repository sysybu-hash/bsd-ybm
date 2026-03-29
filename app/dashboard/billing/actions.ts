"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";
import { DocStatus, DocType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateTotals } from "@/lib/billing-calculations";

export type CreateIssuedDocumentInput = {
  type: DocType;
  clientName: string;
  netAmount: number;
  items: unknown;
};

export type CreateIssuedDocumentResult =
  | { ok: true; docNumber: number }
  | { ok: false; error: string };

export async function createIssuedDocument(
  data: CreateIssuedDocumentInput,
): Promise<CreateIssuedDocumentResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "יש להתחבר למערכת." };
  }
  if (!session.user.organizationId) {
    return { ok: false, error: "לא נמצא ארגון משויך." };
  }

  const orgId = session.user.organizationId;

  const clientName = data.clientName.trim();
  if (clientName.length < 1) {
    return { ok: false, error: "נא למלא שם לקוח." };
  }

  if (!Object.values(DocType).includes(data.type)) {
    return { ok: false, error: "סוג מסמך לא תקין." };
  }

  const netAmount = Number(data.netAmount);
  if (!Number.isFinite(netAmount) || netAmount < 0) {
    return { ok: false, error: "סכום לפני מע״מ לא תקין." };
  }

  const itemsJson: Prisma.InputJsonValue = Array.isArray(data.items)
    ? (data.items as Prisma.InputJsonValue)
    : [];

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { companyType: true },
  });

  if (!org) {
    return { ok: false, error: "הארגון לא נמצא." };
  }

  const { vat, total } = calculateTotals(netAmount, org.companyType);

  const lastDoc = await prisma.issuedDocument.findFirst({
    where: { organizationId: orgId, type: data.type },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const nextNumber = (lastDoc?.number ?? 1000) + 1;

  try {
    const newDoc = await prisma.issuedDocument.create({
      data: {
        organizationId: orgId,
        type: data.type,
        number: nextNumber,
        clientName,
        amount: netAmount,
        vat,
        total,
        items: itemsJson,
        status: DocStatus.PENDING,
      },
    });

    revalidatePath("/dashboard/billing");
    return { ok: true, docNumber: newDoc.number };
  } catch (e) {
    console.error("createIssuedDocument", e);
    return { ok: false, error: "שמירת המסמך נכשלה." };
  }
}

const DOC_TYPE_CSV: Record<DocType, string> = {
  INVOICE: "חשבונית מס",
  RECEIPT: "קבלה",
  INVOICE_RECEIPT: "חשבונית מס קבלה",
  CREDIT_NOTE: "חשבונית זיכוי",
};

const DOC_STATUS_CSV: Record<DocStatus, string> = {
  PAID: "שולם במלואו",
  PENDING: "בהמתנה לתשלום",
  CANCELLED: "מבוטל",
};

function csvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export type ExportMonthlyReportResult =
  | { ok: true; csv: string; fileName: string }
  | { ok: false; error: string };

export async function exportMonthlyReport(
  month: number,
  year: number,
): Promise<ExportMonthlyReportResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return { ok: false, error: "לא מורשה" };
  }

  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(m) || m < 1 || m > 12) {
    return { ok: false, error: "חודש לא תקין" };
  }
  if (!Number.isInteger(y) || y < 2000 || y > 2100) {
    return { ok: false, error: "שנה לא תקינה" };
  }

  const startDate = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(y, m, 0, 23, 59, 59, 999);

  const documents = await prisma.issuedDocument.findMany({
    where: {
      organizationId: session.user.organizationId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: [{ date: "asc" }, { type: "asc" }, { number: "asc" }],
  });

  if (documents.length === 0) {
    return { ok: false, error: "לא נמצאו מסמכים לתקופה זו" };
  }

  const headers = ["מספר", "תאריך", "לקוח", "סוג", "נטו", "מע״מ", "סה״כ", "סטטוס"];
  const rows = documents.map((doc) => [
    csvCell(doc.number),
    csvCell(new Date(doc.date).toLocaleDateString("he-IL")),
    csvCell(doc.clientName),
    csvCell(DOC_TYPE_CSV[doc.type]),
    csvCell(doc.amount.toFixed(2)),
    csvCell(doc.vat.toFixed(2)),
    csvCell(doc.total.toFixed(2)),
    csvCell(DOC_STATUS_CSV[doc.status]),
  ]);

  const csvContent = [headers.map(csvCell).join(","), ...rows.map((r) => r.join(","))].join("\n");

  return {
    ok: true,
    csv: csvContent,
    fileName: `bsd_ybm_issued_${y}_${String(m).padStart(2, "0")}.csv`,
  };
}
