import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  startOfDay,
  endOfDay,
  addDays,
  addMinutes,
  setHours,
  setMinutes,
  isBefore,
  isAfter,
  differenceInMinutes,
  format,
  getDay,
} from "date-fns";
import { fr } from "date-fns/locale";

interface TimeSlot {
  startAt: Date;
  endAt: Date;
  score: number;
  reason: string;
}

interface DaySchedule {
  start: number; // hour
  end: number;
  isWorkday: boolean;
}

// Default work schedule
const DEFAULT_SCHEDULE: Record<number, DaySchedule> = {
  0: { start: 10, end: 18, isWorkday: false }, // Sunday
  1: { start: 9, end: 18, isWorkday: true },   // Monday
  2: { start: 9, end: 18, isWorkday: true },   // Tuesday
  3: { start: 9, end: 18, isWorkday: true },   // Wednesday
  4: { start: 9, end: 18, isWorkday: true },   // Thursday
  5: { start: 9, end: 18, isWorkday: true },   // Friday
  6: { start: 10, end: 18, isWorkday: false }, // Saturday
};

export const suggestionRouter = createTRPCRouter({
  // Get optimal time slots for a new event/task
  getOptimalSlots: protectedProcedure
    .input(
      z.object({
        duration: z.number().min(15).max(480), // in minutes
        preferredDate: z.coerce.date().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
        type: z.enum(["event", "task", "focus"]).default("event"),
        searchDays: z.number().min(1).max(14).default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      const { duration, preferredDate, priority, type, searchDays } = input;
      const userId = ctx.session.user.id;
      const now = new Date();
      const startDate = preferredDate || now;
      const endDate = addDays(startDate, searchDays);

      // Get user preferences for work hours
      const userPrefs = await ctx.db.userPreferences.findUnique({
        where: { userId },
      });

      const workStart = userPrefs?.workingHoursStart
        ? parseInt(userPrefs.workingHoursStart.split(":")[0], 10)
        : 9;
      const workEnd = userPrefs?.workingHoursEnd
        ? parseInt(userPrefs.workingHoursEnd.split(":")[0], 10)
        : 18;

      // Fetch existing events in the date range
      const events = await ctx.db.event.findMany({
        where: {
          userId,
          status: { not: "CANCELLED" },
          startAt: { gte: startOfDay(startDate), lte: endOfDay(endDate) },
        },
        orderBy: { startAt: "asc" },
      });

      // Fetch time blocks (scheduled tasks)
      const timeBlocks = await ctx.db.timeBlock.findMany({
        where: {
          task: { userId },
          status: { not: "CANCELLED" },
          startAt: { gte: startOfDay(startDate), lte: endOfDay(endDate) },
        },
        orderBy: { startAt: "asc" },
      });

      // Combine all busy times
      const busyTimes = [
        ...events.map((e) => ({ start: e.startAt, end: e.endAt })),
        ...timeBlocks.map((tb) => ({ start: tb.startAt, end: tb.endAt })),
      ].sort((a, b) => a.start.getTime() - b.start.getTime());

      // Find available slots
      const availableSlots: TimeSlot[] = [];
      let currentDate = startOfDay(startDate);

      while (isBefore(currentDate, endDate) && availableSlots.length < 10) {
        const dayOfWeek = getDay(currentDate);
        const schedule = DEFAULT_SCHEDULE[dayOfWeek];

        // Skip non-workdays for work-related items
        if (type !== "event" && !schedule.isWorkday) {
          currentDate = addDays(currentDate, 1);
          continue;
        }

        const dayStart = setMinutes(setHours(currentDate, workStart), 0);
        const dayEnd = setMinutes(setHours(currentDate, workEnd), 0);

        // Get busy times for this day
        const dayBusyTimes = busyTimes.filter(
          (bt) =>
            bt.start >= startOfDay(currentDate) && bt.start < endOfDay(currentDate)
        );

        // Find gaps
        let slotStart = isBefore(dayStart, now) ? now : dayStart;
        // Round up to next 15-minute mark
        const mins = slotStart.getMinutes();
        if (mins % 15 !== 0) {
          slotStart = addMinutes(slotStart, 15 - (mins % 15));
        }

        for (const busy of dayBusyTimes) {
          if (isAfter(slotStart, busy.start)) {
            slotStart = busy.end;
            const newMins = slotStart.getMinutes();
            if (newMins % 15 !== 0) {
              slotStart = addMinutes(slotStart, 15 - (newMins % 15));
            }
            continue;
          }

          const gapMinutes = differenceInMinutes(busy.start, slotStart);
          if (gapMinutes >= duration) {
            // Found a slot
            const slotEnd = addMinutes(slotStart, duration);
            const score = calculateSlotScore(slotStart, type, priority, workStart, workEnd);

            availableSlots.push({
              startAt: slotStart,
              endAt: slotEnd,
              score,
              reason: getSlotReason(slotStart, score, type),
            });
          }

          slotStart = busy.end;
          const newMins = slotStart.getMinutes();
          if (newMins % 15 !== 0) {
            slotStart = addMinutes(slotStart, 15 - (newMins % 15));
          }
        }

        // Check remaining time in day
        if (isBefore(slotStart, dayEnd)) {
          const remainingMins = differenceInMinutes(dayEnd, slotStart);
          if (remainingMins >= duration) {
            const slotEnd = addMinutes(slotStart, duration);
            const score = calculateSlotScore(slotStart, type, priority, workStart, workEnd);

            availableSlots.push({
              startAt: slotStart,
              endAt: slotEnd,
              score,
              reason: getSlotReason(slotStart, score, type),
            });
          }
        }

        currentDate = addDays(currentDate, 1);
      }

      // Sort by score (highest first) and return top slots
      return availableSlots
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((slot) => ({
          ...slot,
          label: format(slot.startAt, "EEEE d MMMM, HH:mm", { locale: fr }),
        }));
    }),

  // Save/dismiss suggestion
  respond: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        action: z.enum(["accept", "dismiss"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const suggestion = await ctx.db.suggestion.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!suggestion) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.suggestion.update({
        where: { id: input.id },
        data: {
          status: input.action === "accept" ? "ACCEPTED" : "DISMISSED",
          [input.action === "accept" ? "acceptedAt" : "dismissedAt"]: new Date(),
        },
      });
    }),

  // Get pending suggestions
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "ACCEPTED", "DISMISSED"]).optional(),
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.suggestion.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.status ? { status: input.status } : { status: "PENDING" }),
        },
        orderBy: [{ confidence: "desc" }, { createdAt: "desc" }],
        take: input.limit,
      });
    }),

  // Create a scheduling suggestion
  createSchedulingSuggestion: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        suggestedSlot: z.object({
          startAt: z.coerce.date(),
          endAt: z.coerce.date(),
        }),
        confidence: z.number().min(0).max(1).default(0.8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.taskId, userId: ctx.session.user.id },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.suggestion.create({
        data: {
          userId: ctx.session.user.id,
          type: "AUTO_SCHEDULE",
          title: `Planifier "${task.title}"`,
          description: `Creneau suggere: ${format(input.suggestedSlot.startAt, "EEEE d MMMM HH:mm", { locale: fr })}`,
          actionData: {
            taskId: task.id,
            slot: input.suggestedSlot,
          },
          confidence: input.confidence,
        },
      });
    }),
});

