import { stripe } from "@/lib/stripe";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe לא מוגדר (חסר STRIPE_SECRET_KEY)" },
      { status: 503 },
    );
  }

  let body: { priceId?: string; orgId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const { priceId, orgId } = body;
  if (!priceId) {
    return NextResponse.json({ error: "חסר priceId" }, { status: 400 });
  }
  if (!orgId || orgId !== session.user.organizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const baseUrl =
    process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard/success`,
    cancel_url: `${baseUrl}/dashboard/billing`,
    metadata: { organizationId: orgId },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
