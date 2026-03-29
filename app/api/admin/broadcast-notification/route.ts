import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformDeveloperEmail } from "@/lib/platform-developers";
import { hasMeckanoAccess } from "@/lib/meckano-access";

const TITLE_MAX = 160;
const BODY_MAX = 4000;
const CHUNK = 400;

function canBroadcast(session: Session | null): boolean {
  const u = session?.user as { email?: string | null } | undefined;
  if (!u?.email) return false;
  if (hasMeckanoAccess(u.email)) return false;
  return isPlatformDeveloperEmail(u.email);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!canBroadcast(session)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const raw = (await req.json().catch(() => null)) as { title?: unknown; body?: unknown } | null;
  const title = typeof raw?.title === "string" ? raw.title.trim() : "";
  const body = typeof raw?.body === "string" ? raw.body.trim() : "";

  if (!title || !body) {
    return NextResponse.json({ error: "חובה כותרת ותוכן" }, { status: 400 });
  }
  if (title.length > TITLE_MAX || body.length > BODY_MAX) {
    return NextResponse.json({ error: "הטקסט ארוך מדי" }, { status: 400 });
  }

  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length === 0) {
    return NextResponse.json({ ok: true, count: 0 });
  }

  for (let i = 0; i < users.length; i += CHUNK) {
    const slice = users.slice(i, i + CHUNK);
    await prisma.inAppNotification.createMany({
      data: slice.map((u) => ({
        userId: u.id,
        title,
        body,
      })),
    });
  }

  return NextResponse.json({ ok: true, count: users.length });
}
