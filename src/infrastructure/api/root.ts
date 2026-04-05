import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { eventRouter } from "@/features/calendar/server/event.router";
import { calendarRouter } from "@/features/calendar/server/calendar.router";
import { calendarSectionRouter } from "@/features/calendar/server/calendarSection.router";
import { taskRouter } from "@/server/api/routers/task";
import { syncRouter } from "@/server/api/routers/sync";
import { habitRouter } from "@/features/habits/server/habit.router";
import { goalRouter } from "@/features/goals/server/goal.router";
import { ruleRouter } from "@/server/api/routers/rule";
import { notificationRouter } from "@/features/notifications/server/notification.router";
import { recapRouter } from "@/server/api/routers/recap";
import { journalRouter } from "@/server/api/routers/journal";
import { sharingRouter } from "@/server/api/routers/sharing";
import { userRouter } from "@/features/auth/server/user.router";
import { dashboardRouter } from "@/server/api/routers/dashboard";
import { commentRouter } from "@/server/api/routers/comment";
import { suggestionRouter } from "@/server/api/routers/suggestion";
import { energyRouter } from "@/server/api/routers/energy";
import { emotionalMemoryRouter } from "@/server/api/routers/emotionalMemory";
import { antiProcrastinationRouter } from "@/features/focus/server/antiProcrastination.router";
import { workloadRouter } from "@/server/api/routers/workload";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  // Core
  event: eventRouter,
  calendar: calendarRouter,
  calendarSection: calendarSectionRouter,
  task: taskRouter,

  // Phase 3: Sync
  sync: syncRouter,

  // Phase 4: Rules
  rule: ruleRouter,

  // Phase 5: Habits & Goals
  habit: habitRouter,
  goal: goalRouter,

  // Phase 6: Analytics & Well-being
  recap: recapRouter,
  journal: journalRouter,
  notification: notificationRouter,
  dashboard: dashboardRouter,

  // Phase 7: Sharing & Preferences
  sharing: sharingRouter,

  // User & Onboarding
  user: userRouter,

  // Comments & Suggestions
  comment: commentRouter,
  suggestion: suggestionRouter,

  // Advanced Features
  energy: energyRouter,
  emotionalMemory: emotionalMemoryRouter,
  antiProcrastination: antiProcrastinationRouter,
  workload: workloadRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
