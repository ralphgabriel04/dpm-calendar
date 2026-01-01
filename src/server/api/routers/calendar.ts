import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const calendarRouter = createTRPCRouter({
  // List all calendars for user
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.calendar.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
  }),

  // Get single calendar
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const calendar = await ctx.db.calendar.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!calendar) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return calendar;
    }),

  // Create calendar
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        color: z.string().default("#3B82F6"),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // If this is set as default, unset other defaults
      if (input.isDefault) {
        await ctx.db.calendar.updateMany({
          where: { userId: ctx.session.user.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      return ctx.db.calendar.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
          provider: "LOCAL",
        },
      });
    }),

  // Update calendar
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        color: z.string().optional(),
        isVisible: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const calendar = await ctx.db.calendar.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!calendar) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await ctx.db.calendar.updateMany({
          where: { userId: ctx.session.user.id, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return ctx.db.calendar.update({
        where: { id },
        data,
      });
    }),

  // Delete calendar
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const calendar = await ctx.db.calendar.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!calendar) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (calendar.isDefault) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete the default calendar",
        });
      }

      return ctx.db.calendar.delete({
        where: { id: input.id },
      });
    }),

  // Toggle visibility
  toggleVisibility: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const calendar = await ctx.db.calendar.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!calendar) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.calendar.update({
        where: { id: input.id },
        data: { isVisible: !calendar.isVisible },
      });
    }),
});
