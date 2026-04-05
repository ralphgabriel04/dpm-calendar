import { z } from "zod";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";
import { TRPCError } from "@trpc/server";

export const goalRouter = createTRPCRouter({
  // List goals
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["ACTIVE", "COMPLETED", "PAUSED", "ABANDONED"]).optional(),
        category: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.goal.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.status ? { status: input.status } : {}),
          ...(input.category ? { category: input.category } : {}),
        },
        include: {
          habits: {
            include: {
              _count: {
                select: { logs: { where: { completed: true } } },
              },
            },
          },
          progressLogs: {
            orderBy: { date: "desc" },
            take: 30,
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Get goal
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const goal = await ctx.db.goal.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          habits: true,
          progressLogs: {
            orderBy: { date: "desc" },
          },
        },
      });

      if (!goal) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return goal;
    }),

  // Create goal
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        targetType: z.enum(["CUMULATIVE", "STREAK", "COMPLETION"]).default("CUMULATIVE"),
        targetValue: z.number().min(1),
        unit: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.goal.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  // Update goal
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        targetType: z.enum(["CUMULATIVE", "STREAK", "COMPLETION"]).optional(),
        targetValue: z.number().min(1).optional(),
        currentValue: z.number().optional(),
        unit: z.string().optional(),
        endDate: z.coerce.date().nullable().optional(),
        status: z.enum(["ACTIVE", "COMPLETED", "PAUSED", "ABANDONED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const goal = await ctx.db.goal.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!goal) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.goal.update({
        where: { id },
        data,
      });
    }),

  // Delete goal
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.db.goal.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!goal) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.goal.delete({
        where: { id: input.id },
      });
    }),

  // Log progress
  logProgress: protectedProcedure
    .input(
      z.object({
        goalId: z.string(),
        date: z.coerce.date(),
        value: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.db.goal.findFirst({
        where: { id: input.goalId, userId: ctx.session.user.id },
      });

      if (!goal) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Create progress log
      const log = await ctx.db.goalProgress.create({
        data: {
          goalId: input.goalId,
          date: input.date,
          value: input.value,
          notes: input.notes,
        },
      });

      // Update current value based on target type
      let newCurrentValue = goal.currentValue;

      if (goal.targetType === "CUMULATIVE") {
        // Sum all progress
        const totalProgress = await ctx.db.goalProgress.aggregate({
          where: { goalId: input.goalId },
          _sum: { value: true },
        });
        newCurrentValue = totalProgress._sum.value ?? 0;
      } else if (goal.targetType === "STREAK") {
        // Count consecutive days
        const logs = await ctx.db.goalProgress.findMany({
          where: { goalId: input.goalId, value: { gt: 0 } },
          orderBy: { date: "desc" },
        });
        newCurrentValue = calculateStreak(logs.map((l) => l.date));
      } else {
        // COMPLETION - just use the latest value
        newCurrentValue = input.value;
      }

      // Check if goal is completed
      const isCompleted = newCurrentValue >= goal.targetValue;

      await ctx.db.goal.update({
        where: { id: input.goalId },
        data: {
          currentValue: newCurrentValue,
          status: isCompleted ? "COMPLETED" : goal.status,
        },
      });

      return log;
    }),

  // Link habit to goal
  linkHabit: protectedProcedure
    .input(
      z.object({
        goalId: z.string(),
        habitId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.db.goal.findFirst({
        where: { id: input.goalId, userId: ctx.session.user.id },
      });

      if (!goal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Goal not found" });
      }

      const habit = await ctx.db.habit.findFirst({
        where: { id: input.habitId, userId: ctx.session.user.id },
      });

      if (!habit) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Habit not found" });
      }

      return ctx.db.habit.update({
        where: { id: input.habitId },
        data: { goalId: input.goalId },
      });
    }),

  // Get categories
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    const goals = await ctx.db.goal.findMany({
      where: { userId: ctx.session.user.id },
      select: { category: true },
      distinct: ["category"],
    });

    return goals
      .map((g) => g.category)
      .filter((c): c is string => c !== null);
  }),
});

// Helper function to calculate streak
function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const sortedDates = dates
    .map((d) => new Date(d).setHours(0, 0, 0, 0))
    .sort((a, b) => b - a);

  let streak = 1;
  const oneDay = 24 * 60 * 60 * 1000;

  for (let i = 1; i < sortedDates.length; i++) {
    const diff = sortedDates[i - 1] - sortedDates[i];
    if (diff === oneDay) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
