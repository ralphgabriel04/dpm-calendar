import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { startOfDay, endOfDay, subDays, differenceInMinutes } from "date-fns";

export const antiProcrastinationRouter = createTRPCRouter({
  // Get quick start suggestions (micro-commitments)
  getQuickStarts: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);

    // Get pending tasks
    const pendingTasks = await ctx.db.task.findMany({
      where: {
        userId: ctx.session.user.id,
        status: { in: ["TODO", "IN_PROGRESS"] },
        OR: [
          { dueAt: { lte: dayEnd } }, // Due today or overdue
          { dueAt: null }, // No due date
        ],
      },
      orderBy: [
        { priority: "desc" },
        { dueAt: "asc" },
      ],
      take: 10,
    });

    // Generate micro-commitments for each task
    const quickStarts = pendingTasks.map((task) => {
      const estimatedDuration = task.plannedDuration || 30;
      const microDuration = Math.min(10, Math.floor(estimatedDuration / 3));

      return {
        taskId: task.id,
        taskTitle: task.title,
        fullDuration: estimatedDuration,
        microCommitment: {
          duration: microDuration,
          prompt: generateMicroPrompt(task.title, microDuration),
        },
        priority: task.priority,
        isOverdue: task.dueAt ? new Date(task.dueAt) < today : false,
      };
    });

    return quickStarts;
  }),

  // Start a micro-commitment session
  startMicroSession: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        duration: z.number().min(5).max(30), // 5-30 minutes
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.taskId, userId: ctx.session.user.id },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Update task status to IN_PROGRESS
      await ctx.db.task.update({
        where: { id: input.taskId },
        data: { status: "IN_PROGRESS" },
      });

      // Create a time block for tracking
      const startAt = new Date();
      const endAt = new Date(startAt.getTime() + input.duration * 60 * 1000);

      const timeBlock = await ctx.db.timeBlock.create({
        data: {
          taskId: input.taskId,
          startAt,
          endAt,
          duration: input.duration,
          status: "IN_PROGRESS",
        },
      });

      return {
        sessionId: timeBlock.id,
        taskId: input.taskId,
        startAt,
        endAt,
        duration: input.duration,
      };
    }),

  // Complete a micro-session
  completeMicroSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        continueWorking: z.boolean().default(false),
        actualDuration: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const timeBlock = await ctx.db.timeBlock.findFirst({
        where: { id: input.sessionId },
        include: { task: true },
      });

      if (!timeBlock || timeBlock.task.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const actualDuration = input.actualDuration || timeBlock.duration;

      // Update time block
      await ctx.db.timeBlock.update({
        where: { id: input.sessionId },
        data: {
          status: "COMPLETED",
          endAt: new Date(),
          duration: actualDuration,
        },
      });

      // Update task's actual duration
      const currentActual = timeBlock.task.actualDuration || 0;
      await ctx.db.task.update({
        where: { id: timeBlock.taskId },
        data: {
          actualDuration: currentActual + actualDuration,
          status: input.continueWorking ? "IN_PROGRESS" : "TODO",
        },
      });

      // Generate encouragement message
      const encouragement = generateEncouragement(actualDuration, input.continueWorking);

      return {
        success: true,
        actualDuration,
        totalTimeOnTask: currentActual + actualDuration,
        encouragement,
      };
    }),

  // Report task avoidance (for tracking patterns)
  reportAvoidance: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        reason: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.taskId, userId: ctx.session.user.id },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Store avoidance in task notes or a separate field
      const currentNotes = task.notes || "";
      const avoidanceLog = `\n[Evitement ${new Date().toISOString()}]${input.reason ? `: ${input.reason}` : ""}`;

      await ctx.db.task.update({
        where: { id: input.taskId },
        data: {
          notes: currentNotes + avoidanceLog,
        },
      });

      // Generate a helpful response
      return {
        message: "C'est normal d'eviter parfois. Voulez-vous essayer juste 5 minutes?",
        suggestedMicroDuration: 5,
      };
    }),

  // Get procrastination patterns
  getPatterns: protectedProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = subDays(new Date(), 30);

    // Get completed time blocks
    const timeBlocks = await ctx.db.timeBlock.findMany({
      where: {
        task: { userId: ctx.session.user.id },
        status: "COMPLETED",
        createdAt: { gte: thirtyDaysAgo },
      },
      include: { task: true },
      orderBy: { startAt: "asc" },
    });

    // Analyze patterns
    const hourlyProductivity: Record<number, { sessions: number; minutes: number }> = {};

    timeBlocks.forEach((tb) => {
      const hour = new Date(tb.startAt).getHours();
      if (!hourlyProductivity[hour]) {
        hourlyProductivity[hour] = { sessions: 0, minutes: 0 };
      }
      hourlyProductivity[hour].sessions += 1;
      hourlyProductivity[hour].minutes += tb.duration;
    });

    // Find most and least productive hours
    const hours = Object.entries(hourlyProductivity);
    hours.sort((a, b) => b[1].minutes - a[1].minutes);

    const mostProductiveHour = hours[0]?.[0];
    const leastProductiveHour = hours[hours.length - 1]?.[0];

    // Get tasks with most avoidance (based on notes)
    const tasksWithAvoidance = await ctx.db.task.findMany({
      where: {
        userId: ctx.session.user.id,
        notes: { contains: "[Evitement" },
      },
    });

    const avoidanceCount = tasksWithAvoidance.reduce((count, task) => {
      const matches = (task.notes || "").match(/\[Evitement/g);
      return count + (matches?.length || 0);
    }, 0);

    return {
      totalSessions: timeBlocks.length,
      totalMinutesWorked: timeBlocks.reduce((sum, tb) => sum + tb.duration, 0),
      mostProductiveHour: mostProductiveHour ? parseInt(mostProductiveHour, 10) : null,
      leastProductiveHour: leastProductiveHour ? parseInt(leastProductiveHour, 10) : null,
      avoidanceCount,
      recommendations: generateRecommendations(
        mostProductiveHour ? parseInt(mostProductiveHour, 10) : null,
        avoidanceCount
      ),
    };
  }),

  // Quick check-in: "Do you have X minutes?"
  checkIn: protectedProcedure
    .input(
      z.object({
        availableMinutes: z.number().min(5).max(60),
      })
    )
    .query(async ({ ctx, input }) => {
      // Find tasks that fit in the available time
      const tasks = await ctx.db.task.findMany({
        where: {
          userId: ctx.session.user.id,
          status: { in: ["TODO", "IN_PROGRESS"] },
          OR: [
            { plannedDuration: { lte: input.availableMinutes } },
            { plannedDuration: null },
          ],
        },
        orderBy: [
          { priority: "desc" },
          { dueAt: "asc" },
        ],
        take: 5,
      });

      return tasks.map((task) => ({
        id: task.id,
        title: task.title,
        estimatedDuration: task.plannedDuration || 15,
        priority: task.priority,
        canComplete: (task.plannedDuration || 15) <= input.availableMinutes,
        suggestion: (task.plannedDuration || 15) <= input.availableMinutes
          ? `Vous pouvez terminer "${task.title}" en ${task.plannedDuration || 15} minutes`
          : `Commencez "${task.title}" pendant ${Math.min(input.availableMinutes, 15)} minutes`,
      }));
    }),
});

