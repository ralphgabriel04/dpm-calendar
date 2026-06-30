import { NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/config";
import { dbAdmin } from "@/infrastructure/db/client";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST() {
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

    const bc = await dbAdmin.billingCustomer.findUnique({ where: { userId } });
    if (!bc) {
      return NextResponse.json({ error: "NO_CUSTOMER" }, { status: 404 });
    }

    const base = process.env.AUTH_URL ?? "http://localhost:3000";
    const portal = await stripe.billingPortal.sessions.create({
      customer: bc.stripeCustomerId,
      return_url: `${base}/billing`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error(
      "Billing portal failed:",
      error instanceof Error ? error.message : "unknown error"
    );
    return NextResponse.json({ error: "PORTAL_FAILED" }, { status: 500 });
  }
}
