import { db } from "@/infrastructure/db/client";
import {
  startOfDay,
  endOfDay,
  addMinutes,
  setHours,
  setMinutes,
  isBefore,
  isAfter,
  differenceInMinutes,
} from "date-fns";

// Types
export interface TimeBlockProposal {
  taskId: string;
  taskTitle: string;
  startAt: Date;
  endAt: Date;
  duration: number;
  score: number;
  reason: string;
  energyMatch: "optimal" | "good" | "acceptable";
}

export interface DayPlan {
  date: Date;
  proposals: TimeBlockProposal[];
  unscheduled: { taskId: string; title: string; reason: string }[];
  confidence: number;
  totalMinutesPlanned: number;
  availableMinutes: number;
}

export interface CalibratedEstimate {
  taskId: string;
  plannedDuration: number;
  p50: number;
  p80: number;
  suggested: number;
  sampleSize: number;
  calibrationFactor: number;
}

interface BusySlot {
  start: Date;
  end: Date;
  type: "event" | "focus" | "timeblock";
  immovable: boolean;
}

interface AvailableSlot {
  start: Date;
  end: Date;
  energyLevel: "HIGH" | "MEDIUM" | "LOW";
  score: number;
}

// Energy level mapping by hour (based on typical circadian rhythms)
const DEFAULT_ENERGY_BY_HOUR: Record<number, "HIGH" | "MEDIUM" | "LOW"> = {
  6: "MEDIUM",
  7: "MEDIUM",
  8: "HIGH",
  9: "HIGH",
  10: "HIGH",
  11: "HIGH",
  12: "MEDIUM",
  13: "LOW",
  14: "MEDIUM",
  15: "MEDIUM",
  16: "MEDIUM",
  17: "LOW",
  18: "LOW",
  19: "LOW",
  20: "LOW",
  21: "LOW",
};

// Focus tag used to identify focus blocks
const FOCUS_TAG = "focus";

/**
 * Plan the day by auto-scheduling unscheduled tasks
 */
