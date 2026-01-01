import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const syncRouter = createTRPCRouter({
  // List calendar accounts
  listAccounts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.calendarAccount.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        calendars: true,
        _count: {
          select: { syncConflicts: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }),

  // Get sync conflicts
  getConflicts: protectedProcedure
    .input(z.object({ accountId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.syncConflict.findMany({
        where: {
          calendarAccount: {
            userId: ctx.session.user.id,
            ...(input.accountId ? { id: input.accountId } : {}),
          },
          resolution: null,
        },
        include: {
          calendarAccount: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Resolve conflict
  resolveConflict: protectedProcedure
    .input(
      z.object({
        conflictId: z.string(),
        resolution: z.enum(["USE_LOCAL", "USE_REMOTE", "MERGE", "SKIP"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conflict = await ctx.db.syncConflict.findFirst({
        where: {
          id: input.conflictId,
          calendarAccount: { userId: ctx.session.user.id },
        },
      });

      if (!conflict) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.syncConflict.update({
        where: { id: input.conflictId },
        data: {
          resolution: input.resolution,
          resolvedAt: new Date(),
        },
      });
    }),

  // Update account settings
  updateAccount: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean().optional(),
        isPrimary: z.boolean().optional(),
        syncDirection: z.enum(["PULL", "PUSH", "FULL"]).optional(),
        syncInterval: z.number().min(5).max(60).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const account = await ctx.db.calendarAccount.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // If setting as primary, unset other primary accounts
      if (data.isPrimary) {
        await ctx.db.calendarAccount.updateMany({
          where: { userId: ctx.session.user.id, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return ctx.db.calendarAccount.update({
        where: { id },
        data,
      });
    }),

  // Delete account
  deleteAccount: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.db.calendarAccount.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.calendarAccount.delete({
        where: { id: input.id },
      });
    }),

  // Get sync logs
  getLogs: protectedProcedure
    .input(
      z.object({
        accountId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const accounts = await ctx.db.calendarAccount.findMany({
        where: { userId: ctx.session.user.id },
        select: { id: true },
      });

      const accountIds = accounts.map((a) => a.id);

      return ctx.db.syncLog.findMany({
        where: {
          calendarAccountId: input.accountId
            ? input.accountId
            : { in: accountIds },
        },
        orderBy: { startedAt: "desc" },
        take: input.limit,
      });
    }),

  // Trigger manual sync
  triggerSync: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.db.calendarAccount.findFirst({
        where: { id: input.accountId, userId: ctx.session.user.id },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Create sync log entry
      const syncLog = await ctx.db.syncLog.create({
        data: {
          calendarAccountId: input.accountId,
          direction: account.syncDirection,
          status: "IN_PROGRESS",
        },
      });

      // In a real implementation, this would trigger an async sync job
      // For now, we'll just mark it as completed
      await ctx.db.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      await ctx.db.calendarAccount.update({
        where: { id: input.accountId },
        data: { lastSyncAt: new Date() },
      });

      return { success: true, syncLogId: syncLog.id };
    }),
});
