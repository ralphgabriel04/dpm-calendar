import { Plan } from "@prisma/client";
import { TRPCError } from "@trpc/server";

/**
 * Plan ordering used for gating. A user with a higher-ranked plan satisfies
 * any requirement at or below that rank.
 */
export const PLAN_RANK: Record<Plan, number> = {
  FREE: 0,
  PRO: 1,
  TEAM: 2,
};

/**
 * Resolve the effective plan for a user from their active/trialing
 * subscriptions. Falls back to FREE when there is no billing customer or no
 * qualifying subscription.
 */
export async function getUserPlan(
  db: import("@prisma/client").PrismaClient,
  userId: string
): Promise<Plan> {
  const customer = await db.billingCustomer.findUnique({
    where: { userId },
    include: {
      subscriptions: {
        where: { status: { in: ["ACTIVE", "TRIALING"] } },
      },
    },
  });

  if (!customer || customer.subscriptions.length === 0) return "FREE";

  return customer.subscriptions.reduce<Plan>((best, sub) => {
    return PLAN_RANK[sub.plan] > PLAN_RANK[best] ? sub.plan : best;
  }, "FREE");
}

/**
 * Ensure the user is on at least `min`. Throws FORBIDDEN/UPGRADE_REQUIRED
 * otherwise. Returns the user's actual plan on success.
 */
export async function requirePlan(
  db: import("@prisma/client").PrismaClient,
  userId: string,
  min: Plan
): Promise<Plan> {
  const plan = await getUserPlan(db, userId);
  if (PLAN_RANK[plan] < PLAN_RANK[min]) {
    throw new TRPCError({ code: "FORBIDDEN", message: "UPGRADE_REQUIRED" });
  }
  return plan;
}
