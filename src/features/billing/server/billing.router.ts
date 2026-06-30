import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";
import { isStripeConfigured } from "@/lib/stripe";
import { getUserPlan } from "@/features/billing/server/gating";

/**
 * Billing read endpoints. The app stays fully usable on FREE when Stripe is
 * not configured — these endpoints report status truthfully and never fake a
 * paid plan. All access is scoped to the authenticated user.
 */
export const billingRouter = createTRPCRouter({
  // The caller's current plan and active/trialing subscription (if any).
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.session.user.id;

    const customer = await ctx.db.billingCustomer.findUnique({
      where: { userId: uid },
      include: {
        subscriptions: {
          where: { status: { in: ["ACTIVE", "TRIALING"] } },
        },
      },
    });

    const sub = customer?.subscriptions[0] ?? null;

    return {
      configured: isStripeConfigured(),
      plan: await getUserPlan(ctx.db, uid),
      subscription: sub
        ? {
            plan: sub.plan,
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          }
        : null,
    };
  }),

  // The plan catalogue with Stripe price IDs (null when not configured).
  getPlans: protectedProcedure.query(() => {
    return {
      configured: isStripeConfigured(),
      plans: [
        {
          plan: "FREE",
          priceId: null,
          name: "Gratuit",
          price: 0,
          features: [
            "Tâches, calendrier, habitudes, objectifs",
            "1 espace personnel",
            "Import ICS",
          ],
        },
        {
          plan: "PRO",
          priceId: process.env.STRIPE_PRICE_PRO ?? null,
          name: "Pro",
          price: 8,
          features: [
            "Tout le plan Gratuit",
            "Intégrations avancées",
            "Espaces partagés illimités",
          ],
        },
        {
          plan: "TEAM",
          priceId: process.env.STRIPE_PRICE_TEAM ?? null,
          name: "Équipe",
          price: 20,
          features: [
            "Tout le plan Pro",
            "Collaboration équipe",
            "Rôles & permissions avancés",
          ],
        },
      ],
    };
  }),
});
