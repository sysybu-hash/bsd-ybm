import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type MeckanoEmployee = {
  id: number;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  workerTag?: string | null;
  role?: string | null;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orgId = session.user.organizationId;
  if (!orgId) {
    return NextResponse.json({ error: "אין ארגון" }, { status: 403 });
  }

  const body = (await req.json()) as { employees?: MeckanoEmployee[] };
  const employees = body.employees ?? [];
  if (!employees.length) {
    return NextResponse.json({ synced: 0 });
  }

  let synced = 0;
  for (const emp of employees) {
    const name = [emp.firstName, emp.lastName].filter(Boolean).join(" ") ||
      emp.workerTag ||
      emp.email ||
      `עובד #${emp.id}`;

    // upsert by email if available, otherwise by meckano id in name field
    const existing = emp.email
      ? await prisma.contact.findFirst({
          where: { organizationId: orgId, email: emp.email },
        })
      : null;

    if (existing) {
      await prisma.contact.update({
        where: { id: existing.id },
        data: { name, email: emp.email ?? existing.email },
      });
    } else {
      await prisma.contact.create({
        data: {
          name,
          email: emp.email ?? null,
          organizationId: orgId,
          status: "ACTIVE",
        },
      });
    }
    synced++;
  }

  return NextResponse.json({ synced });
}
