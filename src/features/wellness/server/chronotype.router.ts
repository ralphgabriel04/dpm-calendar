import { z } from "zod";
import { Chronotype } from "@prisma/client";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";
import {
  computeChronotype,
  getEnergyCurveForChronotype,
} from "@/features/wellness/lib/chronotype";

/**
 * Chronotype Engine Router (Ticket #136)
 *
 * Manages user chronotype detection via a 12-question Likert quiz,
 * and exposes a per-hour energy curve consumed by the AI Scheduler
 * (Ticket #93 — Energy-Aware Scheduling).
 */
export const chronotypeRouter = createTRPCRouter({
  /**
   * Submit the 12-question chronotype quiz.
   * Each answer is a Likert scale value (1-5).
   * Questions 1-6 measure morningness; questions 7-12 measure eveningness.
   */
  submitQuiz: protectedProcedure
    .input(
      z.object({
        answers: z
          .array(z.number().int().min(1).max(5))
          .length(12, "Exactly 12 answers required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const chronotype = computeChronotype(input.answers);

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { chronotype },
      });

      return {
        chronotype,
        energyCurve: getEnergyCurveForChronotype(chronotype),
      };
    }),

  /**
   * Get the current user's chronotype + energy curve.
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.session.user.id },
      select: { chronotype: true },
    });

    return {
      chronotype: user.chronotype,
      energyCurve: getEnergyCurveForChronotype(user.chronotype),
    };
  }),

  /**
   * Get hourly energy multipliers (0.0 – 1.5) keyed by hour (0-23)
   * for an arbitrary chronotype (defaults to the current user's).
   */
  getEnergyCurve: protectedProcedure
    .input(
      z
        .object({
          chronotype: z.nativeEnum(Chronotype).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      let ct = input?.chronotype;
      if (!ct) {
        const user = await ctx.db.user.findUniqueOrThrow({
          where: { id: ctx.session.user.id },
          select: { chronotype: true },
        });
        ct = user.chronotype;
      }

      return {
        chronotype: ct,
        curve: getEnergyCurveForChronotype(ct),
      };
    }),
});
