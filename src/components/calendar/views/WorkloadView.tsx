"use client";

import { useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachHourOfInterval,
  startOfDay,
  endOfDay,
  setHours,
  differenceInMinutes,
  isWithinInterval,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/calendar/utils";

interface WorkloadViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onDayClick?: (date: Date) => void;
  viewMode?: "week" | "month";
  className?: string;
}

interface DayWorkload {
  date: Date;
  totalMinutes: number;
  focusMinutes: number;
  meetingMinutes: number;
  freeMinutes: number;
  overloadScore: number; // 0-100
  events: CalendarEvent[];
}

interface HourWorkload {
  hour: Date;
  minutes: number;
  events: CalendarEvent[];
}

const WORK_START = 9;
const WORK_END = 18;
const WORK_HOURS_PER_DAY = WORK_END - WORK_START;
const OPTIMAL_LOAD_PERCENT = 70;

export function WorkloadView({
  events,
  currentDate,
  onDateChange,
  onDayClick,
  viewMode = "month",
  className,
}: WorkloadViewProps) {
  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    if (viewMode === "week") {
      return {
        startDate: startOfWeek(currentDate, { weekStartsOn: 1 }),
        endDate: endOfWeek(currentDate, { weekStartsOn: 1 }),
      };
    }
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return {
      startDate: startOfWeek(monthStart, { weekStartsOn: 1 }),
      endDate: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    };
  }, [currentDate, viewMode]);

  // Get all days in range
  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  // Calculate workload for each day
  const dayWorkloads = useMemo(() => {
    return days.map((day): DayWorkload => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const workStart = setHours(dayStart, WORK_START);
      const workEnd = setHours(dayStart, WORK_END);

      // Filter events for this day
      const dayEvents = events.filter((e) => {
        const start = new Date(e.startAt);
        const end = new Date(e.endAt);
        return start <= dayEnd && end >= dayStart;
      });

      // Calculate total minutes
      let totalMinutes = 0;
      let focusMinutes = 0;
      let meetingMinutes = 0;

      dayEvents.forEach((event) => {
        const start = new Date(event.startAt);
        const end = new Date(event.endAt);

        // Clamp to day boundaries
        const clampedStart = start < dayStart ? dayStart : start;
        const clampedEnd = end > dayEnd ? dayEnd : end;
        const duration = differenceInMinutes(clampedEnd, clampedStart);

        if (duration > 0) {
          totalMinutes += duration;

          // Categorize (simplified - could use event categories)
          const title = event.title.toLowerCase();
          if (title.includes("reunion") || title.includes("meeting") || title.includes("call")) {
            meetingMinutes += duration;
          } else {
            focusMinutes += duration;
          }
        }
      });

      // Calculate free time during work hours
      const totalWorkMinutes = WORK_HOURS_PER_DAY * 60;
      const freeMinutes = Math.max(0, totalWorkMinutes - totalMinutes);

      // Calculate overload score (0-100)
      const loadPercent = (totalMinutes / totalWorkMinutes) * 100;
      let overloadScore = 0;
      if (loadPercent > 100) {
        overloadScore = Math.min(100, (loadPercent - 100) * 2);
      } else if (loadPercent > OPTIMAL_LOAD_PERCENT) {
        overloadScore = ((loadPercent - OPTIMAL_LOAD_PERCENT) / (100 - OPTIMAL_LOAD_PERCENT)) * 50;
      }

      return {
        date: day,
        totalMinutes,
        focusMinutes,
        meetingMinutes,
        freeMinutes,
        overloadScore,
        events: dayEvents,
      };
    });
  }, [days, events]);

  // Get color based on load
  const getLoadColor = (workload: DayWorkload) => {
    const loadPercent = (workload.totalMinutes / (WORK_HOURS_PER_DAY * 60)) * 100;

    if (loadPercent === 0) return "bg-muted/30";
    if (loadPercent < 30) return "bg-green-100 dark:bg-green-900/30";
    if (loadPercent < 50) return "bg-green-200 dark:bg-green-800/40";
    if (loadPercent < 70) return "bg-green-400 dark:bg-green-700/50";
    if (loadPercent < 90) return "bg-yellow-300 dark:bg-yellow-700/50";
    if (loadPercent < 100) return "bg-orange-400 dark:bg-orange-700/60";
    return "bg-red-500 dark:bg-red-700/70";
  };

  // Navigate
  const navigate = (direction: "prev" | "next") => {
    if (viewMode === "week") {
      const days = direction === "next" ? 7 : -7;
      onDateChange(new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000));
    } else {
      onDateChange(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
  };

  // Calculate summary stats
  const summary = useMemo(() => {
    const weekdays = dayWorkloads.filter((d) => {
      const day = d.date.getDay();
      return day !== 0 && day !== 6;
    });

    const totalLoad = weekdays.reduce((sum, d) => sum + d.totalMinutes, 0);
    const avgLoad = weekdays.length > 0 ? totalLoad / weekdays.length : 0;
    const overloadedDays = weekdays.filter((d) => d.overloadScore > 50).length;
    const freeDays = weekdays.filter((d) => d.totalMinutes < 60).length;

    return {
      avgHoursPerDay: avgLoad / 60,
      overloadedDays,
      freeDays,
      criticalWeek: overloadedDays >= 3,
    };
  }, [dayWorkloads]);

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m}` : `${h}h`;
  };

  // Group days by week for month view
  const weeks = useMemo(() => {
    const result: DayWorkload[][] = [];
    for (let i = 0; i < dayWorkloads.length; i += 7) {
      result.push(dayWorkloads.slice(i, i + 7));
    }
    return result;
  }, [dayWorkloads]);

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold ml-2">
            {viewMode === "week"
              ? `Semaine du ${format(startDate, "d MMM", { locale: fr })}`
              : format(currentDate, "MMMM yyyy", { locale: fr })}
          </span>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{summary.avgHoursPerDay.toFixed(1)}h/jour moy.</span>
          </div>
          {summary.overloadedDays > 0 && (
            <div className="flex items-center gap-2 text-sm text-orange-500">
              <AlertTriangle className="h-4 w-4" />
              <span>{summary.overloadedDays} jour(s) charge(s)</span>
            </div>
          )}
          {summary.criticalWeek && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
              Semaine critique
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 p-2 border-b bg-muted/30">
        <span className="text-xs text-muted-foreground">Charge :</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30" />
          <span className="text-xs">Leger</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-400 dark:bg-green-700/50" />
          <span className="text-xs">Normal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-yellow-300 dark:bg-yellow-700/50" />
          <span className="text-xs">Eleve</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-500 dark:bg-red-700/70" />
          <span className="text-xs">Surcharge</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((workload) => {
                const isCurrentMonth =
                  workload.date.getMonth() === currentDate.getMonth();
                const isToday = isSameDay(workload.date, new Date());
                const isWeekend = workload.date.getDay() === 0 || workload.date.getDay() === 6;

                return (
                  <div
                    key={workload.date.toISOString()}
                    onClick={() => onDayClick?.(workload.date)}
                    className={cn(
                      "relative min-h-[100px] rounded-lg border p-2 cursor-pointer transition-all",
                      "hover:ring-2 hover:ring-ring hover:ring-offset-1",
                      !isCurrentMonth && "opacity-40",
                      isWeekend && "bg-muted/20",
                      isToday && "ring-2 ring-primary"
                    )}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isToday && "text-primary"
                        )}
                      >
                        {format(workload.date, "d")}
                      </span>
                      {workload.overloadScore > 50 && (
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                      )}
                    </div>

                    {/* Workload bar */}
                    <div className={cn("h-16 rounded-md flex flex-col justify-end", getLoadColor(workload))}>
                      {workload.totalMinutes > 0 && (
                        <div className="p-1 text-center">
                          <span className="text-xs font-medium">
                            {formatDuration(workload.totalMinutes)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Event count */}
                    {workload.events.length > 0 && (
                      <div className="mt-1 text-center">
                        <span className="text-xs text-muted-foreground">
                          {workload.events.length} evt
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
