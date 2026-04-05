"use client";

import { useMemo } from "react";
import { startOfYear, subMonths } from "date-fns";
import { trpc } from "@/infrastructure/trpc/client";
import { useDateRange } from "@/shared/hooks/useDateRange";
import {
  DashboardHeader,
  StatisticsCards,
  ContributionHeatmap,
  TimeDistributionChart,
  HabitStreaksWidget,
  GoalProgressWidget,
  UpcomingDeadlinesWidget,
  WorkloadBalanceWidget,
  ProductivityScoreWidget,
  MeetingLoadWidget,
} from "@/features/analytics/components/dashboard-v2";
import { FocusProgressRing } from "@/features/focus/components";

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 bg-muted rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="h-48 bg-muted rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { range, setRange, startDate, endDate } = useDateRange("week");

  // Heatmap date range (last 6 months for better visualization)
  const heatmapRange = useMemo(() => {
    const end = new Date();
    const start = subMonths(end, 6);
    return { start, end };
  }, []);

  // Fetch dashboard data
  const { data: overview, isLoading: isLoadingOverview } =
    trpc.dashboard.getOverview.useQuery({
      range,
      compareWithPrevious: true,
    });

  const { data: heatmapData, isLoading: isLoadingHeatmap } =
    trpc.dashboard.getHeatmapData.useQuery({
      startDate: heatmapRange.start,
      endDate: heatmapRange.end,
      metric: "hours",
    });

  const { data: timeDistribution, isLoading: isLoadingTime } =
    trpc.dashboard.getTimeDistribution.useQuery({
      range,
    });

  const { data: workloadBalance, isLoading: isLoadingWorkload } =
    trpc.dashboard.getWorkloadBalance.useQuery({
      range,
    });

  const { data: upcomingDeadlines, isLoading: isLoadingDeadlines } =
    trpc.dashboard.getUpcomingDeadlines.useQuery({
      limit: 5,
    });

  const { data: habitStreaks, isLoading: isLoadingHabits } =
    trpc.dashboard.getHabitStreaks.useQuery();

  const { data: goalProgress, isLoading: isLoadingGoals } =
    trpc.dashboard.getGoalProgress.useQuery({
      limit: 5,
    });

  const { data: productivityScore, isLoading: isLoadingProductivity } =
    trpc.dashboard.getProductivityScore.useQuery({
      range,
    });

  const isLoading =
    isLoadingOverview ||
    isLoadingHeatmap ||
    isLoadingTime ||
    isLoadingWorkload ||
    isLoadingDeadlines ||
    isLoadingHabits ||
    isLoadingGoals ||
    isLoadingProductivity;

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <DashboardHeader
          range={range}
          onRangeChange={setRange}
          startDate={startDate}
          endDate={endDate}
        />

        {/* Statistics Cards */}
        {overview && (
          <StatisticsCards
            totalHours={overview.totalHours}
            tasksCompleted={overview.tasksCompleted}
            tasksPlanned={overview.tasksPlanned}
            productivityScore={overview.productivityScore}
            taskCompletionRate={overview.taskCompletionRate}
            percentChange={overview.percentChange}
          />
        )}

        {/* Heatmap */}
        {heatmapData && (
          <ContributionHeatmap
            data={heatmapData}
            metric="hours"
            colorScheme="green"
          />
        )}

        {/* Focus Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FocusProgressRing />
        </div>

        {/* Middle row - Productivity Score, Time Distribution, Habits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {productivityScore && (
            <ProductivityScoreWidget
              score={productivityScore.score}
              previousScore={productivityScore.previousScore}
              breakdown={productivityScore.breakdown}
            />
          )}
          {timeDistribution && (
            <TimeDistributionChart
              focusMins={timeDistribution.focusMins}
              meetingMins={timeDistribution.meetingMins}
              breakMins={timeDistribution.breakMins}
            />
          )}
          {habitStreaks && <HabitStreaksWidget habits={habitStreaks} />}
        </div>

        {/* Goals row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {goalProgress && <GoalProgressWidget goals={goalProgress} />}
          {upcomingDeadlines && (
            <UpcomingDeadlinesWidget tasks={upcomingDeadlines} />
          )}
        </div>

        {/* Bottom row - Workload Balance + Meeting Load */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workloadBalance && <WorkloadBalanceWidget data={workloadBalance} />}
          <MeetingLoadWidget />
        </div>
      </div>
    </div>
  );
}
