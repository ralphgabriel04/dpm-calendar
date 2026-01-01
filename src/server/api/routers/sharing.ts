import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const sharingRouter = createTRPCRouter({
  // Create share link
  createLink: protectedProcedure
    .input(
      z.object({
        type: z.enum(["CALENDAR", "AVAILABILITY", "EVENT", "TASK_LIST"]),
        permission: z.enum(["VIEW", "EDIT", "ADMIN"]).default("VIEW"),
        resourceType: z.string(),
        resourceId: z.string().optional(),
        expiresAt: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.shareLink.create({
        data: {
          userId: ctx.session.user.id,
          ...input,
        },
      });
    }),

  // List my share links
  listLinks: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.shareLink.findMany({
      where: {
        userId: ctx.session.user.id,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Revoke share link
  revokeLink: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const link = await ctx.db.shareLink.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!link) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.shareLink.update({
        where: { id: input.id },
        data: { isActive: false },
      });
    }),

  // Get shared content (public)
  getSharedContent: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const link = await ctx.db.shareLink.findUnique({
        where: { token: input.token },
      });

      if (!link || !link.isActive) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (link.expiresAt && link.expiresAt < new Date()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Link expired" });
      }

      // Increment access count
      await ctx.db.shareLink.update({
        where: { id: link.id },
        data: { accessCount: { increment: 1 } },
      });

      // Return appropriate content based on type
      switch (link.type) {
        case "CALENDAR":
          const calendar = await ctx.db.calendar.findFirst({
            where: { id: link.resourceId ?? "", userId: link.userId },
            include: {
              events: {
                where: { startAt: { gte: new Date() } },
                take: 50,
                orderBy: { startAt: "asc" },
              },
            },
          });
          return { type: "CALENDAR", data: calendar };

        case "AVAILABILITY":
          // Return free/busy times
          const events = await ctx.db.event.findMany({
            where: {
              userId: link.userId,
              startAt: { gte: new Date() },
            },
            select: { startAt: true, endAt: true },
            take: 100,
          });
          return { type: "AVAILABILITY", data: { busyTimes: events } };

        case "EVENT":
          const event = await ctx.db.event.findFirst({
            where: { id: link.resourceId ?? "", userId: link.userId },
          });
          return { type: "EVENT", data: event };

        default:
          return { type: link.type, data: null };
      }
    }),

  // Create meeting poll
  createPoll: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        proposedSlots: z.array(
          z.object({
            startAt: z.coerce.date(),
            endAt: z.coerce.date(),
          })
        ),
        duration: z.number().min(15),
        deadline: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.meetingPoll.create({
        data: {
          userId: ctx.session.user.id,
          ...input,
        },
      });
    }),

  // List my polls
  listPolls: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.meetingPoll.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get poll (public)
  getPoll: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const poll = await ctx.db.meetingPoll.findUnique({
        where: { token: input.token },
        include: {
          responses: true,
          user: { select: { name: true, email: true } },
        },
      });

      if (!poll || !poll.isActive) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return poll;
    }),

  // Vote on poll (public)
  votePoll: publicProcedure
    .input(
      z.object({
        token: z.string(),
        email: z.string().email(),
        name: z.string().optional(),
        votes: z.record(z.string(), z.enum(["yes", "maybe", "no"])),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const poll = await ctx.db.meetingPoll.findUnique({
        where: { token: input.token },
      });

      if (!poll || !poll.isActive) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (poll.deadline && poll.deadline < new Date()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Poll closed" });
      }

      return ctx.db.meetingPollResponse.upsert({
        where: {
          pollId_email: {
            pollId: poll.id,
            email: input.email,
          },
        },
        update: {
          name: input.name,
          votes: input.votes,
          comment: input.comment,
        },
        create: {
          pollId: poll.id,
          email: input.email,
          name: input.name,
          votes: input.votes,
          comment: input.comment,
        },
      });
    }),

  // Finalize poll
  finalizePoll: protectedProcedure
    .input(
      z.object({
        pollId: z.string(),
        selectedSlotIndex: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const poll = await ctx.db.meetingPoll.findFirst({
        where: { id: input.pollId, userId: ctx.session.user.id },
      });

      if (!poll) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const slots = poll.proposedSlots as Array<{ startAt: string; endAt: string }>;
      const selectedSlot = slots[input.selectedSlotIndex];

      return ctx.db.meetingPoll.update({
        where: { id: input.pollId },
        data: {
          finalSlot: selectedSlot,
          isActive: false,
        },
      });
    }),

  // Get user preferences
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    let prefs = await ctx.db.userPreferences.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!prefs) {
      prefs = await ctx.db.userPreferences.create({
        data: { userId: ctx.session.user.id },
      });
    }

    return prefs;
  }),

  // Update user preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        theme: z.string().optional(),
        accentColor: z.string().optional(),
        language: z.string().optional(),
        dateFormat: z.string().optional(),
        timeFormat: z.string().optional(),
        firstDayOfWeek: z.number().min(0).max(6).optional(),
        compactMode: z.boolean().optional(),
        showWeekNumbers: z.boolean().optional(),
        defaultCalendarId: z.string().optional(),
        workingHoursStart: z.string().optional(),
        workingHoursEnd: z.string().optional(),
        customShortcuts: z.record(z.string(), z.string()).optional(),
        dashboardWidgets: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userPreferences.upsert({
        where: { userId: ctx.session.user.id },
        update: input,
        create: {
          userId: ctx.session.user.id,
          ...input,
        },
      });
    }),
});
