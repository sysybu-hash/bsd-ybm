import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/meckano/sync/zones-to-crm
// Syncs active MeckanoZones as CRM Contacts (type CLIENT, no email/phone mandatory)
export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.user.organizationId;

  const zones = await prisma.meckanoZone.findMany({
    where: { organizationId: orgId, isActive: true },
  });

  if (zones.length === 0)
    return NextResponse.json({ synced: 0, message: "אין אזורים פעילים לסנכרון" });

  let synced = 0;
  for (const zone of zones) {
    // Upsert by name — contacts with same name treated as same site
    const existing = await prisma.contact.findFirst({
      where: { organizationId: orgId, name: zone.name },
    });
    if (!existing) {
      await prisma.contact.create({
        data: {
          organizationId: orgId,
          name: zone.name,
          status: "LEAD",
        },
      });
    }
    // Mark zone as synced
    await prisma.meckanoZone.update({
      where: { id: zone.id },
      data: { syncedToCrm: true },
    });
    synced++;
  }

  return NextResponse.json({ synced, message: `סונכרנו ${synced} אתרים ל-CRM` });
}
