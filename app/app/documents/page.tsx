import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import DocumentsWorkspaceV2 from "@/components/documents/DocumentsWorkspaceV2";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { DOC_UI_FALLBACK } from "@/lib/documents-ui-constants";
import { getIndustryProfile } from "@/lib/professions/runtime";

export const dynamic = "force-dynamic";

type AiPayload = {
  vendor?: unknown;
  total?: unknown;
  summary?: unknown;
  docType?: unknown;
};

function readAi(value: Prisma.JsonValue | null): AiPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as AiPayload) : {};
}

function numberOrZero(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = Number.parseFloat(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(normalized) ? normalized : 0;
  }
  return 0;
}

function stringOrFallback(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

export default async function AppDocumentsPage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  const [organization, scannedRaw, issuedRaw] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        industry: true,
        constructionTrade: true,
        industryConfigJson: true,
      },
    }),
    prisma.document.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        type: true,
        status: true,
        createdAt: true,
        aiData: true,
        _count: {
          select: {
            lineItems: true,
          },
        },
      },
    }),
    prisma.issuedDocument.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        number: true,
        date: true,
        dueDate: true,
        clientName: true,
        amount: true,
        vat: true,
        total: true,
        status: true,
        items: true,
        contactId: true,
      },
    }),
  ]);

  const messages = await readRequestMessages();
  const industryProfile = getIndustryProfile(
    organization?.industry ?? "CONSTRUCTION",
    organization?.industryConfigJson,
    organization?.constructionTrade,
    messages,
  );

  const scannedDocuments = scannedRaw.map((document) => {
    const ai = readAi(document.aiData);

    return {
      id: document.id,
      fileName: document.fileName,
      type: document.type,
      status: document.status,
      createdAt: document.createdAt.toISOString(),
      vendor: stringOrFallback(ai.vendor, DOC_UI_FALLBACK.unknownVendor),
      total: numberOrZero(ai.total),
      summary: stringOrFallback(ai.summary, DOC_UI_FALLBACK.noSummary),
      extractedType: stringOrFallback(ai.docType, document.type || DOC_UI_FALLBACK.unknownDocType),
      lineItemCount: document._count.lineItems,
    };
  });

  const issuedDocuments = issuedRaw.map((document) => ({
    id: document.id,
    type: document.type,
    number: document.number,
    date: document.date.toISOString(),
    dueDate: document.dueDate?.toISOString() ?? null,
    clientName: document.clientName,
    amount: document.amount,
    vat: document.vat,
      total: document.total,
      status: document.status,
      items: (Array.isArray(document.items) ? document.items : []) as Array<{ desc?: string; qty?: number; price?: number }>,
      contactId: document.contactId,
    }));

  return (
    <DocumentsWorkspaceV2
      industryProfile={industryProfile}
      scannedDocuments={scannedDocuments}
      issuedDocuments={issuedDocuments}
    />
  );
}
