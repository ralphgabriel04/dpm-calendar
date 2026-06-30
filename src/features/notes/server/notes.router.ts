import { z } from "zod";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";
import { TRPCError } from "@trpc/server";

/**
 * Standalone markdown notes, optionally linked to a task or event.
 * All access is scoped to the authenticated user (and enforced again at the DB
 * layer by Row Level Security — see prisma migrations/*_add_rls_policies).
 */
export const notesRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          tags: z.array(z.string()).optional(),
          taskId: z.string().optional(),
          eventId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const f = input ?? {};
      return ctx.db.note.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(f.taskId ? { taskId: f.taskId } : {}),
          ...(f.eventId ? { eventId: f.eventId } : {}),
          ...(f.tags && f.tags.length ? { tags: { hasSome: f.tags } } : {}),
          ...(f.search
            ? {
                OR: [
                  { title: { contains: f.search, mode: "insensitive" } },
                  { content: { contains: f.search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const note = await ctx.db.note.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!note) throw new TRPCError({ code: "NOT_FOUND" });
      return note;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().max(200).default(""),
        content: z.string().default(""),
        tags: z.array(z.string()).default([]),
        taskId: z.string().optional(),
        eventId: z.string().optional(),
        isPinned: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // A note may only link to the caller's own task/event.
      if (input.taskId) {
        const task = await ctx.db.task.findFirst({
          where: { id: input.taskId, userId: ctx.session.user.id },
          select: { id: true },
        });
        if (!task)
          throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      if (input.eventId) {
        const event = await ctx.db.event.findFirst({
          where: { id: input.eventId, userId: ctx.session.user.id },
          select: { id: true },
        });
        if (!event)
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }
      return ctx.db.note.create({
        data: { ...input, userId: ctx.session.user.id },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().max(200).optional(),
        content: z.string().optional(),
        tags: z.array(z.string()).optional(),
        taskId: z.string().nullable().optional(),
        eventId: z.string().nullable().optional(),
        isPinned: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await ctx.db.note.findFirst({
        where: { id, userId: ctx.session.user.id },
        select: { id: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.note.update({ where: { id }, data });
    }),

  togglePin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db.note.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        select: { id: true, isPinned: true },
      });
      if (!note) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.note.update({
        where: { id: input.id },
        data: { isPinned: !note.isPinned },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db.note.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        select: { id: true },
      });
      if (!note) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.note.delete({ where: { id: input.id } });
    }),
});
