import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

// Schema for emotional memory entries
const emotionalMemorySchema = z.object({
  content: z.string().min(1).max(5000),
  context: z.string().max(200).optional(),
  tags: z.array(z.string()).default([]),
  mood: z.number().min(1).max(5).optional(),
  isAudio: z.boolean().default(false),
  audioUrl: z.string().optional(),
  triggerConditions: z.array(z.string()).default([]), // e.g., ["examens", "stress", "fatigue"]
});

export const emotionalMemoryRouter = createTRPCRouter({
  // Create a new emotional memory entry
  create: protectedProcedure
    .input(emotionalMemorySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.journalEntry.create({
        data: {
          userId: ctx.session.user.id,
          date: new Date(),
          content: input.content,
          prompt: input.context || "Memoire emotionnelle",
          mood: input.mood,
          tags: [...input.tags, ...input.triggerConditions, "emotional-memory"],
        },
      });
    }),

  // Get all emotional memories
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        tags: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.journalEntry.findMany({
        where: {
          userId: ctx.session.user.id,
          tags: { has: "emotional-memory" },
          ...(input.tags && input.tags.length > 0
            ? { tags: { hasSome: input.tags } }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  // Get memories relevant to current context
  getRelevant: protectedProcedure
    .input(
      z.object({
        context: z.array(z.string()), // e.g., ["examens", "stress"]
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.context.length === 0) {
        return [];
      }

      return ctx.db.journalEntry.findMany({
        where: {
          userId: ctx.session.user.id,
          tags: {
            hasEvery: ["emotional-memory"],
            hasSome: input.context,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    }),

  // Get a single memory
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const memory = await ctx.db.journalEntry.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
          tags: { has: "emotional-memory" },
        },
      });

      if (!memory) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return memory;
    }),

  // Update a memory
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1).max(5000).optional(),
        tags: z.array(z.string()).optional(),
        mood: z.number().min(1).max(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const memory = await ctx.db.journalEntry.findFirst({
        where: {
          id,
          userId: ctx.session.user.id,
          tags: { has: "emotional-memory" },
        },
      });

      if (!memory) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Ensure emotional-memory tag is preserved
      const newTags = data.tags
        ? Array.from(new Set([...data.tags, "emotional-memory"]))
        : undefined;

      return ctx.db.journalEntry.update({
        where: { id },
        data: {
          ...data,
          ...(newTags ? { tags: newTags } : {}),
        },
      });
    }),

  // Delete a memory
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const memory = await ctx.db.journalEntry.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
          tags: { has: "emotional-memory" },
        },
      });

      if (!memory) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db.journalEntry.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Get suggested contexts based on current state
  getSuggestedContexts: protectedProcedure.query(async ({ ctx }) => {
    // Get recent memories and extract common tags
    const recentMemories = await ctx.db.journalEntry.findMany({
      where: {
        userId: ctx.session.user.id,
        tags: { has: "emotional-memory" },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const tagCounts: Record<string, number> = {};
    recentMemories.forEach((m) => {
      m.tags.forEach((tag) => {
        if (tag !== "emotional-memory") {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      });
    });

    // Sort by frequency
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    // Add some default suggestions
    const defaults = ["stress", "examens", "fatigue", "motivation", "anxiete", "succes"];
    const suggestions = Array.from(new Set([...sortedTags, ...defaults])).slice(0, 10);

    return suggestions;
  }),

  // Check if there are relevant memories for display
  checkForReminder: protectedProcedure
    .input(
      z.object({
        currentContext: z.array(z.string()),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.currentContext.length === 0) {
        return { hasRelevantMemories: false, count: 0 };
      }

      const count = await ctx.db.journalEntry.count({
        where: {
          userId: ctx.session.user.id,
          tags: {
            hasEvery: ["emotional-memory"],
            hasSome: input.currentContext,
          },
        },
      });

      return {
        hasRelevantMemories: count > 0,
        count,
      };
    }),
});
