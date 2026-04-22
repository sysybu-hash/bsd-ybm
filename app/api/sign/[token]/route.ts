import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonBadRequest, jsonNotFound } from "@/lib/api-json";

export async function POST(
  req: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const body = await req.json();
  const signatureBase64 = body.signatureBase64 as string | undefined;

  if (!signatureBase64 || typeof signatureBase64 !== "string") {
    return jsonBadRequest("חסרה חתימה", "missing_signature");
  }

  const quote = await prisma.quote.findUnique({
    where: { token },
    include: { contact: true },
  });

  if (!quote) {
    return jsonNotFound("הצעה לא נמצאה");
  }

  if (quote.status === "CLOSED_WON") {
    return NextResponse.json({ ok: true, message: "כבר אושר" });
  }

  await prisma.$transaction([
    prisma.quote.update({
      where: { token },
      data: {
        signatureBase64,
        status: "CLOSED_WON",
      },
    }),
    prisma.contact.update({
      where: { id: quote.contactId },
      data: { status: "CLOSED_WON" },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
