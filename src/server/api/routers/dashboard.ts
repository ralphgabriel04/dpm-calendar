import { z } from "zod";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  differenceInDays,
  format,
  eachDayOfInterval,
} from "date-fns";

const timeRangeSchema = z.enum([
  "today",
  "tomorrow",
  "week",
  "month",
  "quarter",
  "year",
  "custom",
]);

const heatmapMetricSchema = z.enum(["hours", "tasks", "overload"]);

// Helper to get date range from time range type
function getDateRange(
  range: z.infer<typeof timeRangeSchema>,
  customStart?: Date,
  customEnd?: Date
): { start: Date; end: Date } {
  const now = new Date();

  switch (range) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "tomorrow":
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { start: startOfDay(tomorrow), end: endOfDay(tomorrow) };
    case "week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "quarter":
      return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case "year":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "custom":
      if (!customStart || !customEnd) {
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      }
      return { start: startOfDay(customStart), end: endOfDay(customEnd) };
  }
}

// Helper to get previous period for comparison
function getPreviousPeriod(
  range: z.infer<typeof timeRangeSchema>,
  start: Date,
  end: Date
): { start: Date; end: Date } {
  const daysDiff = differenceInDays(end, start) + 1;

  switch (range) {
    case "today":
    case "tomorrow":
      return { start: subDays(start, 1), end: subDays(end, 1) };
    case "week":
      return { start: subWeeks(start, 1), end: subWeeks(end, 1) };
    case "month":
      return { start: subMonths(start, 1), end: subMonths(end, 1) };
    case "quarter":
      return { start: subQuarters(start, 1), end: subQuarters(end, 1) };
    case "year":
      return { start: subYears(start, 1), end: subYears(end, 1) };
    case "custom":
      return { start: subDays(start, daysDiff), end: subDays(end, daysDiff) };
  }
}

