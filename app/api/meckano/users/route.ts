import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasMeckanoAccess } from "@/lib/meckano-access";

const DEFAULT_MECKANO_USERS_URL = "https://app.meckano.co.il/rest/users";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMeckanoAccess(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const apiKey = process.env.MECKANO_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "חסר MECKANO_API_KEY בשרת — הוסף ל-.env.local / Vercel (לא לשמור מפתח בקוד מקור).",
        },
        { status: 503 },
      );
    }

    const url =
      process.env.MECKANO_USERS_URL?.trim() || DEFAULT_MECKANO_USERS_URL;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        key: apiKey,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = (await response.json().catch(() => null)) as {
      status?: boolean;
      data?: unknown;
    } | null;

    if (!response.ok) {
      console.error("Meckano HTTP:", response.status, data);
      return NextResponse.json(
        { error: "Meckano API request failed", status: response.status },
        { status: 502 },
      );
    }

    // לפי תיעוד מקאנו: status אמיתי כשהבקשה הצליחה
    if (!data || !data.status) {
      console.error("Meckano API:", data);
      return NextResponse.json(
        { error: "Meckano API returned an error" },
        { status: 502 },
      );
    }

    return NextResponse.json(data.data);
  } catch (error) {
    console.error("Meckano API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Meckano" },
      { status: 500 },
    );
  }
}
