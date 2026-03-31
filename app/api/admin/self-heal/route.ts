import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";

/**
 * שלד לריפוי עצמי (ניתוח שגיאות + PR). לא מופעל אוטומטית — דורש הגדרת GitHub ומפתחות.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  void body;

  return NextResponse.json({
    message: "Self-healing stub: אין ביצוע אוטומטי מוגדר בסביבה זו.",
    status: "skipped",
  });
}
