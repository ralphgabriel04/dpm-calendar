"use client";

import { useMemo } from "react";
import { format, startOfWeek, addDays, getDay, differenceInWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";

interface DayDetails {
  focusMins: number;
  meetingMins: number;
  breakMins: number;
  tasksCompleted: number;
  tasksPlanned: number;
  habitsCompleted: number;
  overloadScore: number;
  balanceScore: number;
}

interface HeatmapData {
  date: string;
  value: number;
  details: DayDetails | null;
}

interface ContributionHeatmapProps {
  data: HeatmapData[];
  metric: "hours" | "tasks" | "overload";
  onDayClick?: (date: string, details: DayDetails | null) => void;
  colorScheme?: "green" | "blue" | "purple";
  className?: string;
}

const COLOR_SCHEMES = {
  green: [
    "bg-muted",
    "bg-green-200 dark:bg-green-900",
    "bg-green-300 dark:bg-green-800",
    "bg-green-400 dark:bg-green-700",
    "bg-green-500 dark:bg-green-600",
    "bg-green-600 dark:bg-green-500",
  ],
  blue: [
    "bg-muted",
    "bg-blue-200 dark:bg-blue-900",
    "bg-blue-300 dark:bg-blue-800",
    "bg-blue-400 dark:bg-blue-700",
    "bg-blue-500 dark:bg-blue-600",
    "bg-blue-600 dark:bg-blue-500",
  ],
  purple: [
    "bg-muted",
    "bg-purple-200 dark:bg-purple-900",
    "bg-purple-300 dark:bg-purple-800",
    "bg-purple-400 dark:bg-purple-700",
    "bg-purple-500 dark:bg-purple-600",
    "bg-purple-600 dark:bg-purple-500",
  ],
};

const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const METRIC_LABELS = {
  hours: "heures",
  tasks: "tâches",
  overload: "score",
};

function getColorLevel(value: number, max: number): number {
  if (value === 0 || max === 0) return 0;
  const intensity = value / max;
  if (intensity < 0.2) return 1;
  if (intensity < 0.4) return 2;
  if (intensity < 0.6) return 3;
  if (intensity < 0.8) return 4;
  return 5;
}

export function ContributionHeatmap({
  data,
  metric,
  onDayClick,
  colorScheme = "green",
  className,
}: ContributionHeatmapProps) {
  const { weeks, maxValue, months } = useMemo(() => {
    if (data.length === 0) {
      return { weeks: [], maxValue: 0, months: [] };
    }

    // Create a map for quick lookup
    const dataMap = new Map(data.map((d) => [d.date, d]));

    // Find date range
    const dates = data.map((d) => new Date(d.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Start from Monday of the first week
    const startDate = startOfWeek(minDate, { weekStartsOn: 1 });
    const endDate = maxDate;

    // Calculate number of weeks
    const numWeeks = differenceInWeeks(endDate, startDate) + 1;

    // Build weeks array
    const weeksArray: Array<Array<HeatmapData | null>> = [];
    let currentDate = startDate;

    for (let w = 0; w < numWeeks; w++) {
      const week: Array<HeatmapData | null> = [];
      for (let d = 0; d < 7; d++) {
        const dateKey = format(currentDate, "yyyy-MM-dd");
        const dayData = dataMap.get(dateKey);

        if (currentDate >= minDate && currentDate <= maxDate) {
          week.push(dayData || { date: dateKey, value: 0, details: null });
        } else {
          week.push(null);
        }
        currentDate = addDays(currentDate, 1);
      }
      weeksArray.push(week);
    }

    // Calculate max value for color scaling
    const max = Math.max(...data.map((d) => d.value), 1);

    // Get month labels
    const monthLabels: Array<{ label: string; weekIndex: number }> = [];
    let lastMonth = -1;
    currentDate = startDate;

    for (let w = 0; w < numWeeks; w++) {
      const month = currentDate.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({
          label: format(currentDate, "MMM", { locale: fr }),
          weekIndex: w,
        });
        lastMonth = month;
      }
      currentDate = addDays(currentDate, 7);
    }

    return { weeks: weeksArray, maxValue: max, months: monthLabels };
  }, [data]);

  const colors = COLOR_SCHEMES[colorScheme];

  if (weeks.length === 0) {
    return (
      <div className={cn("rounded-xl border bg-card p-6", className)}>
        <p className="text-muted-foreground text-center">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Activité</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Moins</span>
          <div className="flex gap-0.5">
            {colors.map((color, i) => (
              <div
                key={i}
                className={cn("w-3 h-3 rounded-sm", color)}
              />
            ))}
          </div>
          <span>Plus</span>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex mb-1 ml-8">
        {months.map((month, i) => (
          <div
            key={i}
            className="text-xs text-muted-foreground"
            style={{
              marginLeft: i === 0 ? 0 : `${(month.weekIndex - (months[i - 1]?.weekIndex || 0) - 1) * 14}px`,
            }}
          >
            {month.label}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-2 text-xs text-muted-foreground">
          {DAYS_OF_WEEK.map((day, i) => (
            <div key={i} className="h-3 flex items-center">
              {i % 2 === 0 ? day : ""}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex gap-0.5">
          <TooltipProvider delayDuration={100}>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={dayIndex} className="w-3 h-3" />;
                  }

                  const colorLevel = getColorLevel(day.value, maxValue);
                  const colorClass = colors[colorLevel];

                  return (
                    <Tooltip key={dayIndex}>
                      <TooltipTrigger asChild>
                        <button
                          className={cn(
                            "w-3 h-3 rounded-sm transition-transform hover:scale-125",
                            colorClass,
                            onDayClick && "cursor-pointer"
                          )}
                          onClick={() => onDayClick?.(day.date, day.details)}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">
                          {format(new Date(day.date), "EEEE d MMMM", { locale: fr })}
                        </p>
                        <p className="text-muted-foreground">
                          {day.value} {METRIC_LABELS[metric]}
                        </p>
                        {day.details && (
                          <div className="mt-1 pt-1 border-t">
                            <p>Focus: {Math.round(day.details.focusMins / 60)}h</p>
                            <p>Tâches: {day.details.tasksCompleted}/{day.details.tasksPlanned}</p>
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