// Calculate slot score based on various factors
function calculateSlotScore(
  slotStart: Date,
  type: string,
  priority: string,
  workStart: number,
  workEnd: number
): number {
  let score = 50; // Base score

  const hour = slotStart.getHours();
  const dayOfWeek = getDay(slotStart);

  // Prefer morning slots for focus work
  if (type === "focus" || type === "task") {
    if (hour >= 9 && hour <= 11) {
      score += 20; // Peak morning focus
    } else if (hour >= 14 && hour <= 16) {
      score += 10; // Afternoon focus
    } else if (hour >= 12 && hour < 14) {
      score -= 10; // Post-lunch slump
    }
  }

  // Prefer mid-morning for meetings/events
  if (type === "event") {
    if (hour >= 10 && hour <= 12) {
      score += 15;
    } else if (hour >= 14 && hour <= 16) {
      score += 10;
    }
  }

  // Penalize early morning and late evening
  if (hour < workStart) {
    score -= 20;
  }
  if (hour >= workEnd - 1) {
    score -= 15;
  }

  // Prefer weekdays
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    score += 5;
  }

  // Priority boost
  if (priority === "URGENT") {
    score += 10; // Suggest sooner slots
  } else if (priority === "HIGH") {
    score += 5;
  }

  // Prefer slots starting on the hour or half-hour
  const mins = slotStart.getMinutes();
  if (mins === 0) {
    score += 5;
  } else if (mins === 30) {
    score += 3;
  }

  return Math.max(0, Math.min(100, score));
}

// Generate human-readable reason for slot
function getSlotReason(slotStart: Date, score: number, type: string): string {
  const hour = slotStart.getHours();

  if (score >= 70) {
    if (hour >= 9 && hour <= 11) {
      return "Creneau matinal optimal pour la concentration";
    }
    if (hour >= 14 && hour <= 16) {
      return "Bon creneau de l'apres-midi";
    }
    return "Creneau recommande";
  }

  if (score >= 50) {
    return "Creneau disponible";
  }

  if (hour >= 17) {
    return "Fin de journee - a eviter si possible";
  }

  if (hour < 9) {
    return "Tot le matin - verifiez votre disponibilite";
  }

  return "Creneau alternatif";
}
