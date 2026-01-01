import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const eventCreateSchema = z.object({
  calendarId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  isAllDay: z.boolean().default(false),
  timezone: z.string().default("UTC"),
  rrule: z.string().optional(),
  color: z.string().optional(),
  reminderMinutes: z.array(z.number()).default([15]),
});

const eventUpdateSchema = eventCreateSchema.partial().extend({
  id: z.string(),
});

const eventQuerySchema = z.object({
  calendarIds: z.array(z.string()).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const eventRouter = createTRPCRouter({
  // Get events for date range
  list: protectedProcedure
    .input(eventQuerySchema)
    .query(async ({ ctx, input }) => {
      const { calendarIds, startDate, endDate } = input;

      // Get user's visible calendars if not specified
      const calendars = calendarIds
        ? await ctx.db.calendar.findMany({
            where: { id: { in: calendarIds }, userId: ctx.session.user.id },
          })
        : await ctx.db.calendar.findMany({
            where: { userId: ctx.session.user.id, isVisible: true },
          });

      const calIds = calendars.map((c) => c.id);

      if (calIds.length === 0) {
        return [];
      }

      // Fetch events in range
      const events = await ctx.db.event.findMany({
        where: {
          calendarId: { in: calIds },
          status: { not: "CANCELLED" },
          OR: [
            // Non-recurring events in range
            {
              parentEventId: null,
              rrule: null,
              startAt: { lte: endDate },
              endAt: { gte: startDate },
            },
            // Recurring parent events
            {
              rrule: { not: null },
              parentEventId: null,
            },
            // Recurring instances in range
            {
              parentEventId: { not: null },
              startAt: { lte: endDate },
              endAt: { gte: startDate },
            },
          ],
        },
        include: {
          calendar: { select: { color: true, name: true } },
        },
        orderBy: { startAt: "asc" },
      });

      return events;
    }),

  // Get single event
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.event.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          calendar: true,
          tasks: true,
          parentEvent: true,
        },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return event;
    }),

  // Create event
  create: protectedProcedure
    .input(eventCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate calendar ownership
      const calendar = await ctx.db.calendar.findFirst({
        where: { id: input.calendarId, userId: ctx.session.user.id },
      });

      if (!calendar) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Calendar not found" });
      }

      // Calculate duration in minutes
      const duration = Math.round(
        (input.endAt.getTime() - input.startAt.getTime()) / 60000
      );

      const event = await ctx.db.event.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
          duration,
          provider: calendar.provider,
          syncStatus: calendar.provider === "LOCAL" ? "SYNCED" : "PENDING_PUSH",
        },
      });

      return event;
    }),

  // Update event
  update: protectedProcedure
    .input(eventUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.db.event.findFirst({
        where: { id, userId: ctx.session.user.id },
        include: { calendar: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Recalculate duration if times changed
      let duration = existing.duration;
      if (data.startAt || data.endAt) {
        const startAt = data.startAt || existing.startAt;
        const endAt = data.endAt || existing.endAt;
        duration = Math.round((endAt.getTime() - startAt.getTime()) / 60000);
      }

      const event = await ctx.db.event.update({
        where: { id },
        data: {
          ...data,
          duration,
          syncStatus:
            existing.calendar.provider === "LOCAL" ? "SYNCED" : "PENDING_PUSH",
          updatedAt: new Date(),
        },
      });

      return event;
    }),

  // Delete event
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        deleteType: z.enum(["single", "this_and_future", "all"]).default("single"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { calendar: true },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Soft delete by setting status to CANCELLED
      await ctx.db.event.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          syncStatus:
            event.calendar.provider === "LOCAL" ? "SYNCED" : "PENDING_PUSH",
        },
      });

      return { success: true };
    }),

  // Move event (drag & drop)
  move: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        startAt: z.coerce.date(),
        endAt: z.coerce.date(),
        calendarId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, startAt, endAt, calendarId } = input;

      const event = await ctx.db.event.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const duration = Math.round((endAt.getTime() - startAt.getTime()) / 60000);

      return ctx.db.event.update({
        where: { id },
        data: {
          startAt,
          endAt,
          duration,
          ...(calendarId && { calendarId }),
          syncStatus: "PENDING_PUSH",
        },
      });
    }),
});
