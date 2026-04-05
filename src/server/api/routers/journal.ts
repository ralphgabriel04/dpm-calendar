import { z } from "zod";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";
import { TRPCError } from "@trpc/server";
import { startOfDay } from "date-fns";

export const journalRouter = createTRPCRouter({
  // List entries
  list: protectedProcedure
    .input(
      z.object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        tags: z.array(z.string()).optional(),
        limit: z.number().min(1).max(100).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.journalEntry.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.startDate ? { date: { gte: input.startDate } } : {}),
          ...(input.endDate ? { date: { lte: input.endDate } } : {}),
          ...(input.tags && input.tags.length > 0 ? { tags: { hasSome: input.tags } } : {}),
        },
        orderBy: { date: "desc" },
        take: input.limit,
      });
    }),

  // Get entry by date
  getByDate: protectedProcedure
    .input(z.object({ date: z.coerce.date() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.journalEntry.findFirst({
        where: {
          userId: ctx.session.user.id,
          date: startOfDay(input.date),
        },
      });
    }),

  // Create or update entry
  upsert: protectedProcedure
    .input(
      z.object({
        date: z.coerce.date(),
        content: z.string().min(1),
        prompt: z.string().optional(),
        mood: z.number().min(1).max(5).optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dateOnly = startOfDay(input.date);

      const existing = await ctx.db.journalEntry.findFirst({
        where: {
          userId: ctx.session.user.id,
          date: dateOnly,
        },
      });

      if (existing) {
        return ctx.db.journalEntry.update({
          where: { id: existing.id },
          data: {
            content: input.content,
            prompt: input.prompt,
            mood: input.mood,
            tags: input.tags,
          },
        });
      }

      return ctx.db.journalEntry.create({
        data: {
          userId: ctx.session.user.id,
          date: dateOnly,
          content: input.content,
          prompt: input.prompt,
          mood: input.mood,
          tags: input.tags ?? [],
        },
      });
    }),

  // Delete entry
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.db.journalEntry.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.journalEntry.delete({
        where: { id: input.id },
      });
    }),

  // Log energy
  logEnergy: protectedProcedure
    .input(
      z.object({
        energyLevel: z.number().min(1).max(5),
        mood: z.number().min(1).max(5).optional(),
        stress: z.number().min(1).max(5).optional(),
        focus: z.number().min(1).max(5).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.energyLog.create({
        data: {
          userId: ctx.session.user.id,
          ...input,
        },
      });
    }),

  // Get energy logs
  getEnergyLogs: protectedProcedure
    .input(
      z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.energyLog.findMany({
        where: {
          userId: ctx.session.user.id,
          timestamp: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        orderBy: { timestamp: "asc" },
      });
    }),

  // Get prompts
  getPrompts: protectedProcedure.query(() => {
    return [
      "Qu'est-ce qui s'est bien passé aujourd'hui ?",
      "Quel est le plus grand défi que j'ai relevé ?",
      "Pour quoi suis-je reconnaissant(e) ?",
      "Qu'ai-je appris aujourd'hui ?",
      "Comment puis-je m'améliorer demain ?",
      "Quel moment m'a rendu heureux(se) ?",
      "Quelle habitude ai-je bien maintenue ?",
      "Qu'est-ce qui m'a stressé et comment l'ai-je géré ?",
    ];
  }),

  // Get tags
  getTags: protectedProcedure.query(async ({ ctx }) => {
    const entries = await ctx.db.journalEntry.findMany({
      where: { userId: ctx.session.user.id },
      select: { tags: true },
    });

    const allTags = entries.flatMap((e) => e.tags);
    const uniqueTags = Array.from(new Set(allTags));
    return uniqueTags.sort();
  }),
});
