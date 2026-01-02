import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  differenceInMinutes,
  differenceInDays,
  differenceInHours,
  isSameWeek,
  setHours,
} from "date-fns";

const WORK_HOURS_PER_DAY = 8;
const WORK_MINUTES_PER_DAY = WORK_HOURS_PER_DAY * 60;
const CRITICAL_THRESHOLD = 0.9; // 90% capacity = critical
const WARNING_THRESHOLD = 0.75; // 75% capacity = warning

interface DayLoad {
  date: Date;
  scheduledMinutes: number;
  taskMinutes: number;
  totalMinutes: number;
  freeMinutes: number;
  loadPercent: number;
  isCritical: boolean;
  isWarning: boolean;
}

interface WeekAnalysis {
  weekStart: Date;
  weekEnd: Date;
  totalScheduledMinutes: number;
  totalTaskMinutes: number;
  avgDailyLoad: number;
  criticalDays: number;
  warningDays: number;
  isCriticalWeek: boolean;
  isWarningWeek: boolean;
  recommendation: string | null;
}

interface TaskUrgency {
  taskId: string;
  title: string;
  dueAt: Date | null;
  estimatedMinutes: number;
  perceivedUrgency: number; // 0-100
  urgencyLevel: "low" | "medium" | "high" | "critical";
  factors: string[];
  suggestedAction: string;
}

