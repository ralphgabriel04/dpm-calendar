import Stripe from "stripe";

/**
 * Whether Stripe is configured. When false the app stays fully usable on the
 * FREE plan and billing endpoints return "configuration required" — never a
 * fake success.
 */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Lazily build the server-side Stripe client. Returns null when
 * STRIPE_SECRET_KEY is absent. The secret key is server-only and never shipped
 * to the client.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}
