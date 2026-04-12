import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

type Payload = {
  action?: string;
  details?: string;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const orgId = session?.user?.organizationId;

  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Payload | null;
  const action = typeof body?.action === "string" ? body.action.trim() : "";
  const details = typeof body?.details === "string" ? body.details.trim() : "";

  if (!action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  await logActivity(userId, orgId, `WIZARD:${action}`, details || undefined);
  return NextResponse.json({ ok: true });
}
