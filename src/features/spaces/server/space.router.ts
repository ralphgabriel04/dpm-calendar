import { z } from "zod";
import { SpaceRole } from "@prisma/client";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";
import { TRPCError } from "@trpc/server";
import { dbAdmin } from "@/infrastructure/db/client";
import { requireMembership, requireRole } from "./permissions";
import { sendSpaceInvite } from "@/features/spaces/lib/sendInvite";

/**
 * Build a URL-safe slug from a name plus a random 6-char suffix to keep slugs
 * unique. Uses crypto.randomUUID (never Math.random).
 */
function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const random6 = crypto.randomUUID().slice(0, 6);
  return `${base}-${random6}`;
}

export const spacesRouter = createTRPCRouter({
  // Spaces the caller is a member of, with their role and member count.
  list: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.session.user.id;
    const memberships = await ctx.db.spaceMember.findMany({
      where: { userId: uid },
      include: {
        space: { include: { _count: { select: { members: true } } } },
      },
    });
    return memberships.map((m) => ({
      ...m.space,
      role: m.role,
      memberCount: m.space._count.members,
    }));
  }),

  // Single space with members and the caller's own role.
  get: protectedProcedure
    .input(z.object({ spaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      const membership = await requireMembership(ctx.db, input.spaceId, uid);
      const space = await ctx.db.space.findUnique({
        where: { id: input.spaceId },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
        },
      });
      if (!space) throw new TRPCError({ code: "NOT_FOUND" });
      return { ...space, myRole: membership.role };
    }),

  // Create a new (non-personal) space and make the caller its OWNER.
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      return ctx.db.$transaction(async (tx) => {
        const space = await tx.space.create({
          data: {
            name: input.name,
            slug: slugify(input.name),
            ownerId: uid,
            isPersonal: false,
          },
        });
        await tx.spaceMember.create({
          data: { spaceId: space.id, userId: uid, role: "OWNER" },
        });
        return space;
      });
    }),

  // Rename a space (ADMIN+).
  update: protectedProcedure
    .input(z.object({ spaceId: z.string(), name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      await requireRole(ctx.db, input.spaceId, uid, "ADMIN");
      return ctx.db.space.update({
        where: { id: input.spaceId },
        data: { name: input.name },
      });
    }),

  // Delete a space (OWNER only).
  delete: protectedProcedure
    .input(z.object({ spaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      await requireRole(ctx.db, input.spaceId, uid, "OWNER");
      return ctx.db.space.delete({ where: { id: input.spaceId } });
    }),

  // List members of a space (any member).
  members: protectedProcedure
    .input(z.object({ spaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      await requireMembership(ctx.db, input.spaceId, uid);
      return ctx.db.spaceMember.findMany({
        where: { spaceId: input.spaceId },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  // Invite someone to the space by email (ADMIN+). Email failures never fail
  // the mutation.
  invite: protectedProcedure
    .input(
      z.object({
        spaceId: z.string(),
        email: z.string().email(),
        role: z.nativeEnum(SpaceRole).default("MEMBER"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      await requireRole(ctx.db, input.spaceId, uid, "ADMIN");
      if (input.role === "OWNER") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot invite as OWNER",
        });
      }

      const invite = await ctx.db.spaceInvite.create({
        data: {
          spaceId: input.spaceId,
          email: input.email,
          role: input.role,
          invitedById: uid,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        },
      });

      const space = await ctx.db.space.findUnique({
        where: { id: input.spaceId },
        select: { name: true },
      });

      const inviteUrl = `${process.env.AUTH_URL ?? ""}/invite/${invite.token}`;
      let emailSent = false;
      try {
        const result = await sendSpaceInvite({
          to: input.email,
          inviteUrl,
          spaceName: space?.name ?? "",
        });
        emailSent = result.sent;
      } catch {
        emailSent = false;
      }

      return { invite, inviteUrl, emailSent };
    }),

  // Pending invites for a space (ADMIN+).
  listInvites: protectedProcedure
    .input(z.object({ spaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      await requireRole(ctx.db, input.spaceId, uid, "ADMIN");
      return ctx.db.spaceInvite.findMany({
        where: { spaceId: input.spaceId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Revoke a pending invite (ADMIN+).
  revokeInvite: protectedProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      const invite = await ctx.db.spaceInvite.findUnique({
        where: { id: input.inviteId },
      });
      if (!invite) throw new TRPCError({ code: "NOT_FOUND" });
      await requireRole(ctx.db, invite.spaceId, uid, "ADMIN");
      return ctx.db.spaceInvite.update({
        where: { id: input.inviteId },
        data: { status: "REVOKED" },
      });
    }),

  // Change a member's role (ADMIN+). Owners cannot be set or demoted here.
  updateRole: protectedProcedure
    .input(
      z.object({
        spaceId: z.string(),
        userId: z.string(),
        role: z.nativeEnum(SpaceRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      await requireRole(ctx.db, input.spaceId, uid, "ADMIN");

      const target = await ctx.db.spaceMember.findUnique({
        where: {
          spaceId_userId: { spaceId: input.spaceId, userId: input.userId },
        },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      if (target.role === "OWNER" || input.role === "OWNER") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot set or alter an OWNER role",
        });
      }

      return ctx.db.spaceMember.update({
        where: {
          spaceId_userId: { spaceId: input.spaceId, userId: input.userId },
        },
        data: { role: input.role },
      });
    }),

  // Remove a member (ADMIN+). The OWNER cannot be removed.
  removeMember: protectedProcedure
    .input(z.object({ spaceId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      await requireRole(ctx.db, input.spaceId, uid, "ADMIN");

      const target = await ctx.db.spaceMember.findUnique({
        where: {
          spaceId_userId: { spaceId: input.spaceId, userId: input.userId },
        },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });
      if (target.role === "OWNER") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot remove the OWNER",
        });
      }

      return ctx.db.spaceMember.delete({
        where: {
          spaceId_userId: { spaceId: input.spaceId, userId: input.userId },
        },
      });
    }),

  // Leave a space. The OWNER cannot leave.
  leave: protectedProcedure
    .input(z.object({ spaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      const membership = await requireMembership(ctx.db, input.spaceId, uid);
      if (membership.role === "OWNER") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Owner cannot leave; delete or transfer the space",
        });
      }
      return ctx.db.spaceMember.delete({
        where: { spaceId_userId: { spaceId: input.spaceId, userId: uid } },
      });
    }),

  // Accept an invite. Read with dbAdmin because the invitee is not yet a member
  // and would be hidden by RLS.
  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      const invite = await dbAdmin.spaceInvite.findUnique({
        where: { token: input.token },
      });
      if (!invite) throw new TRPCError({ code: "NOT_FOUND" });
      if (invite.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invite is not pending",
        });
      }
      if (invite.expiresAt <= new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invite expired" });
      }
      if (
        invite.email.toLowerCase() !==
        ctx.session.user.email?.toLowerCase()
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invite is for a different email",
        });
      }

      await dbAdmin.$transaction(async (tx) => {
        const existing = await tx.spaceMember.findUnique({
          where: {
            spaceId_userId: { spaceId: invite.spaceId, userId: uid },
          },
        });
        if (!existing) {
          await tx.spaceMember.create({
            data: { spaceId: invite.spaceId, userId: uid, role: invite.role },
          });
        }
        await tx.spaceInvite.update({
          where: { id: invite.id },
          data: { status: "ACCEPTED", acceptedAt: new Date() },
        });
      });

      return { spaceId: invite.spaceId };
    }),
});
