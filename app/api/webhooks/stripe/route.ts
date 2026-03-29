import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!stripe) {
    return new NextResponse("Stripe לא מוגדר", { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new NextResponse("STRIPE_WEBHOOK_SECRET חסר", { status: 503 });
  }

  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");
  if (!signature) {
    return new NextResponse("חסר Stripe-Signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "שגיאה לא ידועה";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.organizationId;
      if (!orgId) {
        console.warn("checkout.session.completed ללא organizationId במטא-דאטה");
        return new NextResponse(null, { status: 200 });
      }

      const subRef = session.subscription;
      const subscriptionId =
        typeof subRef === "string"
          ? subRef
          : subRef && typeof subRef === "object" && "id" in subRef
            ? (subRef as Stripe.Subscription).id
            : null;

      await prisma.organization.update({
        where: { id: orgId },
        data: {
          plan: "PRO",
          subscriptionStatus: "ACTIVE",
          creditsRemaining: { increment: 100 },
          ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
        },
      });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.organization.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          plan: "FREE",
          subscriptionStatus: "CANCELED",
          creditsRemaining: 0,
          stripeSubscriptionId: null,
        },
      });
    }
  } catch (e) {
    console.error("Stripe webhook handler:", e);
    return new NextResponse("עדכון DB נכשל", { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
