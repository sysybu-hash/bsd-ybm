import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ServiceStatus = {
  name: string;
  ok: boolean;
  detail: string;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const statuses: ServiceStatus[] = [];

  try {
    await prisma.$queryRaw`SELECT 1`;
    statuses.push({ name: "Database", ok: true, detail: "מחובר" });
  } catch {
    statuses.push({ name: "Database", ok: false, detail: "שגיאת חיבור" });
  }

  statuses.push({
    name: "AI Engine",
    ok: Boolean(
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.OPENAI_API_KEY ||
        process.env.ANTHROPIC_API_KEY,
    ),
    detail: "בדיקת מפתחות API",
  });

  statuses.push({
    name: "Stripe",
    ok: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    detail: process.env.STRIPE_SECRET_KEY?.trim() ? "מוגדר" : "לא מוגדר",
  });

  statuses.push({
    name: "Meckano",
    ok: Boolean(process.env.MECKANO_API_KEY?.trim()),
    detail: process.env.MECKANO_API_KEY?.trim() ? "מפתח מוגדר" : "חסר מפתח",
  });

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    statuses,
  });
}
