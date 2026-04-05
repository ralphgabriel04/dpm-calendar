import { z } from "zod";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";
import { TRPCError } from "@trpc/server";

export const commentRouter = createTRPCRouter({
  // List comments for an event
  listForEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user has access to the event
      const event = await ctx.db.event.findFirst({
        where: { id: input.eventId, userId: ctx.session.user.id },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Evenement non trouve" });
      }

      return ctx.db.eventComment.findMany({
        where: { eventId: input.eventId },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Create comment
  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        content: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to the event
      const event = await ctx.db.event.findFirst({
        where: { id: input.eventId, userId: ctx.session.user.id },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Evenement non trouve" });
      }

      return ctx.db.eventComment.create({
        data: {
          eventId: input.eventId,
          userId: ctx.session.user.id,
          content: input.content,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });
    }),

  // Update comment
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.eventComment.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!comment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Commentaire non trouve" });
      }

      return ctx.db.eventComment.update({
        where: { id: input.id },
        data: { content: input.content },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });
    }),

  // Delete comment
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.eventComment.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!comment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Commentaire non trouve" });
      }

      await ctx.db.eventComment.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Get comment count for events
  getCounts: protectedProcedure
    .input(z.object({ eventIds: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const counts = await ctx.db.eventComment.groupBy({
        by: ["eventId"],
        where: { eventId: { in: input.eventIds } },
        _count: { id: true },
      });

      return counts.reduce(
        (acc, c) => ({ ...acc, [c.eventId]: c._count.id }),
        {} as Record<string, number>
      );
    }),
});
