import { z } from "zod";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import {
  protectedProcedure,
  protectedMutationProcedure,
} from "@/infrastructure/trpc/procedures";
import { TRPCError } from "@trpc/server";
import { startOfDay, endOfDay, differenceInMinutes, subDays } from "date-fns";

const presetSchema = z.enum([
  "pomodoro_25_5",
  "pomodoro_50_10",
  "deep_90",
  "custom",
]);

export const focusSessionRouter = createTRPCRouter({
  // Start a focus session
  start: protectedMutationProcedure
    .input(
      z.object({
        taskId: z.string().optional(),
        plannedMins: z.number().min(1).max(480),
        preset: presetSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.focusSession.create({
        data: {
          userId: ctx.session.user.id,
          taskId: input.taskId,
          plannedMins: input.plannedMins,
          preset: input.preset,
          startedAt: new Date(),
        },
      });
      return session;
    }),

  // Stop a focus session
  stop: protectedMutationProcedure
    .input(
      z.object({
        sessionId: z.string(),
        completed: z.boolean().default(true),
        interruptions: z.number().min(0).default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.focusSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
      });
      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const endedAt = new Date();
      const actualMins = Math.max(
        0,
        differenceInMinutes(endedAt, session.startedAt)
      );
      return ctx.db.focusSession.update({
        where: { id: input.sessionId },
        data: {
          endedAt,
          actualMins,
          completed: input.completed,
          interruptions: input.interruptions,
        },
      });
    }),

  // Pause (increments interruption count)
  pause: protectedMutationProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.focusSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
      });
      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.focusSession.update({
        where: { id: input.sessionId },
        data: { interruptions: { increment: 1 } },
      });
    }),

  // Resume a session (no-op for DB, exists for symmetry)
  resume: protectedMutationProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.focusSession.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.session.user.id,
        },
      });
      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return session;
    }),

  // List recent sessions
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          taskId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.focusSession.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.taskId ? { taskId: input.taskId } : {}),
        },
        orderBy: { startedAt: "desc" },
        take: input?.limit ?? 20,
        include: {
          task: { select: { id: true, title: true } },
        },
      });
    }),

  // Today's stats + streak
  todayStats: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const dayStart = startOfDay(now);
    const dayEnd = endOfDay(now);

    const todaySessions = await ctx.db.focusSession.findMany({
      where: {
        userId: ctx.session.user.id,
        startedAt: { gte: dayStart, lte: dayEnd },
      },
    });

    const totalMins = todaySessions.reduce(
      (sum, s) => sum + (s.actualMins ?? 0),
      0
    );
    const completedSessions = todaySessions.filter((s) => s.completed).length;

    // Fetch user's goal
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { dailyFocusGoalMins: true },
    });
    const goalMins = user?.dailyFocusGoalMins ?? 120;

    // Compute streak: consecutive days (ending today) where totalMins >= goal
    // Look back up to 90 days
    const ninetyDaysAgo = subDays(dayStart, 90);
    const recentSessions = await ctx.db.focusSession.findMany({
      where: {
        userId: ctx.session.user.id,
        startedAt: { gte: ninetyDaysAgo },
      },
      select: { startedAt: true, actualMins: true },
    });

    // Aggregate by local date (UTC day)
    const minsByDay = new Map<string, number>();
    for (const s of recentSessions) {
      const key = startOfDay(s.startedAt).toISOString();
      minsByDay.set(key, (minsByDay.get(key) ?? 0) + (s.actualMins ?? 0));
    }

    let streak = 0;
    let cursor = dayStart;
    // If today hasn't met goal yet, start from yesterday
    const todayKey = cursor.toISOString();
    const todayMins = minsByDay.get(todayKey) ?? 0;
    if (todayMins < goalMins) {
      cursor = subDays(cursor, 1);
    }
    for (let i = 0; i < 90; i++) {
      const key = cursor.toISOString();
      const mins = minsByDay.get(key) ?? 0;
      if (mins >= goalMins) {
        streak += 1;
        cursor = subDays(cursor, 1);
      } else {
        break;
      }
    }

    return {
      totalMins,
      completedSessions,
      sessionCount: todaySessions.length,
      goalMins,
      progressPct: goalMins > 0 ? Math.min(100, (totalMins / goalMins) * 100) : 0,
      streak,
    };
  }),
});
