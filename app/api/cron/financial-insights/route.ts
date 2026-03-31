import { NextResponse } from "next/server";
import { runDailyInsightsForAllOrganizations } from "@/lib/financial-insights";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await runDailyInsightsForAllOrganizations();
  return NextResponse.json({ ok: true });
}
