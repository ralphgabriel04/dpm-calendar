import { createTRPCRouter } from "./trpc";
import { eventRouter } from "./routers/event";
import { calendarRouter } from "./routers/calendar";
import { calendarSectionRouter } from "./routers/calendarSection";
import { taskRouter } from "./routers/task";
import { syncRouter } from "./routers/sync";
import { habitRouter } from "./routers/habit";
import { goalRouter } from "./routers/goal";
import { ruleRouter } from "./routers/rule";
import { notificationRouter } from "./routers/notification";
import { recapRouter } from "./routers/recap";
import { journalRouter } from "./routers/journal";
import { sharingRouter } from "./routers/sharing";

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

  // Phase 7: Sharing & Preferences
  sharing: sharingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
