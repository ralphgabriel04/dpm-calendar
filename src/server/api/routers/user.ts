import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

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
});
