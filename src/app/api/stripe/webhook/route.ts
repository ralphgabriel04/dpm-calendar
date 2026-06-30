import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { dbAdmin } from "@/infrastructure/db/client";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

type Plan = "PRO" | "TEAM";
type SubscriptionStatus =
  | "ACTIVE"
  | "TRIALING"
  | "PAST_DUE"
  | "CANCELED"
  | "INCOMPLETE"
  | "UNPAID";

function planForPrice(priceId: string | undefined): Plan {
  return priceId && priceId === process.env.STRIPE_PRICE_TEAM ? "TEAM" : "PRO";
}

/**
 * Map a Stripe subscription status to our SubscriptionStatus enum. When the
 * event is `customer.subscription.deleted` the subscription is canceled
 * regardless of the carried status, so callers force CANCELED for that case.
 */
function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
    case "paused":
      return "CANCELED";
    case "unpaid":
      return "UNPAID";
    case "incomplete":
      return "INCOMPLETE";
    default:
      return "INCOMPLETE";
  }
}

/**
 * Upsert a Subscription row from a Stripe.Subscription. In Stripe API v22+,
 * `current_period_end` lives on the subscription item, not the subscription.
 */
async function upsertSubscription(sub: Stripe.Subscription, forceCanceled: boolean) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const bc = await dbAdmin.billingCustomer.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!bc) return;

  const firstItem = sub.items.data[0];
  const priceId = firstItem?.price.id ?? "";
  const plan = planForPrice(priceId);
  const status: SubscriptionStatus = forceCanceled ? "CANCELED" : mapStatus(sub.status);

  const periodEndSeconds = firstItem?.current_period_end;
  const currentPeriodEnd =
    typeof periodEndSeconds === "number" ? new Date(periodEndSeconds * 1000) : null;

  await dbAdmin.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    create: {
      billingCustomerId: bc.id,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      plan,
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
    update: {
      stripePriceId: priceId,
      plan,
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json(
      { error: "BILLING_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig!, secret);
  } catch {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  // Idempotency: skip events we've already recorded, then record this one.
  const seen = await dbAdmin.stripeWebhookEvent.findUnique({
    where: { id: event.id },
  });
  if (seen) {
    return NextResponse.json({ received: true });
  }
  await dbAdmin.stripeWebhookEvent.create({
    data: { id: event.id, type: event.type },
  });

  // Handler errors must not bubble: returning non-2xx makes Stripe retry the
  // same (now-recorded, so idempotently skipped) event indefinitely.
  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(sub, event.type === "customer.subscription.deleted");
        break;
      }
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const subRef = checkoutSession.subscription;
        const subId = typeof subRef === "string" ? subRef : subRef?.id;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubscription(sub, false);
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error(
      "Stripe webhook handler error:",
      event.type,
      error instanceof Error ? error.message : "unknown error"
    );
  }

  return NextResponse.json({ received: true });
}
