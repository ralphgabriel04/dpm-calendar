import { z } from "zod";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";
import { TRPCError } from "@trpc/server";
import { addDays, startOfDay, differenceInMinutes } from "date-fns";

const WEEKLY_MEETING_THRESHOLD_HOURS = 15;
const BACK_TO_BACK_GAP_MINUTES = 15;
const BUFFER_DURATION_MINUTES = 30;

export const meetingLoadRouter = createTRPCRouter({
  // Compute meeting hours for next 7 days
  weeklyMeetingLoad: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const now = new Date();
    const start = startOfDay(now);
    const end = addDays(start, 7);

    const events = await ctx.db.event.findMany({
      where: {
        userId,
        status: { not: "CANCELLED" },
        startAt: { gte: start, lt: end },
      },
      include: { attendees: true },
      orderBy: { startAt: "asc" },
    });

    // Treat events with >= 1 attendee or duration > 0 as meetings.
    // Exclude all-day events.
    const meetings = events.filter(
      (e) => !e.isAllDay && (e.attendees.length > 0 || e.duration > 0)
    );

    const totalMinutes = meetings.reduce((sum, e) => sum + (e.duration || 0), 0);
    const totalHours = totalMinutes / 60;

    // Breakdown by day
    const byDay: { date: string; hours: number; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = addDays(start, i);
      const dayEnd = addDays(dayStart, 1);
      const dayMeetings = meetings.filter(
        (m) => m.startAt >= dayStart && m.startAt < dayEnd
      );
      const mins = dayMeetings.reduce((s, m) => s + (m.duration || 0), 0);
      byDay.push({
        date: dayStart.toISOString().slice(0, 10),
        hours: Math.round((mins / 60) * 10) / 10,
        count: dayMeetings.length,
      });
    }

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      totalMinutes,
      meetingCount: meetings.length,
      threshold: WEEKLY_MEETING_THRESHOLD_HOURS,
      isOverThreshold: totalHours > WEEKLY_MEETING_THRESHOLD_HOURS,
      byDay,
    };
  }),

  // Find back-to-back meeting pairs with gap < 15 min; suggest 30-min buffers.
  backToBackBuffers: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const now = new Date();
    const start = startOfDay(now);
    const end = addDays(start, 7);

    const events = await ctx.db.event.findMany({
      where: {
        userId,
        status: { not: "CANCELLED" },
        startAt: { gte: start, lt: end },
      },
      include: { attendees: true },
      orderBy: { startAt: "asc" },
    });

    const meetings = events.filter(
      (e) => !e.isAllDay && (e.attendees.length > 0 || e.duration > 0)
    );

    const pairs: {
      firstEventId: string;
      secondEventId: string;
      firstTitle: string;
      secondTitle: string;
      firstEndAt: Date;
      secondStartAt: Date;
      gapMinutes: number;
      suggestedBufferStart: Date;
      suggestedBufferEnd: Date;
      calendarId: string;
    }[] = [];

    for (let i = 0; i < meetings.length - 1; i++) {
      const a = meetings[i];
      const b = meetings[i + 1];
      // Same day only
      if (a.endAt.toDateString() !== b.startAt.toDateString()) continue;
      const gap = differenceInMinutes(b.startAt, a.endAt);
      if (gap < BACK_TO_BACK_GAP_MINUTES && gap >= 0) {
        // Suggest buffer BEFORE the second meeting: shift forward from a.endAt
        const bufferStart = a.endAt;
        const bufferEnd = new Date(
          bufferStart.getTime() + BUFFER_DURATION_MINUTES * 60_000
        );
        pairs.push({
          firstEventId: a.id,
          secondEventId: b.id,
          firstTitle: a.title,
          secondTitle: b.title,
          firstEndAt: a.endAt,
          secondStartAt: b.startAt,
          gapMinutes: gap,
          suggestedBufferStart: bufferStart,
          suggestedBufferEnd: bufferEnd,
          calendarId: a.calendarId,
        });
      }
    }

    return { pairs, bufferDurationMinutes: BUFFER_DURATION_MINUTES };
  }),

  // Insert a buffer event (local only) before a meeting
  insertBuffer: protectedProcedure
    .input(
      z.object({
        calendarId: z.string(),
        startAt: z.coerce.date(),
        endAt: z.coerce.date(),
        title: z.string().default("Buffer"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const calendar = await ctx.db.calendar.findFirst({
        where: { id: input.calendarId, userId: ctx.session.user.id },
      });
      if (!calendar) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Calendar not found" });
      }
      const duration = Math.round(
        (input.endAt.getTime() - input.startAt.getTime()) / 60000
      );
      return ctx.db.event.create({
        data: {
          userId: ctx.session.user.id,
          calendarId: input.calendarId,
          title: input.title,
          startAt: input.startAt,
          endAt: input.endAt,
          duration,
          provider: "LOCAL",
        },
      });
    }),

  // Insert buffers for all back-to-back pairs at once
  insertAllBuffers: protectedProcedure
    .input(
      z.object({
        pairs: z.array(
          z.object({
            calendarId: z.string(),
            suggestedBufferStart: z.coerce.date(),
            suggestedBufferEnd: z.coerce.date(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const created = [];
      for (const pair of input.pairs) {
        const calendar = await ctx.db.calendar.findFirst({
          where: { id: pair.calendarId, userId },
        });
        if (!calendar) continue;
        const duration = Math.round(
          (pair.suggestedBufferEnd.getTime() -
            pair.suggestedBufferStart.getTime()) /
            60000
        );
        const event = await ctx.db.event.create({
          data: {
            userId,
            calendarId: pair.calendarId,
            title: "Buffer",
            startAt: pair.suggestedBufferStart,
            endAt: pair.suggestedBufferEnd,
            duration,
            provider: "LOCAL",
          },
        });
        created.push(event);
      }
      return { createdCount: created.length };
    }),
});
