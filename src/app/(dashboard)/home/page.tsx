import { Suspense } from "react";
import { api } from "@/infrastructure/trpc/server";
import { HomeClient } from "./HomeClient";
import { HomeLoadingSkeleton } from "./loading";

/**
 * Home page - Server Component shell that prefetches data
 * for the client-side interactive components.
 *
 * Performance improvements:
 * - Data is fetched on the server, reducing client-side waterfall
 * - Suspense boundary enables streaming
 * - Client components only handle interactivity
 */
export default async function HomePage() {
  return (
    <Suspense fallback={<HomeLoadingSkeleton />}>
      <HomePageContent />
    </Suspense>
  );
}

async function HomePageContent() {
  const caller = await api();

  // Calculate date range for events
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Fetch all data in parallel on the server
  const [tasks, events, habits] = await Promise.all([
    caller.task.list({ includeCompleted: true }),
    caller.event.list({ startDate: today, endDate: nextWeek }),
    caller.habit.list({}),
  ]);

  return (
    <HomeClient
      initialTasks={tasks}
      initialEvents={events}
      initialHabits={habits}
    />
  );
}
