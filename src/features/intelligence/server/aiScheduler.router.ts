import { z } from "zod";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";
import { TRPCError } from "@trpc/server";
import { addMinutes, startOfDay, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  planMyDay,
  getCalibratedEstimate,
  rescheduleAfterShift,
} from "./aiScheduler.service";

// Focus tag used to identify focus blocks
const FOCUS_TAG = "focus";

const timeBlockProposalSchema = z.object({
  taskId: z.string(),
  taskTitle: z.string(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  duration: z.number(),
  score: z.number(),
  reason: z.string(),
  energyMatch: z.enum(["optimal", "good", "acceptable"]),
});

export const aiSchedulerRouter = createTRPCRouter({
  /**
   * Plan My Day - Generate optimal schedule for unscheduled tasks
   * Ticket #87
   */
  planDay: protectedProcedure
    .input(
      z.object({
        date: z.coerce.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const date = input.date || new Date();
      const plan = await planMyDay(ctx.session.user.id, date);

      return {
        ...plan,
        proposals: plan.proposals.map((p) => ({
          ...p,
          label: format(p.startAt, "HH:mm", { locale: fr }) +
            " - " +
            format(p.endAt, "HH:mm", { locale: fr }),
        })),
      };
    }),

  /**
   * Accept and create time blocks from proposals
   * Ticket #87
   */
  acceptPlan: protectedProcedure
    .input(
      z.object({
        proposals: z.array(timeBlockProposalSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const created: { id: string; taskId: string; startAt: Date; endAt: Date }[] = [];

      for (const proposal of input.proposals) {
        // Verify task ownership
        const task = await ctx.db.task.findFirst({
          where: { id: proposal.taskId, userId },
        });

        if (!task) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Task ${proposal.taskId} not found`,
          });
        }

        // Create time block
        const timeBlock = await ctx.db.timeBlock.create({
          data: {
            taskId: proposal.taskId,
            startAt: proposal.startAt,
            endAt: proposal.endAt,
            duration: proposal.duration,
            status: "SCHEDULED",
          },
        });

        created.push({
          id: timeBlock.id,
          taskId: timeBlock.taskId,
          startAt: timeBlock.startAt,
          endAt: timeBlock.endAt,
        });

        // Create suggestion record for tracking
        await ctx.db.suggestion.create({
          data: {
            userId,
            type: "AUTO_SCHEDULE",
            title: `Planifié: "${task.title}"`,
            description: `Créneau: ${format(proposal.startAt, "HH:mm", { locale: fr })} - ${format(proposal.endAt, "HH:mm", { locale: fr })}`,
            actionData: {
              taskId: proposal.taskId,
              timeBlockId: timeBlock.id,
              slot: {
                startAt: proposal.startAt.toISOString(),
                endAt: proposal.endAt.toISOString(),
              },
            },
            confidence: proposal.score / 100,
            status: "ACCEPTED",
            acceptedAt: new Date(),
          },
        });
      }

      return {
        created,
        count: created.length,
      };
    }),

  /**
   * Adaptive Rescheduling - Replan after an event/block shifts
   * Ticket #88
   */
  replan: protectedProcedure
    .input(
      z.object({
        affectedBlockId: z.string(),
        deltaMinutes: z.number(), // Positive = pushed later, negative = earlier
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { affected, conflicts } = await rescheduleAfterShift(
        ctx.session.user.id,
        input.affectedBlockId,
        input.deltaMinutes
      );

      return {
        affected: affected.map((p) => ({
          ...p,
          label: format(p.startAt, "HH:mm", { locale: fr }) +
            " - " +
            format(p.endAt, "HH:mm", { locale: fr }),
        })),
        conflicts,
        hasConflicts: conflicts.length > 0,
      };
    }),

  /**
   * Apply rescheduled blocks
   * Ticket #88
   */
  applyReplan: protectedProcedure
    .input(
      z.object({
        updates: z.array(
          z.object({
            taskId: z.string(),
            startAt: z.coerce.date(),
            endAt: z.coerce.date(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const updated: string[] = [];

      for (const update of input.updates) {
        // Find the existing time block
        const existingBlock = await ctx.db.timeBlock.findFirst({
          where: {
            taskId: update.taskId,
            task: { userId },
            status: { not: "CANCELLED" },
            startAt: {
              gte: startOfDay(update.startAt),
              lte: addMinutes(startOfDay(update.startAt), 24 * 60),
            },
          },
        });

        if (existingBlock) {
          await ctx.db.timeBlock.update({
            where: { id: existingBlock.id },
            data: {
              startAt: update.startAt,
              endAt: update.endAt,
            },
          });
          updated.push(existingBlock.id);
        }
      }

      return {
        updated,
        count: updated.length,
      };
    }),

  /**
   * Get calibrated duration estimate for a task
   * Ticket #139
   */
  getCalibratedEstimate: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const estimate = await getCalibratedEstimate(
        ctx.session.user.id,
        input.taskId
      );

      return {
        ...estimate,
        recommendation:
          estimate.calibrationFactor > 1.2
            ? "Vous sous-estimez généralement vos tâches. Considérez d'ajouter un buffer de " +
              Math.round((estimate.calibrationFactor - 1) * 100) +
              "%."
            : estimate.calibrationFactor < 0.8
            ? "Vous surestimez généralement vos tâches. Vos estimations peuvent être réduites."
            : "Vos estimations sont généralement précises.",
      };
    }),

  /**
   * Record actual duration for calibration
   * Ticket #139
   */
  recordActualDuration: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        actualMinutes: z.number().min(1).max(480),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.taskId, userId: ctx.session.user.id },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      await ctx.db.task.update({
        where: { id: input.taskId },
        data: {
          actualDuration: input.actualMinutes,
        },
      });

      // Update daily stats
      const today = startOfDay(new Date());
      await ctx.db.dailyStats.upsert({
        where: {
          userId_date: {
            userId: ctx.session.user.id,
            date: today,
          },
        },
        update: {
          totalActualMins: { increment: input.actualMinutes },
        },
        create: {
          userId: ctx.session.user.id,
          date: today,
          totalScheduledMins: 0,
          totalActualMins: input.actualMinutes,
          focusTimeMins: 0,
          meetingTimeMins: 0,
          breakTimeMins: 0,
          tasksCompleted: 0,
          tasksPlanned: 0,
          habitsCompleted: 0,
        },
      });

      return {
        taskId: input.taskId,
        actualDuration: input.actualMinutes,
        plannedDuration: task.plannedDuration,
        variance: task.plannedDuration
          ? input.actualMinutes - task.plannedDuration
          : null,
      };
    }),

  /**
   * Get focus blocks for a day (constraints)
   * Ticket #138
   */
  getFocusBlocks: protectedProcedure
    .input(
      z.object({
        date: z.coerce.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const date = input.date || new Date();
      const dayStart = startOfDay(date);
      const dayEnd = addMinutes(dayStart, 24 * 60);

      // Get all time blocks and filter for those with focus tag
      const allBlocks = await ctx.db.timeBlock.findMany({
        where: {
          task: { userId: ctx.session.user.id },
          status: { not: "CANCELLED" },
          startAt: { gte: dayStart, lt: dayEnd },
        },
        include: {
          task: {
            select: { id: true, title: true, tags: true },
          },
        },
        orderBy: { startAt: "asc" },
      });

      // Filter for focus blocks (tasks with focus tag)
      const focusBlocks = allBlocks.filter((fb) =>
        fb.task.tags.includes(FOCUS_TAG)
      );

      return focusBlocks.map((fb) => ({
        id: fb.id,
        taskId: fb.taskId,
        taskTitle: fb.task.title,
        startAt: fb.startAt,
        endAt: fb.endAt,
        label: format(fb.startAt, "HH:mm", { locale: fr }) +
          " - " +
          format(fb.endAt, "HH:mm", { locale: fr }),
        isImmovable: true,
      }));
    }),

  /**
   * Create a focus block (immovable constraint)
   * Ticket #138
   */
  createFocusBlock: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        startAt: z.coerce.date(),
        duration: z.number().min(15).max(240), // 15 min to 4 hours
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.taskId, userId: ctx.session.user.id },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      const endAt = addMinutes(input.startAt, input.duration);

      // Check for conflicts with existing focus blocks or events
      const allBlocks = await ctx.db.timeBlock.findMany({
        where: {
          task: { userId: ctx.session.user.id },
          status: { not: "CANCELLED" },
          OR: [
            {
              startAt: { gte: input.startAt, lt: endAt },
            },
            {
              endAt: { gt: input.startAt, lte: endAt },
            },
            {
              AND: [
                { startAt: { lte: input.startAt } },
                { endAt: { gte: endAt } },
              ],
            },
          ],
        },
        include: { task: { select: { tags: true } } },
      });

      // Check if any of them is a focus block
      const conflictingFocusBlock = allBlocks.find((b) =>
        b.task.tags.includes(FOCUS_TAG)
      );

      if (conflictingFocusBlock) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ce créneau chevauche un autre bloc de focus",
        });
      }

      // Add focus tag to task if not already present
      if (!task.tags.includes(FOCUS_TAG)) {
        await ctx.db.task.update({
          where: { id: input.taskId },
          data: {
            tags: [...task.tags, FOCUS_TAG],
          },
        });
      }

      // Create the focus block
      const focusBlock = await ctx.db.timeBlock.create({
        data: {
          taskId: input.taskId,
          startAt: input.startAt,
          endAt,
          duration: input.duration,
          status: "SCHEDULED",
        },
      });

      return {
        id: focusBlock.id,
        taskId: focusBlock.taskId,
        startAt: focusBlock.startAt,
        endAt: focusBlock.endAt,
        label: format(focusBlock.startAt, "HH:mm", { locale: fr }) +
          " - " +
          format(focusBlock.endAt, "HH:mm", { locale: fr }),
      };
    }),

  /**
   * Get scheduling statistics
   */
  getStats: protectedProcedure
    .input(
      z.object({
        days: z.number().min(7).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const startDate = addMinutes(new Date(), -input.days * 24 * 60);

      // Get completed tasks with duration data
      const completedTasks = await ctx.db.task.findMany({
        where: {
          userId,
          status: "DONE",
          completedAt: { gte: startDate },
          actualDuration: { not: null },
          plannedDuration: { not: null },
        },
        select: {
          plannedDuration: true,
          actualDuration: true,
        },
      });

      if (completedTasks.length === 0) {
        return {
          totalTasks: 0,
          avgAccuracy: null,
          overEstimateCount: 0,
          underEstimateCount: 0,
          onTimeCount: 0,
          avgOverrun: null,
          recommendation: "Pas encore assez de données pour les statistiques.",
        };
      }

      let overEstimateCount = 0;
      let underEstimateCount = 0;
      let onTimeCount = 0;
      let totalVariance = 0;

      for (const task of completedTasks) {
        const planned = task.plannedDuration!;
        const actual = task.actualDuration!;
        const variance = actual - planned;
        totalVariance += variance;

        const variancePercent = (variance / planned) * 100;

        if (variancePercent > 10) {
          underEstimateCount++; // Took longer than planned
        } else if (variancePercent < -10) {
          overEstimateCount++; // Took less than planned
        } else {
          onTimeCount++;
        }
      }

      const avgVariance = totalVariance / completedTasks.length;
      const avgAccuracy =
        100 -
        Math.abs(
          (completedTasks.reduce(
            (sum, t) => sum + Math.abs(t.actualDuration! - t.plannedDuration!),
            0
          ) /
            completedTasks.reduce((sum, t) => sum + t.plannedDuration!, 0)) *
            100
        );

      let recommendation = "";
      if (avgVariance > 10) {
        recommendation =
          "Vous sous-estimez régulièrement vos tâches. Essayez d'ajouter 20% à vos estimations.";
      } else if (avgVariance < -10) {
        recommendation =
          "Vous surestimez régulièrement vos tâches. Vous pouvez être plus ambitieux avec vos plannings.";
      } else {
        recommendation =
          "Vos estimations sont généralement précises. Continuez ainsi!";
      }

      return {
        totalTasks: completedTasks.length,
        avgAccuracy: Math.round(avgAccuracy * 10) / 10,
        overEstimateCount,
        underEstimateCount,
        onTimeCount,
        avgOverrun: Math.round(avgVariance),
        recommendation,
      };
    }),
});
