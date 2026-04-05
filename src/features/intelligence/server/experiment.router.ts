import { z } from "zod";
import { ExperimentResult } from "@prisma/client";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";
import { TRPCError } from "@trpc/server";

/**
 * N-of-1 Experiment Lab Router (Ticket #144)
 *
 * Lets users define a personal hypothesis, track a baseline + intervention
 * metric, and record the outcome. Intentionally lightweight.
 */
export const experimentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        hypothesis: z.string().min(3).max(500),
        metric: z.string().min(1).max(100),
        baselineValue: z.number().finite().optional(),
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.experiment.create({
        data: {
          userId: ctx.session.user.id,
          hypothesis: input.hypothesis,
          metric: input.metric,
          baselineValue: input.baselineValue,
          notes: input.notes,
        },
      });
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          result: z.nativeEnum(ExperimentResult).optional(),
          limit: z.number().int().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.experiment.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.result ? { result: input.result } : {}),
        },
        orderBy: [{ endedAt: "desc" }, { startedAt: "desc" }],
        take: input?.limit ?? 50,
      });
    }),

  complete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        interventionValue: z.number().finite().optional(),
        result: z.nativeEnum(ExperimentResult),
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.experiment.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.experiment.update({
        where: { id: input.id },
        data: {
          interventionValue: input.interventionValue,
          result: input.result,
          notes: input.notes ?? existing.notes,
          endedAt: new Date(),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.experiment.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await ctx.db.experiment.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