export const workloadRouter = createTRPCRouter({
  // Get daily workload for date range
  getDailyWorkload: protectedProcedure
    .input(
      z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;
      const userId = ctx.session.user.id;

      // Get events
      const events = await ctx.db.event.findMany({
        where: {
          userId,
          status: { not: "CANCELLED" },
          startAt: { lte: endDate },
          endAt: { gte: startDate },
        },
      });

      // Get tasks with due dates in range
      const tasks = await ctx.db.task.findMany({
        where: {
          userId,
          status: { not: "DONE" },
          OR: [
            { dueAt: { gte: startDate, lte: endDate } },
            { plannedStartAt: { gte: startDate, lte: endDate } },
          ],
        },
      });

      // Calculate daily loads
      const dailyLoads: DayLoad[] = [];
      let currentDate = startOfDay(startDate);

      while (currentDate <= endDate) {
        const dayStart = startOfDay(currentDate);
        const dayEnd = endOfDay(currentDate);

        // Events for this day
        const dayEvents = events.filter((e) => {
          return e.startAt <= dayEnd && e.endAt >= dayStart;
        });

        let scheduledMinutes = 0;
        dayEvents.forEach((event) => {
          const start = event.startAt < dayStart ? dayStart : event.startAt;
          const end = event.endAt > dayEnd ? dayEnd : event.endAt;
          scheduledMinutes += differenceInMinutes(end, start);
        });

        // Tasks due this day
        const dayTasks = tasks.filter((t) => {
          if (t.dueAt) {
            return t.dueAt >= dayStart && t.dueAt <= dayEnd;
          }
          return false;
        });

        const taskMinutes = dayTasks.reduce(
          (sum, t) => sum + (t.plannedDuration || 30),
          0
        );

        const totalMinutes = scheduledMinutes + taskMinutes;
        const freeMinutes = Math.max(0, WORK_MINUTES_PER_DAY - totalMinutes);
        const loadPercent = (totalMinutes / WORK_MINUTES_PER_DAY) * 100;

        dailyLoads.push({
          date: currentDate,
          scheduledMinutes,
          taskMinutes,
          totalMinutes,
          freeMinutes,
          loadPercent,
          isCritical: loadPercent >= CRITICAL_THRESHOLD * 100,
          isWarning: loadPercent >= WARNING_THRESHOLD * 100 && loadPercent < CRITICAL_THRESHOLD * 100,
        });

        currentDate = addDays(currentDate, 1);
      }

      return dailyLoads;
    }),

  // Detect critical weeks
  getCriticalWeeks: protectedProcedure
    .input(
      z.object({
        weeksAhead: z.number().min(1).max(12).default(4),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const today = new Date();
      const weekAnalyses: WeekAnalysis[] = [];

      for (let w = 0; w < input.weeksAhead; w++) {
        const weekStart = startOfWeek(addWeeks(today, w), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

        // Get events for this week
        const events = await ctx.db.event.findMany({
          where: {
            userId,
            status: { not: "CANCELLED" },
            startAt: { lte: weekEnd },
            endAt: { gte: weekStart },
          },
        });

        // Get tasks due this week
        const tasks = await ctx.db.task.findMany({
          where: {
            userId,
            status: { not: "DONE" },
            dueAt: { gte: weekStart, lte: weekEnd },
          },
        });

        // Calculate totals
        let totalScheduledMinutes = 0;
        events.forEach((event) => {
          const start = event.startAt < weekStart ? weekStart : event.startAt;
          const end = event.endAt > weekEnd ? weekEnd : event.endAt;
          totalScheduledMinutes += differenceInMinutes(end, start);
        });

        const totalTaskMinutes = tasks.reduce(
          (sum, t) => sum + (t.plannedDuration || 30),
          0
        );

        // Calculate daily average (5 work days)
        const weeklyCapacity = WORK_MINUTES_PER_DAY * 5;
        const totalLoad = totalScheduledMinutes + totalTaskMinutes;
        const avgDailyLoad = totalLoad / 5;
        const loadPercent = totalLoad / weeklyCapacity;

        // Count critical/warning days
        let criticalDays = 0;
        let warningDays = 0;

        for (let d = 0; d < 5; d++) {
          const day = addDays(weekStart, d);
          const dayEvents = events.filter(
            (e) => e.startAt <= endOfDay(day) && e.endAt >= startOfDay(day)
          );
          const dayTasks = tasks.filter(
            (t) => t.dueAt && isSameWeek(t.dueAt, day) && t.dueAt <= endOfDay(day)
          );

          let dayMinutes = 0;
          dayEvents.forEach((e) => {
            const start = e.startAt < startOfDay(day) ? startOfDay(day) : e.startAt;
            const end = e.endAt > endOfDay(day) ? endOfDay(day) : e.endAt;
            dayMinutes += differenceInMinutes(end, start);
          });
          dayMinutes += dayTasks.reduce((s, t) => s + (t.plannedDuration || 30), 0);

          const dayLoadPercent = dayMinutes / WORK_MINUTES_PER_DAY;
          if (dayLoadPercent >= CRITICAL_THRESHOLD) criticalDays++;
          else if (dayLoadPercent >= WARNING_THRESHOLD) warningDays++;
        }

        const isCriticalWeek = criticalDays >= 3 || loadPercent >= CRITICAL_THRESHOLD;
        const isWarningWeek = criticalDays >= 2 || warningDays >= 3 || loadPercent >= WARNING_THRESHOLD;

        let recommendation: string | null = null;
        if (isCriticalWeek) {
          recommendation = "Semaine critique! Envisagez de reporter des taches non urgentes.";
        } else if (isWarningWeek) {
          recommendation = "Charge elevee cette semaine. Planifiez des pauses.";
        }

        weekAnalyses.push({
          weekStart,
          weekEnd,
          totalScheduledMinutes,
          totalTaskMinutes,
          avgDailyLoad,
          criticalDays,
          warningDays,
          isCriticalWeek,
          isWarningWeek,
          recommendation,
        });
      }

      return weekAnalyses;
    }),

  // Calculate perceived urgency for tasks
  getPerceivedUrgency: protectedProcedure
    .input(
      z.object({
        taskIds: z.array(z.string()).optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const tasks = await ctx.db.task.findMany({
        where: {
          userId,
          status: { in: ["TODO", "IN_PROGRESS"] },
          ...(input.taskIds ? { id: { in: input.taskIds } } : {}),
        },
        orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
        take: input.limit,
      });

      // Get user's available slots
      const today = new Date();
      const twoWeeksLater = addDays(today, 14);

      const events = await ctx.db.event.findMany({
        where: {
          userId,
          status: { not: "CANCELLED" },
          startAt: { lte: twoWeeksLater },
          endAt: { gte: today },
        },
      });

      // Calculate available minutes per day
      const availableMinutes: Record<string, number> = {};
      let currentDay = startOfDay(today);

      while (currentDay <= twoWeeksLater) {
        const dayStart = startOfDay(currentDay);
        const dayEnd = endOfDay(currentDay);
        const dayKey = dayStart.toISOString().split("T")[0];

        const dayEvents = events.filter(
          (e) => e.startAt <= dayEnd && e.endAt >= dayStart
        );

        let busyMinutes = 0;
        dayEvents.forEach((e) => {
          const start = e.startAt < dayStart ? dayStart : e.startAt;
          const end = e.endAt > dayEnd ? dayEnd : e.endAt;
          busyMinutes += differenceInMinutes(end, start);
        });

        availableMinutes[dayKey] = Math.max(0, WORK_MINUTES_PER_DAY - busyMinutes);
        currentDay = addDays(currentDay, 1);
      }

      // Calculate urgency for each task
      const urgencies: TaskUrgency[] = tasks.map((task) => {
        const factors: string[] = [];
        let urgencyScore = 0;

        const estimatedMinutes = task.plannedDuration || 30;

        // Factor 1: Time until deadline
        if (task.dueAt) {
          const hoursUntilDue = differenceInHours(task.dueAt, today);
          const daysUntilDue = differenceInDays(task.dueAt, today);

          if (hoursUntilDue < 0) {
            urgencyScore += 40;
            factors.push("Tache en retard");
          } else if (daysUntilDue === 0) {
            urgencyScore += 35;
            factors.push("Echeance aujourd'hui");
          } else if (daysUntilDue === 1) {
            urgencyScore += 25;
            factors.push("Echeance demain");
          } else if (daysUntilDue <= 3) {
            urgencyScore += 15;
            factors.push(`Echeance dans ${daysUntilDue} jours`);
          } else if (daysUntilDue <= 7) {
            urgencyScore += 8;
            factors.push("Echeance cette semaine");
          }
        }

        // Factor 2: Priority
        switch (task.priority) {
          case "URGENT":
            urgencyScore += 25;
            factors.push("Priorite urgente");
            break;
          case "HIGH":
            urgencyScore += 15;
            factors.push("Haute priorite");
            break;
          case "MEDIUM":
            urgencyScore += 5;
            break;
        }

        // Factor 3: Available slots vs estimated time
        if (task.dueAt) {
          const daysUntilDue = differenceInDays(task.dueAt, today);
          let totalAvailable = 0;

          for (let d = 0; d <= Math.min(daysUntilDue, 14); d++) {
            const dayKey = addDays(today, d).toISOString().split("T")[0];
            totalAvailable += availableMinutes[dayKey] || 0;
          }

          if (totalAvailable < estimatedMinutes) {
            urgencyScore += 20;
            factors.push("Pas assez de temps disponible");
          } else if (totalAvailable < estimatedMinutes * 1.5) {
            urgencyScore += 10;
            factors.push("Temps limite");
          }
        }

        // Factor 4: Task complexity (based on estimated duration)
        if (estimatedMinutes >= 180) {
          urgencyScore += 5;
          factors.push("Tache longue");
        }

        // Normalize to 0-100
        urgencyScore = Math.min(100, Math.max(0, urgencyScore));

        // Determine level
        let urgencyLevel: "low" | "medium" | "high" | "critical";
        if (urgencyScore >= 70) urgencyLevel = "critical";
        else if (urgencyScore >= 50) urgencyLevel = "high";
        else if (urgencyScore >= 25) urgencyLevel = "medium";
        else urgencyLevel = "low";

        // Generate suggestion
        let suggestedAction: string;
        if (urgencyLevel === "critical") {
          suggestedAction = "A traiter immediatement";
        } else if (urgencyLevel === "high") {
          suggestedAction = "Planifiez cette tache aujourd'hui";
        } else if (urgencyLevel === "medium") {
          suggestedAction = "A programmer cette semaine";
        } else {
          suggestedAction = "Peut attendre";
        }

        return {
          taskId: task.id,
          title: task.title,
          dueAt: task.dueAt,
          estimatedMinutes,
          perceivedUrgency: urgencyScore,
          urgencyLevel,
          factors,
          suggestedAction,
        };
      });

      // Sort by urgency
      urgencies.sort((a, b) => b.perceivedUrgency - a.perceivedUrgency);

      return urgencies;
    }),

  // Get overload alerts
  getAlerts: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const today = new Date();
    const nextWeek = addWeeks(today, 1);
    const alerts: Array<{
      type: "critical" | "warning" | "info";
      title: string;
      message: string;
      date?: Date;
    }> = [];

    // Check today's load
    const todayEvents = await ctx.db.event.count({
      where: {
        userId,
        status: { not: "CANCELLED" },
        startAt: { lte: endOfDay(today) },
        endAt: { gte: startOfDay(today) },
      },
    });

    const todayTasks = await ctx.db.task.count({
      where: {
        userId,
        status: { not: "DONE" },
        dueAt: { gte: startOfDay(today), lte: endOfDay(today) },
      },
    });

    if (todayEvents >= 6 || todayTasks >= 8) {
      alerts.push({
        type: "critical",
        title: "Journee surchargee",
        message: `Vous avez ${todayEvents} evenements et ${todayTasks} taches aujourd'hui`,
        date: today,
      });
    } else if (todayEvents >= 4 || todayTasks >= 5) {
      alerts.push({
        type: "warning",
        title: "Journee chargee",
        message: "Pensez a prioriser vos taches",
        date: today,
      });
    }

    // Check overdue tasks
    const overdueTasks = await ctx.db.task.count({
      where: {
        userId,
        status: { not: "DONE" },
        dueAt: { lt: startOfDay(today) },
      },
    });

    if (overdueTasks > 0) {
      alerts.push({
        type: "critical",
        title: "Taches en retard",
        message: `${overdueTasks} tache(s) en retard`,
      });
    }

    // Check upcoming critical days
    const weekStart = startOfWeek(nextWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(nextWeek, { weekStartsOn: 1 });

    const nextWeekEvents = await ctx.db.event.findMany({
      where: {
        userId,
        status: { not: "CANCELLED" },
        startAt: { gte: weekStart, lte: weekEnd },
      },
    });

    const nextWeekTasks = await ctx.db.task.findMany({
      where: {
        userId,
        status: { not: "DONE" },
        dueAt: { gte: weekStart, lte: weekEnd },
      },
    });

    if (nextWeekEvents.length >= 15 || nextWeekTasks.length >= 20) {
      alerts.push({
        type: "warning",
        title: "Semaine prochaine chargee",
        message: "Preparez-vous pour une semaine intense",
        date: weekStart,
      });
    }

    return alerts;
  }),
});