// Helper functions
function generateMicroPrompt(taskTitle: string, minutes: number): string {
  const prompts = [
    `Juste ${minutes} minutes sur "${taskTitle}" - vous pouvez le faire!`,
    `Commencez "${taskTitle}" pendant ${minutes} minutes seulement`,
    `${minutes} minutes de focus sur "${taskTitle}" - c'est tout!`,
    `Un petit pas: ${minutes} minutes sur "${taskTitle}"`,
  ];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

function generateEncouragement(minutes: number, continuing: boolean): string {
  if (continuing) {
    return `Excellent! Vous continuez - c'est le signe d'un bon flow!`;
  }
  if (minutes >= 10) {
    return `Bravo! ${minutes} minutes de travail accompli. Chaque minute compte!`;
  }
  return `Bien joue! Vous avez commence - c'est le plus difficile!`;
}

function generateRecommendations(bestHour: number | null, avoidanceCount: number): string[] {
  const recommendations: string[] = [];

  if (bestHour !== null) {
    if (bestHour >= 9 && bestHour <= 11) {
      recommendations.push("Vos meilleures sessions sont le matin - planifiez les taches difficiles a ce moment");
    } else if (bestHour >= 14 && bestHour <= 16) {
      recommendations.push("Vous etes productif l'apres-midi - utilisez ce creneau pour les taches importantes");
    }
  }

  if (avoidanceCount > 10) {
    recommendations.push("Vous evitez souvent certaines taches - essayez la technique des 5 minutes");
  } else if (avoidanceCount > 5) {
    recommendations.push("Divisez les grandes taches en sous-taches plus petites");
  }

  if (recommendations.length === 0) {
    recommendations.push("Continuez a utiliser les micro-sessions pour maintenir votre productivite!");
  }

  return recommendations;
}
