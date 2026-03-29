import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

function parseAiData(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === "object") return raw as Record<string, unknown>;
  return null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;
  if (!session?.user?.id || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as {
    fileName?: string;
    type?: string;
    status?: string;
    aiData?: Record<string, unknown>;
  };

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
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;
  if (!session?.user?.id || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
}
