import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const calendarSectionRouter = createTRPCRouter({
  // List all sections for user with calendars
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.calendarSection.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        calendars: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { position: "asc" },
    });
  }),

  // Get single section
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const section = await ctx.db.calendarSection.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { calendars: true },
      });

      if (!section) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return section;
    }),

  // Create section
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        color: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get max position
      const maxPosition = await ctx.db.calendarSection.findFirst({
        where: { userId: ctx.session.user.id },
        orderBy: { position: "desc" },
        select: { position: true },
      });

      return ctx.db.calendarSection.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
          position: (maxPosition?.position ?? -1) + 1,
        },
      });
    }),

  // Update section
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        isExpanded: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const section = await ctx.db.calendarSection.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!section) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.calendarSection.update({
        where: { id },
        data,
      });
    }),

  // Delete section (moves calendars to unsectioned)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const section = await ctx.db.calendarSection.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!section) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Move calendars to unsectioned (set sectionId to null)
      await ctx.db.calendar.updateMany({
        where: { sectionId: input.id },
        data: { sectionId: null },
      });

      return ctx.db.calendarSection.delete({
        where: { id: input.id },
      });
    }),

  // Reorder sections
  reorder: protectedProcedure
    .input(
      z.object({
        sectionIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update positions based on array order
      await Promise.all(
        input.sectionIds.map((id, index) =>
          ctx.db.calendarSection.updateMany({
            where: { id, userId: ctx.session.user.id },
            data: { position: index },
          })
        )
      );

      return { success: true };
    }),

  // Move calendar to section
  moveCalendar: protectedProcedure
    .input(
      z.object({
        calendarId: z.string(),
        sectionId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const calendar = await ctx.db.calendar.findFirst({
        where: { id: input.calendarId, userId: ctx.session.user.id },
      });

      if (!calendar) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Calendar not found" });
      }

      // Verify section belongs to user if not null
      if (input.sectionId) {
        const section = await ctx.db.calendarSection.findFirst({
          where: { id: input.sectionId, userId: ctx.session.user.id },
        });

        if (!section) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Section not found" });
        }
      }

      return ctx.db.calendar.update({
        where: { id: input.calendarId },
        data: { sectionId: input.sectionId },
      });
    }),
});
