import { z } from "zod";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";
import { TRPCError } from "@trpc/server";
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth, subDays, subWeeks, subMonths } from "date-fns";
import type { PrismaClient } from "@prisma/client";

export const recapRouter = createTRPCRouter({
  // Get or generate recap
  get: protectedProcedure
    .input(
      z.object({
        type: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
        date: z.coerce.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const baseDate = input.date ?? new Date();
      let periodStart: Date;
      let periodEnd: Date;

      switch (input.type) {
        case "DAILY":
          periodStart = startOfDay(baseDate);
          periodEnd = endOfDay(baseDate);
          break;
        case "WEEKLY":
          periodStart = startOfWeek(baseDate, { weekStartsOn: 1 });
          periodEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
          break;
        case "MONTHLY":
          periodStart = startOfMonth(baseDate);
          periodEnd = endOfMonth(baseDate);
          break;
      }

      let recap = await ctx.db.recap.findFirst({
        where: {
          userId: ctx.session.user.id,
          recapType: input.type,
          periodStart,
        },
      });

      if (!recap) {
        // Generate recap
        const summary = await generateRecapSummary(ctx.db, ctx.session.user.id, periodStart, periodEnd);

        recap = await ctx.db.recap.create({
          data: {
            userId: ctx.session.user.id,
            recapType: input.type,
            periodStart,
            periodEnd,
            summary,
            highlights: summary.highlights ?? [],
            improvements: summary.improvements ?? [],
            insights: summary.insights ?? [],
          },
        });
      }

      return recap;
    }),

  // List recaps
  list: protectedProcedure
    .input(
      z.object({
        type: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.recap.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.type ? { recapType: input.type } : {}),
        },
        orderBy: { periodStart: "desc" },
        take: input.limit,
      });
    }),

  // Update recap with user notes/rating
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        userNotes: z.string().optional(),
        rating: z.number().min(1).max(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const recap = await ctx.db.recap.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!recap) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.recap.update({
        where: { id },
        data,
      });
    }),

  // Get daily stats
  getDailyStats: protectedProcedure
    .input(
      z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.dailyStats.findMany({
        where: {
          userId: ctx.session.user.id,
          date: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        orderBy: { date: "asc" },
      });
    }),

  // Compare periods
  compare: protectedProcedure
    .input(
      z.object({
        type: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
        currentDate: z.coerce.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      let currentStart: Date;
      let previousStart: Date;

      switch (input.type) {
        case "DAILY":
          currentStart = startOfDay(input.currentDate);
          previousStart = subDays(currentStart, 1);
          break;
        case "WEEKLY":
          currentStart = startOfWeek(input.currentDate, { weekStartsOn: 1 });
          previousStart = subWeeks(currentStart, 1);
          break;
        case "MONTHLY":
          currentStart = startOfMonth(input.currentDate);
          previousStart = subMonths(currentStart, 1);
          break;
      }

      const [current, previous] = await Promise.all([
        ctx.db.recap.findFirst({
          where: {
            userId: ctx.session.user.id,
            recapType: input.type,
            periodStart: currentStart,
          },
        }),
        ctx.db.recap.findFirst({
          where: {
            userId: ctx.session.user.id,
            recapType: input.type,
            periodStart: previousStart,
          },
        }),
      ]);

      return { current, previous };
    }),
});

// Helper to generate recap summary
async function generateRecapSummary(
  db: PrismaClient,
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const [events, tasks, habits] = await Promise.all([
    db.event.count({
      where: {
        userId,
        startAt: { gte: startDate, lte: endDate },
      },
    }),
    db.task.findMany({
      where: {
        userId,
        OR: [
          { completedAt: { gte: startDate, lte: endDate } },
          { dueAt: { gte: startDate, lte: endDate } },
        ],
      },
    }),
    db.habitLog.findMany({
      where: {
        habit: { userId },
        date: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  const tasksCompleted = tasks.filter((t) => t.status === "DONE").length;
  const tasksPending = tasks.filter((t) => t.status !== "DONE").length;
  const habitsCompleted = habits.filter((h) => h.completed).length;
  const totalHabitLogs = habits.length;

  const highlights: string[] = [];
  const improvements: string[] = [];
  const insights: string[] = [];

  if (tasksCompleted > 0) {
    highlights.push(`${tasksCompleted} tâches complétées`);
  }
  if (habitsCompleted > 0) {
    highlights.push(`${habitsCompleted} habitudes maintenues`);
  }
  if (events > 0) {
    highlights.push(`${events} événements`);
  }

  if (tasksPending > 3) {
    improvements.push(`${tasksPending} tâches en attente`);
  }
  if (totalHabitLogs > 0 && habitsCompleted / totalHabitLogs < 0.7) {
    improvements.push("Améliorer le suivi des habitudes");
  }

  const completionRate = totalHabitLogs > 0 ? (habitsCompleted / totalHabitLogs) * 100 : 0;
  if (completionRate > 80) {
    insights.push("Excellente régularité dans les habitudes !");
  }

  return {
    eventsCount: events,
    tasksCompleted,
    tasksPending,
    habitsCompleted,
    habitCompletionRate: completionRate,
    highlights,
    improvements,
    insights,
  };
}
