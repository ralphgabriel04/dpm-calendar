import { createTRPCRouter } from "@/infrastructure/trpc/context";
import { eventRouter } from "@/server/api/routers/event";
import { calendarRouter } from "@/server/api/routers/calendar";
import { calendarSectionRouter } from "@/server/api/routers/calendarSection";
import { taskRouter } from "@/server/api/routers/task";
import { syncRouter } from "@/server/api/routers/sync";
import { habitRouter } from "@/server/api/routers/habit";
import { goalRouter } from "@/server/api/routers/goal";
import { ruleRouter } from "@/server/api/routers/rule";
import { notificationRouter } from "@/server/api/routers/notification";
import { recapRouter } from "@/server/api/routers/recap";
import { journalRouter } from "@/server/api/routers/journal";
import { sharingRouter } from "@/server/api/routers/sharing";
import { userRouter } from "@/server/api/routers/user";
import { dashboardRouter } from "@/server/api/routers/dashboard";
import { commentRouter } from "@/server/api/routers/comment";
import { suggestionRouter } from "@/server/api/routers/suggestion";
import { energyRouter } from "@/server/api/routers/energy";
import { emotionalMemoryRouter } from "@/server/api/routers/emotionalMemory";
import { antiProcrastinationRouter } from "@/server/api/routers/antiProcrastination";
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
