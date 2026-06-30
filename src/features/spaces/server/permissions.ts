import { SpaceRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";

/**
 * Numeric ranking of space roles, used to compare privilege levels.
 * Higher numbers grant more access.
 */
export const ROLE_RANK: Record<SpaceRole, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

/**
 * Ensure the caller is a member of the given space.
 * Throws FORBIDDEN if they are not. Returns the membership.
 */
export async function requireMembership(
  db: import("@prisma/client").PrismaClient,
  spaceId: string,
  userId: string
): Promise<{ role: SpaceRole }> {
  const membership = await db.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId } },
  });
  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return membership;
}

/**
 * Ensure the caller is a member of the space with at least the `min` role.
 * Throws FORBIDDEN otherwise. Returns the membership.
 */
export async function requireRole(
  db: import("@prisma/client").PrismaClient,
  spaceId: string,
  userId: string,
  min: SpaceRole
): Promise<{ role: SpaceRole }> {
  const membership = await requireMembership(db, spaceId, userId);
  if (ROLE_RANK[membership.role] < ROLE_RANK[min]) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return membership;
}
