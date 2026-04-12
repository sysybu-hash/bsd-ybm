import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/meckano/zones — list all zones for the org
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const zones = await prisma.meckanoZone.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ status: true, data: zones });
}

// POST /api/meckano/zones — create a new zone
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { name?: string; address?: string; description?: string; lat?: number; lng?: number; radius?: number };
  const { name, address, description, lat, lng, radius } = body;
  if (!name || !address)
    return NextResponse.json({ error: "שם וכתובת הם שדות חובה" }, { status: 400 });

  const zone = await prisma.meckanoZone.create({
    data: {
      organizationId: session.user.organizationId,
      name,
      address,
      description: description ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
      radius: radius ?? 150,
    },
  });
  return NextResponse.json({ status: true, data: zone }, { status: 201 });
}
