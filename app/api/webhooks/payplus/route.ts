import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** מבנה גמיש — PayPlus עשויים לעטוף את transaction בשכבות שונות */
function extractTransaction(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const tx = o.transaction;
  if (tx && typeof tx === "object") return tx as Record<string, unknown>;
  const data = o.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const inner = d.transaction;
    if (inner && typeof inner === "object") return inner as Record<string, unknown>;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const rawSecret = process.env.PAYPLUS_WEBHOOK_SECRET?.trim();
    if (rawSecret) {
      const token =
        req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
        req.headers.get("x-payplus-token");
      if (!token || token !== rawSecret) {
        console.warn("[PayPlus Webhook] סירוב — חתימה/טוקן לא תואם");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const data = await req.json();
    const transaction = extractTransaction(data);

    const transactionStatus =
      typeof transaction?.status_code === "string"
        ? transaction.status_code
        : typeof transaction?.status === "string"
          ? transaction.status
          : undefined;

    const rawMore =
      transaction?.more_info_1 ?? transaction?.more_info;
    const invoiceId =
      typeof rawMore === "string"
        ? rawMore
        : typeof rawMore === "number"
          ? String(rawMore)
          : undefined;

    const transactionUid =
      typeof transaction?.uid === "string"
        ? transaction.uid
        : transaction?.uid != null
          ? String(transaction.uid)
          : undefined;

    if (transactionStatus === "000" && invoiceId) {
      try {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: "PAID",
            paidAt: new Date(),
            ...(transactionUid
              ? { payplusTransactionId: transactionUid }
              : {}),
            lastWebhookPayload: data as object,
          },
        });
        console.log(
          `[PayPlus Webhook] Success! Invoice ${invoiceId} updated to PAID.`,
        );
      } catch (e) {
        const code =
          e && typeof e === "object" && "code" in e
            ? (e as { code?: string }).code
            : undefined;
        if (code === "P2025") {
          console.warn(
            `[PayPlus Webhook] חשבונית לא נמצאה: ${invoiceId} (ממשיכים עם 200)`,
          );
        } else {
          throw e;
        }
      }
    } else {
      console.log(
        `[PayPlus Webhook] Transaction declined or incomplete. Status: ${transactionStatus ?? "unknown"}`,
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[PayPlus Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
