import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { eventRouter } from "@/features/calendar/server/event.router";
import { calendarRouter } from "@/features/calendar/server/calendar.router";
import { calendarSectionRouter } from "@/features/calendar/server/calendarSection.router";
import { taskRouter } from "@/features/tasks/server/task.router";
import { syncRouter } from "@/features/sync/server/sync.router";
import { habitRouter } from "@/features/habits/server/habit.router";
import { goalRouter } from "@/features/goals/server/goal.router";
import { ruleRouter } from "@/features/intelligence/server/rule.router";
import { notificationRouter } from "@/features/notifications/server/notification.router";
import { recapRouter } from "@/features/wellness/server/recap.router";
import { journalRouter } from "@/features/wellness/server/journal.router";
import { sharingRouter } from "@/features/collaboration/server/sharing.router";
import { userRouter } from "@/features/auth/server/user.router";
import { dashboardRouter } from "@/features/analytics/server/dashboard.router";
import { commentRouter } from "@/features/collaboration/server/comment.router";
import { suggestionRouter } from "@/features/intelligence/server/suggestion.router";
import { energyRouter } from "@/features/wellness/server/energy.router";
import { emotionalMemoryRouter } from "@/features/wellness/server/emotionalMemory.router";
import { antiProcrastinationRouter } from "@/features/focus/server/antiProcrastination.router";
import { workloadRouter } from "@/features/analytics/server/workload.router";

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
