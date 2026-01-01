import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { startOfDay, subDays, eachDayOfInterval, format } from "date-fns";
import type { PrismaClient } from "@prisma/client";

export const habitRouter = createTRPCRouter({
  // List habits
  list: protectedProcedure
    .input(
      z.object({
        isActive: z.boolean().optional(),
        goalId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.habit.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          ...(input.goalId ? { goalId: input.goalId } : {}),
        },
        include: {
          goal: true,
          logs: {
            where: {
              date: { gte: subDays(new Date(), 30) },
            },
            orderBy: { date: "desc" },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  // Get habit with stats
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const habit = await ctx.db.habit.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          goal: true,
          logs: {
            orderBy: { date: "desc" },
            take: 90,
          },
        },
      });

      if (!habit) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return habit;
    }),

  // Create habit
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        habitType: z.enum(["FIXED", "FLEXIBLE", "CONDITIONAL"]).default("FLEXIBLE"),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"]).default("DAILY"),
        targetCount: z.number().min(1).default(1),
        duration: z.number().optional(),
        preferredTime: z.string().optional(),
        preferredDays: z.array(z.number().min(0).max(6)).optional(),
        isProtected: z.boolean().optional(),
        goalId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.habit.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  // Update habit
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        habitType: z.enum(["FIXED", "FLEXIBLE", "CONDITIONAL"]).optional(),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"]).optional(),
        targetCount: z.number().min(1).optional(),
        duration: z.number().optional(),
        preferredTime: z.string().optional(),
        preferredDays: z.array(z.number().min(0).max(6)).optional(),
        isProtected: z.boolean().optional(),
        isActive: z.boolean().optional(),
        goalId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const habit = await ctx.db.habit.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!habit) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.habit.update({
        where: { id },
        data,
      });
    }),

  // Delete habit
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const habit = await ctx.db.habit.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!habit) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.habit.delete({
        where: { id: input.id },
      });
    }),

  // Log habit completion
  log: protectedProcedure
    .input(
      z.object({
        habitId: z.string(),
        date: z.coerce.date(),
        completed: z.boolean().default(true),
        count: z.number().optional(),
        duration: z.number().optional(),
        notes: z.string().optional(),
        mood: z.number().min(1).max(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const habit = await ctx.db.habit.findFirst({
        where: { id: input.habitId, userId: ctx.session.user.id },
      });

      if (!habit) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const dateOnly = startOfDay(input.date);

      // Upsert the log
      const log = await ctx.db.habitLog.upsert({
        where: {
          habitId_date: {
            habitId: input.habitId,
            date: dateOnly,
          },
        },
        update: {
          completed: input.completed,
          count: input.count ?? (input.completed ? 1 : 0),
          duration: input.duration,
          notes: input.notes,
          mood: input.mood,
        },
        create: {
          habitId: input.habitId,
          date: dateOnly,
          completed: input.completed,
          count: input.count ?? (input.completed ? 1 : 0),
          duration: input.duration,
          notes: input.notes,
          mood: input.mood,
        },
      });

      // Update streak
      await updateStreak(ctx.db, input.habitId);

      return log;
    }),

  // Get today's habits status
  getTodayStatus: protectedProcedure.query(async ({ ctx }) => {
    const today = startOfDay(new Date());

    const habits = await ctx.db.habit.findMany({
      where: {
        userId: ctx.session.user.id,
        isActive: true,
      },
      include: {
        logs: {
          where: { date: today },
        },
      },
    });

    return habits.map((habit) => ({
      ...habit,
      completedToday: habit.logs.some((log) => log.completed),
      todayCount: habit.logs[0]?.count ?? 0,
    }));
  }),

  // Get habit heatmap data
  getHeatmap: protectedProcedure
    .input(
      z.object({
        habitId: z.string(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const logs = await ctx.db.habitLog.findMany({
        where: {
          habitId: input.habitId,
          habit: { userId: ctx.session.user.id },
          date: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
      });

      const logsMap = new Map(logs.map((log) => [format(log.date, "yyyy-MM-dd"), log]));

      const days = eachDayOfInterval({ start: input.startDate, end: input.endDate });

      return days.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const log = logsMap.get(dateStr);
        return {
          date: dateStr,
          count: log?.count ?? 0,
          completed: log?.completed ?? false,
        };
      });
    }),
});

// Helper function to update streak
async function updateStreak(db: PrismaClient, habitId: string) {
  const logs = await db.habitLog.findMany({
    where: { habitId, completed: true },
    orderBy: { date: "desc" },
    take: 365,
  });

  if (logs.length === 0) {
    await db.habit.update({
      where: { id: habitId },
      data: { currentStreak: 0 },
    });
    return;
  }

  let currentStreak = 0;
  let checkDate = startOfDay(new Date());

  for (const log of logs) {
    const logDate = startOfDay(log.date);
    const diffDays = Math.floor((checkDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      currentStreak++;
      checkDate = logDate;
    } else {
      break;
    }
  }

  const habit = await db.habit.findUnique({ where: { id: habitId } });
  const longestStreak = Math.max(habit?.longestStreak ?? 0, currentStreak);

  await db.habit.update({
    where: { id: habitId },
    data: { currentStreak, longestStreak },
  });
}
