import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withWorkspacesAuthDynamic } from "@/lib/api-handler";
import { DocumentSchema } from "@/lib/schemas/document";

function parseAiData(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === "object") return raw as Record<string, unknown>;
  return null;
}

export const PATCH = withWorkspacesAuthDynamic<{ id: string }, typeof DocumentSchema>(
  async (_req, { orgId }, { params }, body) => {
    const { id } = await params;

    const row = await prisma.document.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true, aiData: true },
    });

    if (!row) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const currentAi = parseAiData(row.aiData) ?? {};
    const nextAi = body.aiData ? { ...currentAi, ...body.aiData } : currentAi;

    const updated = await prisma.document.update({
      where: { id },
      data: {
        fileName: typeof body.fileName === "string" ? body.fileName.trim() || undefined : undefined,
        type: typeof body.type === "string" ? body.type.trim() || undefined : undefined,
        status: typeof body.status === "string" ? body.status.trim() || undefined : undefined,
        aiData: nextAi as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ document: updated });
  },
  { schema: DocumentSchema, parseTarget: "body" },
);

export const DELETE = withWorkspacesAuthDynamic<{ id: string }>(
  async (_req, { orgId }, { params }) => {
    const { id } = await params;
    const row = await prisma.document.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true },
    });

    if (!row) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  },
);
