import { z } from "zod";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";
import { TRPCError } from "@trpc/server";

export const calendarRouter = createTRPCRouter({
  // List all calendars for user (creates default if none exist)
  list: protectedProcedure.query(async ({ ctx }) => {
    let calendars = await ctx.db.calendar.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    // Create default calendar if user has none
    if (calendars.length === 0) {
      const defaultCalendar = await ctx.db.calendar.create({
        data: {
          userId: ctx.session.user.id,
          name: "Mon Calendrier",
          color: "#3b82f6",
          isDefault: true,
          provider: "LOCAL",
        },
      });
      calendars = [defaultCalendar];
    }

    return calendars;
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
        sectionId: z.string().optional(),
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

      // Verify section belongs to user if provided
      if (input.sectionId) {
        const section = await ctx.db.calendarSection.findFirst({
          where: { id: input.sectionId, userId: ctx.session.user.id },
        });
        if (!section) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Section not found" });
        }
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
