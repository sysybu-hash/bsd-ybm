import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Document } from "@prisma/client";

/** חיפוש מסמכי ERP (ארכיון חכם) – פרמטר `q` */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    const docs = await prisma.document.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ documents: docs });
  }

  const pattern = `%${q}%`;
  const docs = await prisma.$queryRaw<Document[]>`
    SELECT * FROM "Document"
    WHERE "organizationId" = ${orgId}
    AND (
      "fileName" ILIKE ${pattern}
      OR "type" ILIKE ${pattern}
      OR COALESCE("aiData"::text, '') ILIKE ${pattern}
    )
    ORDER BY "createdAt" DESC
  `;

  return NextResponse.json({ documents: docs, q });
}
