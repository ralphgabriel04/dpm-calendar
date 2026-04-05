import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { protectedProcedure } from "@/infrastructure/trpc/procedures";

export const userRouter = createTRPCRouter({
  // Get current user profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        preferences: true,
      },
    });
    return user;
  }),

  // Check if onboarding is completed
  checkOnboarding: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { onboardingCompleted: true },
    });
    return { completed: user?.onboardingCompleted ?? false };
  }),

  // Complete onboarding and save preferences
  completeOnboarding: protectedProcedure
    .input(
      z.object({
        connectedTaskManagers: z.array(z.string()).default([]),
        connectedCalendars: z.array(z.string()).default([]),
        workingHoursStart: z.string().default("09:00"),
        workingHoursEnd: z.string().default("17:00"),
        weeklyWorkHours: z.record(z.string(), z.object({
          enabled: z.boolean(),
          slots: z.array(z.object({
            start: z.string(),
            end: z.string(),
          })),
        })).optional(),
        planningTime: z.enum(["morning", "evening"]).default("morning"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Upsert user preferences
      await ctx.db.userPreferences.upsert({
        where: { userId },
        create: {
          userId,
          connectedTaskManagers: input.connectedTaskManagers,
          connectedCalendars: input.connectedCalendars,
          workingHoursStart: input.workingHoursStart,
          workingHoursEnd: input.workingHoursEnd,
          weeklyWorkHours: input.weeklyWorkHours,
          planningTime: input.planningTime,
        },
        update: {
          connectedTaskManagers: input.connectedTaskManagers,
          connectedCalendars: input.connectedCalendars,
          workingHoursStart: input.workingHoursStart,
          workingHoursEnd: input.workingHoursEnd,
          weeklyWorkHours: input.weeklyWorkHours,
          planningTime: input.planningTime,
        },
      });

      // Mark onboarding as completed
      await ctx.db.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true },
      });

      // Create default calendar if none exists
      const existingCalendar = await ctx.db.calendar.findFirst({
        where: { userId, isDefault: true },
      });

      if (!existingCalendar) {
        await ctx.db.calendar.create({
          data: {
            userId,
            name: "Mon calendrier",
            color: "#7C3AED",
            isDefault: true,
            provider: "LOCAL",
          },
        });
      }

      return { success: true };
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
        workingHoursStart: z.string().optional(),
        workingHoursEnd: z.string().optional(),
        weeklyWorkHours: z.record(z.string(), z.object({
          enabled: z.boolean(),
          slots: z.array(z.object({
            start: z.string(),
            end: z.string(),
          })),
        })).optional(),
        planningTime: z.enum(["morning", "evening"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const preferences = await ctx.db.userPreferences.upsert({
        where: { userId },
        create: {
          userId,
          ...input,
        },
        update: input,
      });

      return preferences;
    }),

  // Get user preferences
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const preferences = await ctx.db.userPreferences.findUnique({
      where: { userId: ctx.session.user.id },
    });

    return preferences;
  }),

  // Get daily priority cap
  getDailyPriorityCap: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { dailyPriorityCap: true },
    });
    return { dailyPriorityCap: user?.dailyPriorityCap ?? 3 };
  }),

  // Update daily priority cap (1-5)
  updateDailyPriorityCap: protectedProcedure
    .input(z.object({ dailyPriorityCap: z.number().int().min(1).max(5) }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { dailyPriorityCap: input.dailyPriorityCap },
        select: { dailyPriorityCap: true },
      });
      return user;
    }),

  // Self-serve account deletion (Loi 25 art. 43 / RGPD art. 17)
  deleteMyAccount: protectedProcedure
    .input(
      z.object({
        confirmEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<{ success: true }> => {
      const userId = ctx.session.user.id;

      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (input.confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Email confirmation does not match your account email",
        });
      }

      const ipAddress =
        ctx.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        ctx.req.headers.get("x-real-ip") ??
        null;
      const userAgent = ctx.req.headers.get("user-agent") ?? null;

      await ctx.db.$transaction([
        ctx.db.auditLog.create({
          data: {
            userId: user.id,
            userEmail: user.email,
            action: "ACCOUNT_DELETED",
            ipAddress,
            userAgent,
          },
        }),
        ctx.db.user.delete({
          where: { id: user.id },
        }),
      ]);

      return { success: true };
    }),

  // Self-serve data export (Loi 25 art. 27 / RGPD art. 20)
  exportMyData: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        timezone: true,
        chronotype: true,
        onboardingCompleted: true,
        dailyPriorityCap: true,
        dailyFocusGoalMins: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const [
      preferences,
      notificationPrefs,
      calendars,
      calendarSections,
      events,
      tasks,
      rules,
      habits,
      goals,
      recaps,
      journalEntries,
      energyLogs,
      notifications,
      shareLinks,
      eventComments,
      meetingPolls,
      suggestions,
      dailyStats,
      focusSessions,
      experiments,
      pushSubscriptions,
      calendarAccounts,
    ] = await Promise.all([
      ctx.db.userPreferences.findUnique({ where: { userId } }),
      ctx.db.notificationPreference.findUnique({ where: { userId } }),
      ctx.db.calendar.findMany({ where: { userId } }),
      ctx.db.calendarSection.findMany({ where: { userId } }),
      ctx.db.event.findMany({ where: { userId } }),
      ctx.db.task.findMany({ where: { userId } }),
      ctx.db.rule.findMany({ where: { userId } }),
      ctx.db.habit.findMany({ where: { userId } }),
      ctx.db.goal.findMany({ where: { userId } }),
      ctx.db.recap.findMany({ where: { userId } }),
      ctx.db.journalEntry.findMany({ where: { userId } }),
      ctx.db.energyLog.findMany({ where: { userId } }),
      ctx.db.notification.findMany({ where: { userId } }),
      ctx.db.shareLink.findMany({ where: { userId } }),
      ctx.db.eventComment.findMany({ where: { userId } }),
      ctx.db.meetingPoll.findMany({ where: { userId } }),
      ctx.db.suggestion.findMany({ where: { userId } }),
      ctx.db.dailyStats.findMany({ where: { userId } }),
      ctx.db.focusSession.findMany({ where: { userId } }),
      ctx.db.experiment.findMany({ where: { userId } }),
      ctx.db.pushSubscription.findMany({
        where: { userId },
        select: { id: true, endpoint: true, createdAt: true, updatedAt: true },
      }),
      ctx.db.calendarAccount.findMany({
        where: { userId },
        select: {
          id: true,
          provider: true,
          email: true,
          isActive: true,
          isPrimary: true,
          syncDirection: true,
          syncInterval: true,
          lastSyncAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    await ctx.db.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: "DATA_EXPORTED",
      },
    });

    return {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      data: {
        user,
        preferences,
        notificationPrefs,
        calendars,
        calendarSections,
        events,
        tasks,
        rules,
        habits,
        goals,
        recaps,
        journalEntries,
        energyLogs,
        notifications,
        shareLinks,
        eventComments,
        meetingPolls,
        suggestions,
        dailyStats,
        focusSessions,
        experiments,
        pushSubscriptions,
        calendarAccounts,
      },
    };
  }),
});
