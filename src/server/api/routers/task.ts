import { z } from "zod";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";
import { TRPCError } from "@trpc/server";

const taskCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  notes: z.string().optional(),
  url: z.string().url().optional(),
  dueAt: z.coerce.date().optional(),
  plannedStartAt: z.coerce.date().optional(),
  plannedDuration: z.number().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  parentTaskId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  estimatedEnergy: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

export const taskRouter = createTRPCRouter({
  // List tasks with filters
  list: protectedProcedure
    .input(
      z.object({
        status: z
          .array(z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]))
          .optional(),
        priority: z
          .array(z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]))
          .optional(),
        parentTaskId: z.string().nullable().optional(),
        dueBefore: z.coerce.date().optional(),
        dueAfter: z.coerce.date().optional(),
        search: z.string().optional(),
        includeCompleted: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Build where clause
      const whereClause: Record<string, unknown> = {
        userId: ctx.session.user.id,
      };

      // Status filter
      if (input.status && input.status.length > 0) {
        whereClause.status = { in: input.status };
      } else if (!input.includeCompleted) {
        whereClause.status = { not: "DONE" };
      }

      // Priority filter
      if (input.priority && input.priority.length > 0) {
        whereClause.priority = { in: input.priority };
      }

      // Parent task filter
      if (input.parentTaskId !== undefined) {
        whereClause.parentTaskId = input.parentTaskId;
      }

      // Date filters
      if (input.dueBefore) {
        whereClause.dueAt = { ...((whereClause.dueAt as object) || {}), lte: input.dueBefore };
      }
      if (input.dueAfter) {
        whereClause.dueAt = { ...((whereClause.dueAt as object) || {}), gte: input.dueAfter };
      }

      // Search filter
      if (input.search) {
        whereClause.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
        ];
      }

      // Tags filter
      if (input.tags && input.tags.length > 0) {
        whereClause.tags = { hasSome: input.tags };
      }

      return ctx.db.task.findMany({
        where: whereClause,
        include: {
          subtasks: {
            orderBy: { position: "asc" },
          },
          linkedEvent: true,
          checklistItems: {
            orderBy: { position: "asc" },
          },
        },
        orderBy: [{ priority: "desc" }, { dueAt: "asc" }, { position: "asc" }],
      });
    }),

  // Get single task
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          subtasks: {
            orderBy: { position: "asc" },
          },
          linkedEvent: true,
          parentTask: true,
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return task;
    }),

  // Create task
  create: protectedProcedure
    .input(taskCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Get max position for ordering
      const maxPosition = await ctx.db.task.aggregate({
        where: {
          userId: ctx.session.user.id,
          parentTaskId: input.parentTaskId || null,
        },
        _max: { position: true },
      });

      return ctx.db.task.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
          position: (maxPosition._max.position || 0) + 1,
        },
      });
    }),

  // Update task
  update: protectedProcedure
    .input(
      taskCreateSchema.partial().extend({
        id: z.string(),
        status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const task = await ctx.db.task.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Handle status change to DONE
      const updateData: Record<string, unknown> = { ...data };
      if (data.status) {
        updateData.completedAt = data.status === "DONE" ? new Date() : null;
      }

      return ctx.db.task.update({
        where: { id },
        data: updateData,
      });
    }),

  // Delete task
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.task.delete({
        where: { id: input.id },
      });
    }),

  // Toggle task status (quick complete/uncomplete)
  toggle: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const newStatus = task.status === "DONE" ? "TODO" : "DONE";

      return ctx.db.task.update({
        where: { id: input.id },
        data: {
          status: newStatus,
          completedAt: newStatus === "DONE" ? new Date() : null,
        },
      });
    }),

  // Convert task to event (time blocking)
  convertToEvent: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        calendarId: z.string(),
        startAt: z.coerce.date(),
        endAt: z.coerce.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.taskId, userId: ctx.session.user.id },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const calendar = await ctx.db.calendar.findFirst({
        where: { id: input.calendarId, userId: ctx.session.user.id },
      });

      if (!calendar) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Calendar not found" });
      }

      const duration = Math.round(
        (input.endAt.getTime() - input.startAt.getTime()) / 60000
      );

      // Create event
      const event = await ctx.db.event.create({
        data: {
          userId: ctx.session.user.id,
          calendarId: input.calendarId,
          title: task.title,
          description: task.description,
          startAt: input.startAt,
          endAt: input.endAt,
          duration,
          provider: "LOCAL",
        },
      });

      // Link task to event
      await ctx.db.task.update({
        where: { id: input.taskId },
        data: {
          linkedEventId: event.id,
          plannedStartAt: input.startAt,
          plannedDuration: duration,
        },
      });

      return event;
    }),

  // Schedule task on calendar (time blocking)
  scheduleTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        startAt: z.coerce.date(),
        endAt: z.coerce.date(),
        calendarId: z.string().optional(),
        createEvent: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.taskId, userId: ctx.session.user.id },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const duration = Math.round(
        (input.endAt.getTime() - input.startAt.getTime()) / 60000
      );

      // Update task with planned time
      await ctx.db.task.update({
        where: { id: input.taskId },
        data: {
          plannedStartAt: input.startAt,
          plannedDuration: duration,
        },
      });

      // Create TimeBlock
      const timeBlock = await ctx.db.timeBlock.create({
        data: {
          taskId: input.taskId,
          startAt: input.startAt,
          endAt: input.endAt,
          duration,
          status: "SCHEDULED",
        },
      });

      // Optionally create linked Event
      if (input.createEvent && input.calendarId) {
        const calendar = await ctx.db.calendar.findFirst({
          where: { id: input.calendarId, userId: ctx.session.user.id },
        });

        if (calendar) {
          const event = await ctx.db.event.create({
            data: {
              userId: ctx.session.user.id,
              calendarId: input.calendarId,
              title: task.title,
              description: task.description,
              startAt: input.startAt,
              endAt: input.endAt,
              duration,
              provider: "LOCAL",
            },
          });

          // Update timeBlock with eventId
          await ctx.db.timeBlock.update({
            where: { id: timeBlock.id },
            data: { eventId: event.id },
          });

          // Update task with linkedEventId
          await ctx.db.task.update({
            where: { id: input.taskId },
            data: { linkedEventId: event.id },
          });

          return { task, timeBlock, event };
        }
      }

      return { task, timeBlock };
    }),

  // Get time blocks for a date range
  getTimeBlocks: protectedProcedure
    .input(
      z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.timeBlock.findMany({
        where: {
          task: {
            userId: ctx.session.user.id,
          },
          startAt: { gte: input.startDate },
          endAt: { lte: input.endDate },
        },
        include: {
          task: true,
        },
        orderBy: { startAt: "asc" },
      });
    }),

  // Get unscheduled tasks (tasks without plannedStartAt)
  getUnscheduled: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.task.findMany({
      where: {
        userId: ctx.session.user.id,
        plannedStartAt: null,
        status: { notIn: ["DONE", "CANCELLED"] },
      },
      include: {
        checklistItems: {
          orderBy: { position: "asc" },
        },
      },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
    });
  }),

  // Reorder tasks
  reorder: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        newPosition: z.number(),
        newParentId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const task = await tx.task.findFirst({
          where: { id: input.taskId, userId: ctx.session.user.id },
        });

        if (!task) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Shift other tasks
        await tx.task.updateMany({
          where: {
            userId: ctx.session.user.id,
            parentTaskId: input.newParentId ?? null,
            position: { gte: input.newPosition },
          },
          data: { position: { increment: 1 } },
        });

        // Update task position
        return tx.task.update({
          where: { id: input.taskId },
          data: {
            position: input.newPosition,
            parentTaskId: input.newParentId,
          },
        });
      });
    }),

  // Update actual duration (for focus timer)
  updateActualDuration: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        additionalMinutes: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.taskId, userId: ctx.session.user.id },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.task.update({
        where: { id: input.taskId },
        data: {
          actualDuration: (task.actualDuration || 0) + input.additionalMinutes,
        },
      });
    }),

  // Get all unique tags
  getTags: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await ctx.db.task.findMany({
      where: { userId: ctx.session.user.id },
      select: { tags: true },
    });

    const allTags = tasks.flatMap((t) => t.tags);
    return Array.from(new Set(allTags)).sort();
  }),

  // ============================================
  // CHECKLIST ITEMS
  // ============================================

  // Add checklist item
  addChecklistItem: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        title: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.taskId, userId: ctx.session.user.id },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Get max position
      const maxPosition = await ctx.db.checklistItem.aggregate({
        where: { taskId: input.taskId },
        _max: { position: true },
      });

      return ctx.db.checklistItem.create({
        data: {
          taskId: input.taskId,
          title: input.title,
          position: (maxPosition._max.position || 0) + 1,
        },
      });
    }),

  // Toggle checklist item
  toggleChecklistItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.checklistItem.findFirst({
        where: { id: input.id },
        include: { task: true },
      });

      if (!item || item.task.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.checklistItem.update({
        where: { id: input.id },
        data: { isCompleted: !item.isCompleted },
      });
    }),

  // Delete checklist item
  deleteChecklistItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.checklistItem.findFirst({
        where: { id: input.id },
        include: { task: true },
      });

      if (!item || item.task.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.checklistItem.delete({
        where: { id: input.id },
      });
    }),

  // Get checklist items for a task
  getChecklistItems: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.taskId, userId: ctx.session.user.id },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.checklistItem.findMany({
        where: { taskId: input.taskId },
        orderBy: { position: "asc" },
      });
    }),
});
