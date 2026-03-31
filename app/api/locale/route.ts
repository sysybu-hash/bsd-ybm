import { NextResponse } from "next/server";
import { COOKIE_LOCALE, normalizeLocale } from "@/lib/i18n/config";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { locale?: string };
    const loc = normalizeLocale(body.locale);
    const res = NextResponse.json({ ok: true, locale: loc });
    res.cookies.set(COOKIE_LOCALE, loc, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