export const dashboardRouter = createTRPCRouter({
  // Get overview statistics
  getOverview: protectedProcedure
    .input(
      z.object({
        range: timeRangeSchema,
        customStart: z.coerce.date().optional(),
        customEnd: z.coerce.date().optional(),
        compareWithPrevious: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const { start, end } = getDateRange(input.range, input.customStart, input.customEnd);

      // Get stats for current period
      const stats = await ctx.db.dailyStats.findMany({
        where: {
          userId: ctx.session.user.id,
          date: { gte: start, lte: end },
        },
      });

      // Aggregate current period
      const totalMinutes = stats.reduce((sum, s) => sum + s.totalActualMins, 0);
      const tasksCompleted = stats.reduce((sum, s) => sum + s.tasksCompleted, 0);
      const tasksPlanned = stats.reduce((sum, s) => sum + s.tasksPlanned, 0);
      const focusMinutes = stats.reduce((sum, s) => sum + s.focusTimeMins, 0);
      const meetingMinutes = stats.reduce((sum, s) => sum + s.meetingTimeMins, 0);
      const avgBalanceScore =
        stats.length > 0
          ? stats.reduce((sum, s) => sum + (s.balanceScore ?? 0), 0) / stats.length
          : 0;

      let previousPeriod = null;
      let percentChange = null;

      if (input.compareWithPrevious) {
        const prev = getPreviousPeriod(input.range, start, end);
        const prevStats = await ctx.db.dailyStats.findMany({
          where: {
            userId: ctx.session.user.id,
            date: { gte: prev.start, lte: prev.end },
          },
        });

        const prevTotalMinutes = prevStats.reduce((sum, s) => sum + s.totalActualMins, 0);
        const prevTasksCompleted = prevStats.reduce((sum, s) => sum + s.tasksCompleted, 0);
        const prevAvgBalanceScore =
          prevStats.length > 0
            ? prevStats.reduce((sum, s) => sum + (s.balanceScore ?? 0), 0) / prevStats.length
            : 0;

        previousPeriod = {
          totalMinutes: prevTotalMinutes,
          tasksCompleted: prevTasksCompleted,
          productivityScore: Math.round(prevAvgBalanceScore * 100),
        };

        percentChange = {
          hours:
            prevTotalMinutes > 0
              ? Math.round(((totalMinutes - prevTotalMinutes) / prevTotalMinutes) * 100)
              : 0,
          tasks:
            prevTasksCompleted > 0
              ? Math.round(((tasksCompleted - prevTasksCompleted) / prevTasksCompleted) * 100)
              : 0,
          productivity:
            prevAvgBalanceScore > 0
              ? Math.round(((avgBalanceScore - prevAvgBalanceScore) / prevAvgBalanceScore) * 100)
              : 0,
        };
      }

      return {
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        tasksCompleted,
        tasksPlanned,
        taskCompletionRate: tasksPlanned > 0 ? Math.round((tasksCompleted / tasksPlanned) * 100) : 0,
        productivityScore: Math.round(avgBalanceScore * 100),
        focusHours: Math.round((focusMinutes / 60) * 10) / 10,
        meetingHours: Math.round((meetingMinutes / 60) * 10) / 10,
        previousPeriod,
        percentChange,
        dateRange: { start, end },
      };
    }),

  // Get heatmap data
  getHeatmapData: protectedProcedure
    .input(
      z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        metric: heatmapMetricSchema.default("hours"),
      })
    )
    .query(async ({ ctx, input }) => {
      const stats = await ctx.db.dailyStats.findMany({
        where: {
          userId: ctx.session.user.id,
          date: { gte: input.startDate, lte: input.endDate },
        },
        orderBy: { date: "asc" },
      });

      // Create a map for quick lookup
      const statsMap = new Map(
        stats.map((s) => [format(s.date, "yyyy-MM-dd"), s])
      );

      // Generate all days in range
      const allDays = eachDayOfInterval({
        start: input.startDate,
        end: input.endDate,
      });

      return allDays.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const dayStat = statsMap.get(dateKey);

        let value = 0;
        if (dayStat) {
          switch (input.metric) {
            case "hours":
              value = Math.round((dayStat.totalActualMins / 60) * 10) / 10;
              break;
            case "tasks":
              value = dayStat.tasksCompleted;
              break;
            case "overload":
              value = dayStat.overloadScore ?? 0;
              break;
          }
        }

        return {
          date: dateKey,
          value,
          details: dayStat
            ? {
                focusMins: dayStat.focusTimeMins,
                meetingMins: dayStat.meetingTimeMins,
                breakMins: dayStat.breakTimeMins,
                tasksCompleted: dayStat.tasksCompleted,
                tasksPlanned: dayStat.tasksPlanned,
                habitsCompleted: dayStat.habitsCompleted,
                overloadScore: dayStat.overloadScore ?? 0,
                balanceScore: dayStat.balanceScore ?? 0,
              }
            : null,
        };
      });
    }),

  // Get time distribution
  getTimeDistribution: protectedProcedure
    .input(
      z.object({
        range: timeRangeSchema,
        customStart: z.coerce.date().optional(),
        customEnd: z.coerce.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { start, end } = getDateRange(input.range, input.customStart, input.customEnd);

      const stats = await ctx.db.dailyStats.findMany({
        where: {
          userId: ctx.session.user.id,
          date: { gte: start, lte: end },
        },
      });

      const focusMins = stats.reduce((sum, s) => sum + s.focusTimeMins, 0);
      const meetingMins = stats.reduce((sum, s) => sum + s.meetingTimeMins, 0);
      const breakMins = stats.reduce((sum, s) => sum + s.breakTimeMins, 0);
      const totalMins = focusMins + meetingMins + breakMins;

      return {
        focusMins,
        meetingMins,
        breakMins,
        totalMins,
        focusPercent: totalMins > 0 ? Math.round((focusMins / totalMins) * 100) : 0,
        meetingPercent: totalMins > 0 ? Math.round((meetingMins / totalMins) * 100) : 0,
        breakPercent: totalMins > 0 ? Math.round((breakMins / totalMins) * 100) : 0,
      };
    }),

  // Get upcoming deadlines
  getUpcomingDeadlines: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();

      const tasks = await ctx.db.task.findMany({
        where: {
          userId: ctx.session.user.id,
          dueAt: { gte: now },
          status: { notIn: ["DONE", "CANCELLED"] },
        },
        orderBy: { dueAt: "asc" },
        take: input.limit,
        select: {
          id: true,
          title: true,
          dueAt: true,
          priority: true,
          status: true,
        },
      });

      return tasks.map((task) => ({
        id: task.id,
        title: task.title,
        dueAt: task.dueAt,
        priority: task.priority,
        status: task.status,
        daysRemaining: task.dueAt ? differenceInDays(task.dueAt, now) : null,
      }));
    }),

  // Get workload balance
  getWorkloadBalance: protectedProcedure
    .input(
      z.object({
        range: timeRangeSchema,
        customStart: z.coerce.date().optional(),
        customEnd: z.coerce.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { start, end } = getDateRange(input.range, input.customStart, input.customEnd);

      const stats = await ctx.db.dailyStats.findMany({
        where: {
          userId: ctx.session.user.id,
          date: { gte: start, lte: end },
        },
        orderBy: { date: "asc" },
      });

      // Create a map for quick lookup
      const statsMap = new Map(
        stats.map((s) => [format(s.date, "yyyy-MM-dd"), s])
      );

      // Generate all days in range
      const allDays = eachDayOfInterval({ start, end });

      return allDays.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const dayStat = statsMap.get(dateKey);

        let status: "light" | "normal" | "heavy" | "overloaded" = "light";
        const scheduledMins = dayStat?.totalScheduledMins ?? 0;

        if (scheduledMins < 240) {
          status = "light";
        } else if (scheduledMins < 420) {
          status = "normal";
        } else if (scheduledMins < 540) {
          status = "heavy";
        } else {
          status = "overloaded";
        }

        return {
          date: dateKey,
          scheduledMins,
          actualMins: dayStat?.totalActualMins ?? 0,
          overloadScore: dayStat?.overloadScore ?? 0,
          status,
        };
      });
    }),

  // Get habit streaks summary
  getHabitStreaks: protectedProcedure.query(async ({ ctx }) => {
    const habits = await ctx.db.habit.findMany({
      where: {
        userId: ctx.session.user.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        color: true,
        currentStreak: true,
        longestStreak: true,
        logs: {
          where: {
            date: {
              gte: startOfDay(new Date()),
              lte: endOfDay(new Date()),
            },
          },
          select: { completed: true },
          take: 1,
        },
      },
      orderBy: { currentStreak: "desc" },
      take: 5,
    });

    return habits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      color: habit.color,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      completedToday: habit.logs.length > 0 && habit.logs[0].completed,
    }));
  }),

  // Get detailed productivity score with breakdown
  getProductivityScore: protectedProcedure
    .input(
      z.object({
        range: timeRangeSchema,
        customStart: z.coerce.date().optional(),
        customEnd: z.coerce.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { start, end } = getDateRange(input.range, input.customStart, input.customEnd);
      const prev = getPreviousPeriod(input.range, start, end);

      // Get current period stats
      const currentStats = await ctx.db.dailyStats.findMany({
        where: {
          userId: ctx.session.user.id,
          date: { gte: start, lte: end },
        },
      });

      // Get previous period stats
      const previousStats = await ctx.db.dailyStats.findMany({
        where: {
          userId: ctx.session.user.id,
          date: { gte: prev.start, lte: prev.end },
        },
      });

      // Get habit completion rate
      const habits = await ctx.db.habit.findMany({
        where: {
          userId: ctx.session.user.id,
          isActive: true,
        },
        select: {
          currentStreak: true,
          longestStreak: true,
        },
      });

      // Calculate task completion score (0-100)
      const tasksCompleted = currentStats.reduce((sum, s) => sum + s.tasksCompleted, 0);
      const tasksPlanned = currentStats.reduce((sum, s) => sum + s.tasksPlanned, 0);
      const taskCompletionScore = tasksPlanned > 0
        ? Math.min(100, Math.round((tasksCompleted / tasksPlanned) * 100))
        : 50; // Default score if no tasks planned

      // Calculate focus time score (0-100)
      // Ideal: 4+ hours of focus per day on average
      const totalFocusMins = currentStats.reduce((sum, s) => sum + s.focusTimeMins, 0);
      const avgDailyFocusMins = currentStats.length > 0 ? totalFocusMins / currentStats.length : 0;
      const focusTimeScore = Math.min(100, Math.round((avgDailyFocusMins / 240) * 100));

      // Calculate habit streak score (0-100)
      const avgStreak = habits.length > 0
        ? habits.reduce((sum, h) => sum + h.currentStreak, 0) / habits.length
        : 0;
      const maxExpectedStreak = 30; // 30-day streak is excellent
      const habitStreakScore = Math.min(100, Math.round((avgStreak / maxExpectedStreak) * 100));

      // Calculate time balance score (0-100)
      // Based on ratio of meetings vs focus time (ideal is more focus than meetings)
      const totalMeetingMins = currentStats.reduce((sum, s) => sum + s.meetingTimeMins, 0);
      const focusToMeetingRatio = totalMeetingMins > 0
        ? totalFocusMins / totalMeetingMins
        : 2; // Default to good if no meetings
      const timeBalanceScore = Math.min(100, Math.round(Math.min(focusToMeetingRatio / 2, 1) * 100));

      // Calculate overall score (weighted average)
      const overallScore = Math.round(
        taskCompletionScore * 0.30 +
        focusTimeScore * 0.30 +
        habitStreakScore * 0.20 +
        timeBalanceScore * 0.20
      );

      // Calculate previous period score
      const prevTasksCompleted = previousStats.reduce((sum, s) => sum + s.tasksCompleted, 0);
      const prevTasksPlanned = previousStats.reduce((sum, s) => sum + s.tasksPlanned, 0);
      const prevTaskScore = prevTasksPlanned > 0
        ? Math.min(100, Math.round((prevTasksCompleted / prevTasksPlanned) * 100))
        : 50;

      const prevFocusMins = previousStats.reduce((sum, s) => sum + s.focusTimeMins, 0);
      const prevAvgFocusMins = previousStats.length > 0 ? prevFocusMins / previousStats.length : 0;
      const prevFocusScore = Math.min(100, Math.round((prevAvgFocusMins / 240) * 100));

      const previousScore = previousStats.length > 0
        ? Math.round(prevTaskScore * 0.30 + prevFocusScore * 0.30 + habitStreakScore * 0.20 + timeBalanceScore * 0.20)
        : undefined;

      return {
        score: overallScore,
        previousScore,
        breakdown: {
          taskCompletion: taskCompletionScore,
          focusTime: focusTimeScore,
          habitStreak: habitStreakScore,
          timeBalance: timeBalanceScore,
        },
        details: {
          tasksCompleted,
          tasksPlanned,
          avgDailyFocusHours: Math.round((avgDailyFocusMins / 60) * 10) / 10,
          avgHabitStreak: Math.round(avgStreak * 10) / 10,
          focusToMeetingRatio: Math.round(focusToMeetingRatio * 10) / 10,
        },
      };
    }),

  // Get goal progress summary
  getGoalProgress: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const goals = await ctx.db.goal.findMany({
        where: {
          userId: ctx.session.user.id,
          status: "ACTIVE",
        },
        orderBy: { updatedAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          title: true,
          category: true,
          targetType: true,
          targetValue: true,
          currentValue: true,
          unit: true,
          endDate: true,
        },
      });

      return goals.map((goal) => ({
        id: goal.id,
        title: goal.title,
        color: goal.category, // Using category as color fallback
        targetType: goal.targetType,
        targetValue: goal.targetValue,
        currentValue: goal.currentValue,
        unit: goal.unit,
        progress:
          goal.targetValue > 0
            ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
            : 0,
        daysRemaining: goal.endDate ? differenceInDays(goal.endDate, new Date()) : null,
      }));
    }),
});
