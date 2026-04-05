import { z } from "zod";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";
import { TRPCError } from "@trpc/server";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays } from "date-fns";

export const energyRouter = createTRPCRouter({
  // Log energy/mood entry
  log: protectedProcedure
    .input(
      z.object({
        energyLevel: z.number().min(1).max(5),
        mood: z.number().min(1).max(5).optional(),
        stress: z.number().min(1).max(5).optional(),
        focus: z.number().min(1).max(5).optional(),
        notes: z.string().max(500).optional(),
        timestamp: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.energyLog.create({
        data: {
          userId: ctx.session.user.id,
          ...input,
          timestamp: input.timestamp ?? new Date(),
        },
      });
    }),

  // Get logs for date range
  list: protectedProcedure
    .input(
      z.object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate, limit } = input;

      return ctx.db.energyLog.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(startDate && endDate
            ? { timestamp: { gte: startDate, lte: endDate } }
            : {}),
        },
        orderBy: { timestamp: "desc" },
        take: limit,
      });
    }),

  // Get today's entries
  getToday: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    return ctx.db.energyLog.findMany({
      where: {
        userId: ctx.session.user.id,
        timestamp: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
      orderBy: { timestamp: "desc" },
    });
  }),

  // Get weekly average
  getWeeklyAverage: protectedProcedure.query(async ({ ctx }) => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    const logs = await ctx.db.energyLog.findMany({
      where: {
        userId: ctx.session.user.id,
        timestamp: { gte: weekStart, lte: weekEnd },
      },
    });

    if (logs.length === 0) {
      return {
        avgEnergy: null,
        avgMood: null,
        avgStress: null,
        avgFocus: null,
        count: 0,
      };
    }

    const avgEnergy = logs.reduce((sum, l) => sum + l.energyLevel, 0) / logs.length;
    const moodLogs = logs.filter((l) => l.mood !== null);
    const avgMood = moodLogs.length > 0
      ? moodLogs.reduce((sum, l) => sum + (l.mood || 0), 0) / moodLogs.length
      : null;
    const stressLogs = logs.filter((l) => l.stress !== null);
    const avgStress = stressLogs.length > 0
      ? stressLogs.reduce((sum, l) => sum + (l.stress || 0), 0) / stressLogs.length
      : null;
    const focusLogs = logs.filter((l) => l.focus !== null);
    const avgFocus = focusLogs.length > 0
      ? focusLogs.reduce((sum, l) => sum + (l.focus || 0), 0) / focusLogs.length
      : null;

    return {
      avgEnergy: Math.round(avgEnergy * 10) / 10,
      avgMood: avgMood ? Math.round(avgMood * 10) / 10 : null,
      avgStress: avgStress ? Math.round(avgStress * 10) / 10 : null,
      avgFocus: avgFocus ? Math.round(avgFocus * 10) / 10 : null,
      count: logs.length,
    };
  }),

  // Get patterns (best/worst times)
  getPatterns: protectedProcedure
    .input(
      z.object({
        days: z.number().min(7).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = subDays(new Date(), input.days);

      const logs = await ctx.db.energyLog.findMany({
        where: {
          userId: ctx.session.user.id,
          timestamp: { gte: startDate },
        },
        orderBy: { timestamp: "asc" },
      });

      if (logs.length < 5) {
        return {
          bestTimeOfDay: null,
          worstTimeOfDay: null,
          trend: "stable" as const,
          recommendations: [],
        };
      }

      // Group by hour
      const hourlyEnergy: Record<number, { sum: number; count: number }> = {};
      logs.forEach((log) => {
        const hour = new Date(log.timestamp).getHours();
        if (!hourlyEnergy[hour]) {
          hourlyEnergy[hour] = { sum: 0, count: 0 };
        }
        hourlyEnergy[hour].sum += log.energyLevel;
        hourlyEnergy[hour].count += 1;
      });

      // Find best and worst hours
      let bestHour = -1;
      let bestAvg = 0;
      let worstHour = -1;
      let worstAvg = 6;

      Object.entries(hourlyEnergy).forEach(([hour, data]) => {
        const avg = data.sum / data.count;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestHour = parseInt(hour, 10);
        }
        if (avg < worstAvg) {
          worstAvg = avg;
          worstHour = parseInt(hour, 10);
        }
      });

      // Calculate trend (compare last 7 days vs previous 7 days)
      const midpoint = subDays(new Date(), 7);
      const recentLogs = logs.filter((l) => new Date(l.timestamp) >= midpoint);
      const olderLogs = logs.filter((l) => new Date(l.timestamp) < midpoint);

      let trend: "improving" | "declining" | "stable" = "stable";
      if (recentLogs.length >= 3 && olderLogs.length >= 3) {
        const recentAvg = recentLogs.reduce((s, l) => s + l.energyLevel, 0) / recentLogs.length;
        const olderAvg = olderLogs.reduce((s, l) => s + l.energyLevel, 0) / olderLogs.length;
        if (recentAvg > olderAvg + 0.5) trend = "improving";
        else if (recentAvg < olderAvg - 0.5) trend = "declining";
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (bestHour >= 9 && bestHour <= 11) {
        recommendations.push("Planifiez vos tâches importantes le matin");
      }
      if (worstHour >= 13 && worstHour <= 15) {
        recommendations.push("Prévoyez des pauses après le déjeuner");
      }
      if (trend === "declining") {
        recommendations.push("Votre énergie semble baisser - pensez à faire des pauses");
      }

      const formatHour = (h: number) => `${h.toString().padStart(2, "0")}:00`;

      return {
        bestTimeOfDay: bestHour >= 0 ? formatHour(bestHour) : null,
        worstTimeOfDay: worstHour >= 0 ? formatHour(worstHour) : null,
        trend,
        recommendations,
      };
    }),

  // Delete entry
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const log = await ctx.db.energyLog.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!log) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db.energyLog.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