export async function planMyDay(
  userId: string,
  date: Date
): Promise<DayPlan> {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // 1. Fetch user preferences
  const userPrefs = await db.userPreferences.findUnique({
    where: { userId },
  });

  const workStart = userPrefs?.workingHoursStart
    ? parseInt(userPrefs.workingHoursStart.split(":")[0], 10)
    : 9;
  const workEnd = userPrefs?.workingHoursEnd
    ? parseInt(userPrefs.workingHoursEnd.split(":")[0], 10)
    : 18;

  // 2. Fetch unscheduled tasks (no time blocks assigned for this date)
  const allTasks = await db.task.findMany({
    where: {
      userId,
      status: { in: ["TODO", "IN_PROGRESS"] },
      OR: [
        { dueAt: { gte: dayStart, lte: addMinutes(dayEnd, 7 * 24 * 60) } }, // Due within 7 days
        { dueAt: null }, // No due date
      ],
    },
    include: {
      timeBlocks: {
        where: {
          startAt: { gte: dayStart, lte: dayEnd },
          status: { not: "CANCELLED" },
        },
      },
    },
    orderBy: [
      { priority: "desc" },
      { dueAt: "asc" },
    ],
  });

  const unscheduledTasks = allTasks.filter(
    (t) => t.timeBlocks.length === 0 && (t.plannedDuration || 30) > 0
  );

  // 3. Fetch constraints (events and existing time blocks)
  const events = await db.event.findMany({
    where: {
      userId,
      status: { not: "CANCELLED" },
      startAt: { gte: dayStart, lte: dayEnd },
    },
  });

  // Fetch all existing time blocks with their tasks (to check for focus tag)
  const existingBlocks = await db.timeBlock.findMany({
    where: {
      task: { userId },
      status: { not: "CANCELLED" },
      startAt: { gte: dayStart, lte: dayEnd },
    },
    include: {
      task: {
        select: { id: true, title: true, tags: true },
      },
    },
  });

  // 4. Build busy slots
  // Focus blocks are identified by tasks with "focus" tag - they are immovable
  const focusBlocks = existingBlocks.filter(
    (eb) => eb.task.tags.includes(FOCUS_TAG)
  );
  const regularBlocks = existingBlocks.filter(
    (eb) => !eb.task.tags.includes(FOCUS_TAG)
  );

  const busySlots: BusySlot[] = [
    ...events.map((e) => ({
      start: e.startAt,
      end: e.endAt,
      type: "event" as const,
      immovable: true,
    })),
    ...focusBlocks.map((fb) => ({
      start: fb.startAt,
      end: fb.endAt,
      type: "focus" as const,
      immovable: true,
    })),
    ...regularBlocks.map((eb) => ({
      start: eb.startAt,
      end: eb.endAt,
      type: "timeblock" as const,
      immovable: false,
    })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  // 5. Find available slots
  const availableSlots = findAvailableSlots(
    dayStart,
    workStart,
    workEnd,
    busySlots
  );

  // 6. Fetch energy patterns to refine energy mapping
  const energyByHour = await getUserEnergyPatterns(userId, workStart, workEnd);

  // 7. Match tasks to slots based on energy + priority
  const proposals: TimeBlockProposal[] = [];
  const unscheduled: { taskId: string; title: string; reason: string }[] = [];
  const usedSlots: { start: Date; end: Date }[] = [];

  for (const task of unscheduledTasks) {
    const duration = task.plannedDuration || 30;
    const taskEnergy = task.estimatedEnergy || "MEDIUM";

    // Find best slot for this task
    const bestSlot = findBestSlotForTask(
      availableSlots,
      usedSlots,
      duration,
      taskEnergy,
      energyByHour,
      task.priority || "MEDIUM",
      task.dueAt
    );

    if (bestSlot) {
      proposals.push({
        taskId: task.id,
        taskTitle: task.title,
        startAt: bestSlot.start,
        endAt: addMinutes(bestSlot.start, duration),
        duration,
        score: bestSlot.score,
        reason: bestSlot.reason,
        energyMatch: bestSlot.energyMatch,
      });

      // Mark slot as used
      usedSlots.push({
        start: bestSlot.start,
        end: addMinutes(bestSlot.start, duration),
      });
    } else {
      unscheduled.push({
        taskId: task.id,
        title: task.title,
        reason: `Pas de créneau disponible pour ${duration} minutes`,
      });
    }
  }

  // Sort proposals by start time
  proposals.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  // Calculate totals
  const totalMinutesPlanned = proposals.reduce((sum, p) => sum + p.duration, 0);
  const availableMinutes = availableSlots.reduce(
    (sum, s) => sum + differenceInMinutes(s.end, s.start),
    0
  );

  // Calculate confidence based on how well we matched energy levels
  const avgScore =
    proposals.length > 0
      ? proposals.reduce((sum, p) => sum + p.score, 0) / proposals.length
      : 0;
  const scheduledRatio =
    unscheduledTasks.length > 0
      ? proposals.length / unscheduledTasks.length
      : 1;
  const confidence = Math.round((avgScore / 100) * scheduledRatio * 100) / 100;

  return {
    date,
    proposals,
    unscheduled,
    confidence,
    totalMinutesPlanned,
    availableMinutes,
  };
}

/**
 * Get calibrated duration estimate for a task
 */
export async function getCalibratedEstimate(
  userId: string,
  taskId: string
): Promise<CalibratedEstimate> {
  const task = await db.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const plannedDuration = task.plannedDuration || 30;

  // Find similar completed tasks for calibration
  // Similar = same tags (for grouping by type)
  const taskTags = task.tags || [];

  const completedTasks = await db.task.findMany({
    where: {
      userId,
      status: "DONE",
      actualDuration: { not: null },
      // If task has tags, find tasks with overlapping tags
      ...(taskTags.length > 0 ? { tags: { hasSome: taskTags } } : {}),
    },
    select: {
      plannedDuration: true,
      actualDuration: true,
    },
    orderBy: { completedAt: "desc" },
    take: 50,
  });

  if (completedTasks.length < 3) {
    // Not enough data, return defaults with buffer
    return {
      taskId,
      plannedDuration,
      p50: plannedDuration,
      p80: Math.round(plannedDuration * 1.3),
      suggested: Math.round(plannedDuration * 1.15),
      sampleSize: completedTasks.length,
      calibrationFactor: 1.0,
    };
  }

  // Calculate calibration ratios (actual / planned)
  const ratios = completedTasks
    .filter((t) => t.plannedDuration && t.actualDuration)
    .map((t) => t.actualDuration! / t.plannedDuration!);

  ratios.sort((a, b) => a - b);

  // Calculate percentiles
  const p50Index = Math.floor(ratios.length * 0.5);
  const p80Index = Math.floor(ratios.length * 0.8);

  const p50Ratio = ratios[p50Index] || 1;
  const p80Ratio = ratios[p80Index] || 1.3;

  const p50 = Math.round(plannedDuration * p50Ratio);
  const p80 = Math.round(plannedDuration * p80Ratio);
  const suggested = Math.round(p50 + (p80 - p50) * 0.3);

  return {
    taskId,
    plannedDuration,
    p50,
    p80,
    suggested,
    sampleSize: completedTasks.length,
    calibrationFactor: p50Ratio,
  };
}

/**
 * Reschedule blocks after a shift
 */
export async function rescheduleAfterShift(
  userId: string,
  shiftedBlockId: string,
  deltaMinutes: number
): Promise<{ affected: TimeBlockProposal[]; conflicts: string[] }> {
  const shiftedBlock = await db.timeBlock.findFirst({
    where: { id: shiftedBlockId, task: { userId } },
    include: { task: true },
  });

  if (!shiftedBlock) {
    throw new Error("Time block not found");
  }

  const date = startOfDay(shiftedBlock.startAt);
  const dayEnd = endOfDay(date);

  // Find all blocks after the shifted one (excluding focus blocks)
  const downstreamBlocks = await db.timeBlock.findMany({
    where: {
      task: { userId },
      status: { not: "CANCELLED" },
      startAt: { gt: shiftedBlock.startAt, lte: dayEnd },
    },
    include: { task: { select: { id: true, title: true, tags: true } } },
    orderBy: { startAt: "asc" },
  });

  // Filter out focus blocks (they are immovable)
  const movableBlocks = downstreamBlocks.filter(
    (b) => !b.task.tags.includes(FOCUS_TAG)
  );

  const affected: TimeBlockProposal[] = [];
  const conflicts: string[] = [];

  // Check each downstream block
  const currentShift = deltaMinutes;

  for (const block of movableBlocks) {
    const newStart = addMinutes(block.startAt, currentShift);
    const newEnd = addMinutes(block.endAt, currentShift);

    // Check if new time conflicts with immovable blocks
    const hasConflict = await checkForConflicts(
      userId,
      date,
      newStart,
      newEnd,
      block.id
    );

    if (hasConflict) {
      conflicts.push(block.task.title);
    } else {
      affected.push({
        taskId: block.taskId,
        taskTitle: block.task.title,
        startAt: newStart,
        endAt: newEnd,
        duration: differenceInMinutes(newEnd, newStart),
        score: 70,
        reason: "Décalé suite au changement d'horaire",
        energyMatch: "good",
      });
    }
  }

  return { affected, conflicts };
}

// Helper functions

function findAvailableSlots(
  dayStart: Date,
  workStart: number,
  workEnd: number,
  busySlots: BusySlot[]
): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  const now = new Date();

  let currentTime = setMinutes(setHours(dayStart, workStart), 0);
  const endTime = setMinutes(setHours(dayStart, workEnd), 0);

  // If today, start from now (rounded to next 15 min)
  if (startOfDay(dayStart).getTime() === startOfDay(now).getTime()) {
    if (isBefore(currentTime, now)) {
      currentTime = now;
      const mins = currentTime.getMinutes();
      if (mins % 15 !== 0) {
        currentTime = addMinutes(currentTime, 15 - (mins % 15));
      }
    }
  }

  for (const busy of busySlots) {
    if (isAfter(currentTime, busy.start)) {
      currentTime = busy.end;
      const mins = currentTime.getMinutes();
      if (mins % 15 !== 0) {
        currentTime = addMinutes(currentTime, 15 - (mins % 15));
      }
      continue;
    }

    if (isBefore(currentTime, busy.start)) {
      const slotDuration = differenceInMinutes(busy.start, currentTime);
      if (slotDuration >= 15) {
        const hour = currentTime.getHours();
        slots.push({
          start: currentTime,
          end: busy.start,
          energyLevel: DEFAULT_ENERGY_BY_HOUR[hour] || "MEDIUM",
          score: calculateBaseSlotScore(hour),
        });
      }
    }

    currentTime = busy.end;
    const mins = currentTime.getMinutes();
    if (mins % 15 !== 0) {
      currentTime = addMinutes(currentTime, 15 - (mins % 15));
    }
  }

  // Add remaining time
  if (isBefore(currentTime, endTime)) {
    const slotDuration = differenceInMinutes(endTime, currentTime);
    if (slotDuration >= 15) {
      const hour = currentTime.getHours();
      slots.push({
        start: currentTime,
        end: endTime,
        energyLevel: DEFAULT_ENERGY_BY_HOUR[hour] || "MEDIUM",
        score: calculateBaseSlotScore(hour),
      });
    }
  }

  return slots;
}

function calculateBaseSlotScore(hour: number): number {
  // Peak morning hours
  if (hour >= 9 && hour <= 11) return 90;
  // Good afternoon
  if (hour >= 14 && hour <= 16) return 75;
  // Early morning
  if (hour >= 7 && hour < 9) return 70;
  // Late afternoon
  if (hour >= 16 && hour <= 18) return 60;
  // Post-lunch slump
  if (hour >= 12 && hour < 14) return 50;
  // Other times
  return 40;
}

async function getUserEnergyPatterns(
  userId: string,
  workStart: number,
  workEnd: number
): Promise<Record<number, "HIGH" | "MEDIUM" | "LOW">> {
  const thirtyDaysAgo = addMinutes(new Date(), -30 * 24 * 60);

  const energyLogs = await db.energyLog.findMany({
    where: {
      userId,
      timestamp: { gte: thirtyDaysAgo },
    },
  });

  if (energyLogs.length < 10) {
    return DEFAULT_ENERGY_BY_HOUR;
  }

  // Group by hour and calculate averages
  const hourlyData: Record<number, { sum: number; count: number }> = {};

  for (const log of energyLogs) {
    const hour = new Date(log.timestamp).getHours();
    if (hour >= workStart && hour < workEnd) {
      if (!hourlyData[hour]) {
        hourlyData[hour] = { sum: 0, count: 0 };
      }
      hourlyData[hour].sum += log.energyLevel;
      hourlyData[hour].count += 1;
    }
  }

  const result: Record<number, "HIGH" | "MEDIUM" | "LOW"> = {
    ...DEFAULT_ENERGY_BY_HOUR,
  };

  for (const [hour, data] of Object.entries(hourlyData)) {
    const avg = data.sum / data.count;
    // Energy scale is 1-5, map to levels
    if (avg >= 4) {
      result[parseInt(hour, 10)] = "HIGH";
    } else if (avg >= 2.5) {
      result[parseInt(hour, 10)] = "MEDIUM";
    } else {
      result[parseInt(hour, 10)] = "LOW";
    }
  }

  return result;
}

function findBestSlotForTask(
  availableSlots: AvailableSlot[],
  usedSlots: { start: Date; end: Date }[],
  duration: number,
  taskEnergy: string,
  energyByHour: Record<number, "HIGH" | "MEDIUM" | "LOW">,
  priority: string,
  dueAt: Date | null
): { start: Date; score: number; reason: string; energyMatch: "optimal" | "good" | "acceptable" } | null {
  let bestResult: {
    start: Date;
    score: number;
    reason: string;
    energyMatch: "optimal" | "good" | "acceptable";
  } | null = null;

  for (const slot of availableSlots) {
    // Find valid start times within this slot
    let checkTime = slot.start;
    while (differenceInMinutes(slot.end, checkTime) >= duration) {
      // Check if this time overlaps with already used slots
      const overlapsUsed = usedSlots.some((used) => {
        const potentialEnd = addMinutes(checkTime, duration);
        return (
          (checkTime >= used.start && checkTime < used.end) ||
          (potentialEnd > used.start && potentialEnd <= used.end) ||
          (checkTime <= used.start && potentialEnd >= used.end)
        );
      });

      if (!overlapsUsed) {
        const hour = checkTime.getHours();
        const slotEnergy = energyByHour[hour] || "MEDIUM";

        // Calculate energy match score
        let energyScore = 0;
        let energyMatch: "optimal" | "good" | "acceptable" = "acceptable";

        if (taskEnergy === slotEnergy) {
          energyScore = 30;
          energyMatch = "optimal";
        } else if (
          (taskEnergy === "HIGH" && slotEnergy === "MEDIUM") ||
          (taskEnergy === "MEDIUM" && slotEnergy === "HIGH") ||
          (taskEnergy === "MEDIUM" && slotEnergy === "LOW") ||
          (taskEnergy === "LOW" && slotEnergy === "MEDIUM")
        ) {
          energyScore = 15;
          energyMatch = "good";
        } else {
          energyScore = 5;
          energyMatch = "acceptable";
        }

        // Priority bonus
        let priorityBonus = 0;
        if (priority === "URGENT") priorityBonus = 20;
        else if (priority === "HIGH") priorityBonus = 10;
        else if (priority === "MEDIUM") priorityBonus = 5;

        // Due date urgency
        let urgencyBonus = 0;
        if (dueAt) {
          const hoursUntilDue = differenceInMinutes(dueAt, new Date()) / 60;
          if (hoursUntilDue < 24) urgencyBonus = 15;
          else if (hoursUntilDue < 48) urgencyBonus = 10;
          else if (hoursUntilDue < 72) urgencyBonus = 5;
        }

        const totalScore =
          slot.score + energyScore + priorityBonus + urgencyBonus;

        if (!bestResult || totalScore > bestResult.score) {
          let reason = "";
          if (energyMatch === "optimal") {
            reason = `Niveau d'énergie optimal (${slotEnergy.toLowerCase()})`;
          } else if (energyMatch === "good") {
            reason = `Bon niveau d'énergie`;
          } else {
            reason = `Créneau disponible`;
          }

          if (priority === "URGENT" || priority === "HIGH") {
            reason += ` • Priorité ${priority.toLowerCase()}`;
          }

          bestResult = {
            start: checkTime,
            score: totalScore,
            reason,
            energyMatch,
          };
        }
      }

      // Move to next 15-minute slot
      checkTime = addMinutes(checkTime, 15);
    }
  }

  return bestResult;
}

async function checkForConflicts(
  userId: string,
  date: Date,
  start: Date,
  end: Date,
  excludeBlockId: string
): Promise<boolean> {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // Check events
  const conflictingEvent = await db.event.findFirst({
    where: {
      userId,
      status: { not: "CANCELLED" },
      startAt: { gte: dayStart, lte: dayEnd },
      OR: [
        { startAt: { gte: start, lt: end } },
        { endAt: { gt: start, lte: end } },
        {
          AND: [{ startAt: { lte: start } }, { endAt: { gte: end } }],
        },
      ],
    },
  });

  if (conflictingEvent) return true;

  // Check focus blocks (blocks with focus tag)
  const conflictingFocusBlocks = await db.timeBlock.findMany({
    where: {
      task: { userId },
      status: { not: "CANCELLED" },
      id: { not: excludeBlockId },
      startAt: { gte: dayStart, lte: dayEnd },
      OR: [
        { startAt: { gte: start, lt: end } },
        { endAt: { gt: start, lte: end } },
        {
          AND: [{ startAt: { lte: start } }, { endAt: { gte: end } }],
        },
      ],
    },
    include: { task: { select: { tags: true } } },
  });

  // Check if any of them is a focus block
  return conflictingFocusBlocks.some((b) => b.task.tags.includes(FOCUS_TAG));
}
