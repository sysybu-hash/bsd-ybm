import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** PATCH /api/erp/issued-documents/[id] — עדכון סטטוס (PENDING → PAID / CANCELLED) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status } = body as { status: string };

  const allowed = ["PENDING", "PAID", "CANCELLED"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "סטטוס לא חוקי" }, { status: 400 });
  }

  const doc = await prisma.issuedDocument.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true },
  });
  if (!doc) return NextResponse.json({ error: "מסמך לא נמצא" }, { status: 404 });

  const updated = await prisma.issuedDocument.update({
    where: { id },
    data: { status: status as "PENDING" | "PAID" | "CANCELLED" },
  });

  return NextResponse.json({ document: updated });
}
