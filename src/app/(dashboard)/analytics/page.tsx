"use client";

import { useState, useMemo } from "react";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Flame,
  CheckCircle2,
  Calendar,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type TimeRange = "week" | "month" | "quarter";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  const dateRange = useMemo(() => {
    const end = new Date();
    let start: Date;

    switch (timeRange) {
      case "week":
        start = subDays(end, 7);
        break;
      case "month":
        start = subDays(end, 30);
        break;
      case "quarter":
        start = subDays(end, 90);
        break;
    }

    return { start, end };
  }, [timeRange]);

  // Fetch data
  const { data: recap } = trpc.recap.get.useQuery({
    type: timeRange === "week" ? "WEEKLY" : "MONTHLY",
    date: new Date(),
  });

  const { data: dailyStats } = trpc.recap.getDailyStats.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const { data: habits } = trpc.habit.getTodayStatus.useQuery();

  const { data: goals } = trpc.goal.list.useQuery({
    status: "ACTIVE",
  });

  // Calculate stats
  const stats = useMemo(() => {
    if (!dailyStats || dailyStats.length === 0) {
      return {
        avgFocusTime: 0,
        avgMeetingTime: 0,
        tasksCompleted: 0,
        habitsCompleted: 0,
        avgBalanceScore: 0,
      };
    }

    const totalDays = dailyStats.length;
    return {
      avgFocusTime: Math.round(
        dailyStats.reduce((sum, d) => sum + (d.focusTimeMins ?? 0), 0) / totalDays
      ),
      avgMeetingTime: Math.round(
        dailyStats.reduce((sum, d) => sum + (d.meetingTimeMins ?? 0), 0) / totalDays
      ),
      tasksCompleted: dailyStats.reduce((sum, d) => sum + (d.tasksCompleted ?? 0), 0),
      habitsCompleted: dailyStats.reduce((sum, d) => sum + (d.habitsCompleted ?? 0), 0),
      avgBalanceScore: Math.round(
        dailyStats.reduce((sum, d) => sum + (d.balanceScore ?? 0), 0) / totalDays
      ),
    };
  }, [dailyStats]);

  // Mock chart data for visualization
  const weekDays = eachDayOfInterval({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Analytiques</h1>
        </div>

        <div className="flex items-center gap-2">
          {(["week", "month", "quarter"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === "week" ? "7 jours" : range === "month" ? "30 jours" : "90 jours"}
            </Button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={Clock}
            label="Temps de focus moyen"
            value={`${Math.floor(stats.avgFocusTime / 60)}h ${stats.avgFocusTime % 60}m`}
            trend={5}
            color="blue"
          />
          <StatCard
            icon={Calendar}
            label="Temps de réunion moyen"
            value={`${Math.floor(stats.avgMeetingTime / 60)}h ${stats.avgMeetingTime % 60}m`}
            trend={-3}
            color="purple"
          />
          <StatCard
            icon={CheckCircle2}
            label="Tâches complétées"
            value={stats.tasksCompleted.toString()}
            trend={12}
            color="green"
          />
          <StatCard
            icon={Flame}
            label="Habitudes complétées"
            value={stats.habitsCompleted.toString()}
            trend={8}
            color="orange"
          />
          <StatCard
            icon={TrendingUp}
            label="Score d'équilibre"
            value={`${stats.avgBalanceScore}%`}
            trend={2}
            color="indigo"
          />
        </div>

        {/* Charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly activity chart */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium mb-4">Activité de la semaine</h3>
            <div className="flex items-end justify-between h-48 gap-2">
              {weekDays.map((day, index) => {
                const height = Math.random() * 80 + 20; // Mock data
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary/20 rounded-t transition-all"
                        style={{ height: `${height}%` }}
                      >
                        <div
                          className="w-full bg-primary rounded-t"
                          style={{ height: `${height * 0.7}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(day, "EEE", { locale: fr })}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary" />
                <span className="text-xs text-muted-foreground">Focus</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary/20" />
                <span className="text-xs text-muted-foreground">Réunions</span>
              </div>
            </div>
          </div>

          {/* Goals progress */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium mb-4">Progression des objectifs</h3>
            <div className="space-y-4">
              {goals?.slice(0, 5).map((goal) => {
                const progress = Math.min(
                  (goal.currentValue / goal.targetValue) * 100,
                  100
                );
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm truncate">{goal.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!goals || goals.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun objectif actif
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Habits heatmap */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium mb-4">Suivi des habitudes</h3>
          <div className="space-y-3">
            {habits?.slice(0, 5).map((habit) => (
              <div key={habit.id} className="flex items-center gap-4">
                <span className="text-sm w-32 truncate">{habit.name}</span>
                <div className="flex gap-1 flex-1">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const completed = Math.random() > 0.3; // Mock data
                    return (
                      <div
                        key={i}
                        className={cn(
                          "h-6 flex-1 rounded",
                          completed ? "bg-green-500" : "bg-muted"
                        )}
                        title={format(subDays(new Date(), 6 - i), "EEEE d", { locale: fr })}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span>{habit.currentStreak}</span>
                </div>
              </div>
            ))}
            {(!habits || habits.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune habitude créée
              </p>
            )}
          </div>
        </div>

        {/* Recap summary */}
        {recap && (
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium mb-4">Résumé de la période</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Highlights */}
              <div>
                <h4 className="text-sm font-medium text-green-600 mb-2">Points forts</h4>
                <ul className="space-y-1">
                  {recap.highlights.map((item, i) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {item}
                    </li>
                  ))}
                  {recap.highlights.length === 0 && (
                    <li className="text-sm text-muted-foreground">Aucun point fort</li>
                  )}
                </ul>
              </div>

              {/* Improvements */}
              <div>
                <h4 className="text-sm font-medium text-orange-600 mb-2">À améliorer</h4>
                <ul className="space-y-1">
                  {recap.improvements.map((item, i) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-orange-500" />
                      {item}
                    </li>
                  ))}
                  {recap.improvements.length === 0 && (
                    <li className="text-sm text-muted-foreground">Rien à signaler</li>
                  )}
                </ul>
              </div>

              {/* Insights */}
              <div>
                <h4 className="text-sm font-medium text-blue-600 mb-2">Insights</h4>
                <ul className="space-y-1">
                  {recap.insights.map((item, i) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      {item}
                    </li>
                  ))}
                  {recap.insights.length === 0 && (
                    <li className="text-sm text-muted-foreground">Aucun insight</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: number;
  color: "blue" | "purple" | "green" | "orange" | "indigo";
}

function StatCard({ icon: Icon, label, value, trend, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    indigo: "bg-indigo-100 text-indigo-600",
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            colorClasses[color]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              "flex items-center text-xs font-medium",
              trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-muted-foreground"
            )}
          >
            {trend > 0 ? (
              <ArrowUp className="h-3 w-3" />
            ) : trend < 0 ? (
              <ArrowDown className="h-3 w-3" />
            ) : null}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}
