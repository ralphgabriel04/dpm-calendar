import { NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/config";
import { dbAdmin } from "@/infrastructure/db/client";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const userId = session.user.id;

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "BILLING_NOT_CONFIGURED" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const plan = body.plan as "PRO" | "TEAM";
    const priceId =
      plan === "TEAM"
        ? process.env.STRIPE_PRICE_TEAM
        : process.env.STRIPE_PRICE_PRO;
    if (!priceId) {
      return NextResponse.json(
        { error: "BILLING_NOT_CONFIGURED" },
        { status: 503 }
      );
    }

    // Find or create the Stripe customer for this user.
    let bc = await dbAdmin.billingCustomer.findUnique({ where: { userId } });
    if (!bc) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        metadata: { userId },
      });
      bc = await dbAdmin.billingCustomer.create({
        data: { userId, stripeCustomerId: customer.id },
      });
    }

    const base = process.env.AUTH_URL ?? "http://localhost:3000";
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: bc.stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/billing?success=1`,
      cancel_url: `${base}/billing?canceled=1`,
      metadata: { userId },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error(
      "Checkout failed:",
      error instanceof Error ? error.message : "unknown error"
    );
    return NextResponse.json({ error: "CHECKOUT_FAILED" }, { status: 500 });
  }
}
