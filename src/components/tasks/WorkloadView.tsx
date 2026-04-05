"use client";

import { useMemo, useState } from "react";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  addWeeks,
  startOfDay,
  isToday,
} from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/shared/lib/utils";
import { ChevronLeft, ChevronRight, Clock, AlertTriangle } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueAt: Date | null;
  plannedStartAt: Date | null;
  plannedDuration: number | null;
  priority: string;
  status: string;
  tags: string[];
  checklistItems: { id: string; title: string; isCompleted: boolean }[];
  subtasks: { id: string; status: string }[];
}

interface WorkloadViewProps {
  tasks: Task[];
  onTaskClick: (task: any) => void;
}

const priorityColors: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-green-500",
};

// Target hours per day (can be made configurable)
const TARGET_HOURS_PER_DAY = 8;

export function WorkloadView({ tasks, onTaskClick }: WorkloadViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  // Calculate visible week
  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addWeeks(base, weekOffset);
  }, [weekOffset]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Group tasks by day and calculate workload
  const workloadByDay = useMemo(() => {
    return days.map((day) => {
      const dayStart = startOfDay(day);
      const dayTasks = tasks.filter((task) => {
        if (task.status === "DONE" || task.status === "CANCELLED") return false;
        const taskDate = task.dueAt || task.plannedStartAt;
        if (!taskDate) return false;
        return isSameDay(new Date(taskDate), dayStart);
      });

      // Calculate total hours
      const totalMinutes = dayTasks.reduce(
        (sum, task) => sum + (task.plannedDuration || 60), // Default 1 hour if no duration
        0
      );
      const totalHours = totalMinutes / 60;
      const percentage = (totalHours / TARGET_HOURS_PER_DAY) * 100;

      return {
        date: day,
        tasks: dayTasks,
        totalHours,
        percentage: Math.min(percentage, 150), // Cap at 150% for display
        isOverloaded: percentage > 100,
      };
    });
  }, [days, tasks]);

  // Get height scale for bars
  const getBarHeight = (percentage: number) => {
    // Scale to max 100% height
    return Math.min(percentage, 100);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with navigation */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 py-1 text-sm font-medium rounded-md hover:bg-muted transition-colors"
          >
            Cette semaine
          </button>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-muted-foreground">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-muted-foreground">Surchargé</span>
          </div>
        </div>
      </div>

      {/* Workload chart */}
      <div className="flex-1 overflow-auto p-4">
        <div className="h-full min-h-[400px] flex flex-col">
          {/* Chart area */}
          <div className="flex-1 flex gap-4">
            {workloadByDay.map((dayData, i) => {
              const isCurrentDay = isToday(dayData.date);
              const isWeekend = dayData.date.getDay() === 0 || dayData.date.getDay() === 6;

              return (
                <div
                  key={i}
                  className={cn(
                    "flex-1 flex flex-col",
                    isWeekend && "opacity-60"
                  )}
                >
                  {/* Bar container */}
                  <div className="flex-1 flex flex-col justify-end relative">
                    {/* Target line */}
                    <div
                      className="absolute left-0 right-0 border-t-2 border-dashed border-muted-foreground/30"
                      style={{ bottom: "50%" }}
                    >
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">
                        {TARGET_HOURS_PER_DAY}h
                      </span>
                    </div>

                    {/* Workload bar */}
                    <div
                      className={cn(
                        "relative rounded-t-lg transition-all duration-500",
                        dayData.isOverloaded
                          ? "bg-gradient-to-t from-red-500 to-red-400"
                          : "bg-gradient-to-t from-emerald-500 to-emerald-400",
                        isCurrentDay && "ring-2 ring-primary ring-offset-2"
                      )}
                      style={{
                        height: `${getBarHeight(dayData.percentage)}%`,
                        minHeight: dayData.tasks.length > 0 ? "20px" : "0",
                      }}
                    >
                      {/* Hours label */}
                      {dayData.totalHours > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap">
                          {dayData.totalHours.toFixed(1)}h
                        </div>
                      )}

                      {/* Overload indicator */}
                      {dayData.isOverloaded && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Day label */}
                  <div
                    className={cn(
                      "text-center py-2 border-t mt-2",
                      isCurrentDay && "bg-primary/10 rounded-lg"
                    )}
                  >
                    <div className="text-sm font-medium">
                      {format(dayData.date, "EEE", { locale: fr })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(dayData.date, "d MMM", { locale: fr })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tasks breakdown per day */}
          <div className="grid grid-cols-7 gap-4 mt-6 pt-4 border-t">
            {workloadByDay.map((dayData, i) => (
              <div key={i} className="space-y-1">
                <div className="text-xs text-muted-foreground font-medium mb-2">
                  {dayData.tasks.length} tâche{dayData.tasks.length !== 1 ? "s" : ""}
                </div>
                {dayData.tasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="w-full text-left p-1.5 rounded text-xs hover:bg-muted transition-colors truncate flex items-center gap-1"
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full flex-shrink-0",
                        priorityColors[task.priority]
                      )}
                    />
                    <span className="truncate">{task.title}</span>
                  </button>
                ))}
                {dayData.tasks.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayData.tasks.length - 3} autres
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary footer */}
      <div className="border-t p-4 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Total semaine:{" "}
              <strong>
                {workloadByDay.reduce((sum, d) => sum + d.totalHours, 0).toFixed(1)}h
              </strong>
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Objectif: {TARGET_HOURS_PER_DAY * 5}h (5 jours)
          </div>
        </div>
        {workloadByDay.some((d) => d.isOverloaded) && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Attention: certains jours sont surchargés</span>
          </div>
        )}
      </div>
    </div>
  );
}
