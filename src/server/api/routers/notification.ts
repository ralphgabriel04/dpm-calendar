import { z } from "zod";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";
import { TRPCError } from "@trpc/server";

export const notificationRouter = createTRPCRouter({
  // List notifications
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "SENT", "READ", "DISMISSED", "FAILED"]).optional(),
        unreadOnly: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.notification.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.status ? { status: input.status } : {}),
          ...(input.unreadOnly ? { readAt: null, status: { not: "DISMISSED" } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  // Get unread count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.count({
      where: {
        userId: ctx.session.user.id,
        readAt: null,
        status: { notIn: ["DISMISSED", "FAILED"] },
      },
    });
  }),

  // Mark as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!notification) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.notification.update({
        where: { id: input.id },
        data: {
          readAt: new Date(),
          status: "READ",
        },
      });
    }),

  // Mark all as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.db.notification.updateMany({
      where: {
        userId: ctx.session.user.id,
        readAt: null,
      },
      data: {
        readAt: new Date(),
        status: "READ",
      },
    });
  }),

  // Dismiss notification
  dismiss: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!notification) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.notification.update({
        where: { id: input.id },
        data: { status: "DISMISSED" },
      });
    }),

  // Get preferences
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    let prefs = await ctx.db.notificationPreference.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!prefs) {
      prefs = await ctx.db.notificationPreference.create({
        data: { userId: ctx.session.user.id },
      });
    }

    return prefs;
  }),

  // Update preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        enablePush: z.boolean().optional(),
        enableEmail: z.boolean().optional(),
        quietHoursStart: z.string().optional(),
        quietHoursEnd: z.string().optional(),
        typeSettings: z.record(z.string(), z.boolean()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.notificationPreference.upsert({
        where: { userId: ctx.session.user.id },
        update: input,
        create: {
          userId: ctx.session.user.id,
          ...input,
        },
      });
    }),

  // Create notification (internal use)
  create: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          "EVENT_REMINDER",
          "TASK_DUE",
          "HABIT_REMINDER",
          "BREAK_REMINDER",
          "DAILY_RECAP",
          "SUGGESTION",
          "SYNC_ERROR",
          "SYSTEM",
        ]),
        title: z.string(),
        body: z.string().optional(),
        data: z.record(z.string(), z.unknown()).optional(),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
        scheduledFor: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, ...rest } = input;
      return ctx.db.notification.create({
        data: {
          userId: ctx.session.user.id,
          ...rest,
          data: data as object | undefined,
        },
      });
    }),
});
