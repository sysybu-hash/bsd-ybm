import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { ProcessDocumentResult } from "@/app/actions/process-document";
import { processDocumentAction } from "@/app/actions/process-document";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/is-admin";
import { checkRateLimit } from "@/lib/rate-limit";

const UPLOADS_PER_MINUTE = 5;
const UPLOADS_PER_MINUTE_PLATFORM = 60;

export async function POST(req: NextRequest) {
  try {
    // 1. הגנה על ה-API: בדיקת סשן
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - כניסה אסורה" }, { status: 401 });
    }

    const orgId = session.user.organizationId ?? "";
    const dev = isAdmin(session.user.email);
    const limit = dev ? UPLOADS_PER_MINUTE_PLATFORM : UPLOADS_PER_MINUTE;
    const rateKey = orgId ? `ai:org:${orgId}` : `ai:user:${session.user.id}`;
    const rl = await checkRateLimit(rateKey, limit, 60 * 60 * 1000); // limit per hour

    if (!rl.success) {
      return NextResponse.json(
        {
          error: `חרגת ממכסת השימוש המותרת לשעה זו. נסה שוב לאחר ${rl.resetAt.toLocaleTimeString()}.`,
          resetAt: rl.resetAt,
        },
        { status: 429 },
      );
    }

    // 2. קבלת הקובץ מהבקשה
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "לא נמצא קובץ" }, { status: 400 });
    }

    const persist = formData.get("persist") !== "false";

    // 3. הפעלת מנוע ה-AI של BSD-YBM
    const result = await processDocumentAction(
      formData,
      session.user.id,
      session.user.organizationId ?? "",
      persist,
    );

    if (!result.success) {
      const status = result.code === "QUOTA_EXCEEDED" ? 403 : 500;
      return NextResponse.json(
        {
          error: result.error ?? "אירעה שגיאה בפענוח המסמך",
          code: result.code,
          billingUrl: result.code === "QUOTA_EXCEEDED" ? "/dashboard/billing" : undefined,
        },
        { status },
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "שגיאה פנימית בשרת" }, { status: 500 });
  }
}
