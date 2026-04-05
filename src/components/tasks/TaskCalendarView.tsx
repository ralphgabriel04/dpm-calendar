"use client";

import { useState, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfDay,
  addMinutes,
  differenceInMinutes,
  setHours,
  setMinutes,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/Button";

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

interface TaskCalendarViewProps {
  tasks: Task[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onTaskClick?: (task: any) => void;
  onTaskDateChange?: (taskId: string, newDate: Date) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#22c55e",
};

const STATUS_OPACITY: Record<string, string> = {
  DONE: "opacity-50 line-through",
  CANCELLED: "opacity-30 line-through",
  TODO: "",
  IN_PROGRESS: "",
};

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function TaskCalendarView({
  tasks,
  onTaskClick,
  onTaskDateChange,
}: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [subView, setSubView] = useState<"month" | "week">("month");

  const navigateToday = () => setCurrentDate(new Date());

  const navigatePrev = () => {
    if (subView === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (subView === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const title = subView === "month"
    ? format(currentDate, "MMMM yyyy", { locale: fr })
    : `Semaine du ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "d MMMM", { locale: fr })}`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={navigatePrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={navigateToday}
          >
            Aujourd&apos;hui
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={navigateNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold capitalize ml-2">{title}</h2>
        </div>

        <div className="flex items-center gap-1 rounded-lg border bg-muted p-1">
          <button
            onClick={() => setSubView("month")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              subView === "month"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Mois
          </button>
          <button
            onClick={() => setSubView("week")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              subView === "week"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarRange className="h-4 w-4" />
            Semaine
          </button>
        </div>
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-auto">
        {subView === "month" ? (
          <TaskMonthView
            date={currentDate}
            tasks={tasks}
            onTaskClick={onTaskClick}
          />
        ) : (
          <TaskWeekView
            date={currentDate}
            tasks={tasks}
            onTaskClick={onTaskClick}
          />
        )}
      </div>
    </div>
  );
}

// Month View Component
interface TaskMonthViewProps {
  date: Date;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

function TaskMonthView({ date, tasks, onTaskClick }: TaskMonthViewProps) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  days.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getTasksForDay = (day: Date): Task[] => {
    return tasks.filter((task) => {
      if (task.dueAt && isSameDay(task.dueAt, day)) return true;
      if (task.plannedStartAt && isSameDay(task.plannedStartAt, day)) return true;
      return false;
    });
  };

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="flex flex-col h-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map((day) => {
              const dayTasks = getTasksForDay(day);
              const isCurrentMonth = isSameMonth(day, date);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[100px] p-1 border-r last:border-r-0",
                    !isCurrentMonth && "bg-muted/30",
                    isToday(day) && "bg-primary/5"
                  )}
                >
                  {/* Day number */}
                  <div className="flex justify-end mb-1">
                    <span
                      className={cn(
                        "text-sm",
                        !isCurrentMonth && "text-muted-foreground",
                        isToday(day) &&
                          "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center font-bold"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((task) => (
                      <TaskPill
                        key={task.id}
                        task={task}
                        onClick={() => onTaskClick?.(task)}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-muted-foreground pl-1">
                        +{dayTasks.length - 3} autres
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// Week View Component
interface TaskWeekViewProps {
  date: Date;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

function TaskWeekView({ date, tasks, onTaskClick }: TaskWeekViewProps) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const startHour = 6;
  const endHour = 22;
  const hourHeight = 60;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  // Get tasks with planned time for a specific day
  const getScheduledTasks = (day: Date): Task[] => {
    return tasks.filter((task) => {
      if (task.plannedStartAt && isSameDay(task.plannedStartAt, day)) return true;
      return false;
    });
  };

  // Get tasks without time (just due date) for a specific day
  const getAllDayTasks = (day: Date): Task[] => {
    return tasks.filter((task) => {
      if (task.dueAt && isSameDay(task.dueAt, day) && !task.plannedStartAt) return true;
      return false;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with days */}
      <div className="flex border-b bg-card sticky top-0 z-10">
        {/* Time gutter */}
        <div className="w-16 flex-shrink-0" />

        {/* Day headers */}
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "flex-1 text-center py-2 border-l",
              isToday(day) && "bg-primary/5"
            )}
          >
            <div className="text-sm text-muted-foreground">
              {format(day, "EEE", { locale: fr })}
            </div>
            <div
              className={cn(
                "text-lg font-semibold",
                isToday(day) &&
                  "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto"
              )}
            >
              {format(day, "d")}
            </div>
            {/* All-day tasks */}
            <div className="px-1 mt-1 space-y-0.5 max-h-20 overflow-auto">
              {getAllDayTasks(day).slice(0, 2).map((task) => (
                <TaskPill
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick?.(task)}
                  compact
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex flex-1 overflow-auto">
        {/* Time gutter */}
        <div className="w-16 flex-shrink-0">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-[60px] pr-2 text-right text-xs text-muted-foreground"
              style={{ height: hourHeight }}
            >
              {format(setHours(new Date(), hour), "HH:mm")}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day) => {
          const scheduledTasks = getScheduledTasks(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex-1 border-l relative",
                isToday(day) && "bg-primary/5"
              )}
            >
              {/* Hour lines */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-border/50"
                  style={{ height: hourHeight }}
                />
              ))}

              {/* Scheduled tasks */}
              {scheduledTasks.map((task) => {
                if (!task.plannedStartAt) return null;

                const taskStart = task.plannedStartAt;
                const taskHour = taskStart.getHours();
                const taskMinute = taskStart.getMinutes();
                const duration = task.plannedDuration || 60;

                const top = (taskHour - startHour) * hourHeight + (taskMinute / 60) * hourHeight;
                const height = (duration / 60) * hourHeight;

                // Skip if outside visible hours
                if (taskHour < startHour || taskHour >= endHour) return null;

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "absolute left-1 right-1 rounded-md px-2 py-1 cursor-pointer overflow-hidden",
                      "hover:ring-2 hover:ring-ring transition-shadow",
                      STATUS_OPACITY[task.status] || ""
                    )}
                    style={{
                      top: `${top}px`,
                      height: `${Math.max(height, 24)}px`,
                      backgroundColor: PRIORITY_COLORS[task.priority] || "#3b82f6",
                    }}
                    onClick={() => onTaskClick?.(task)}
                  >
                    <div className="text-white text-xs font-medium truncate">
                      {task.title}
                    </div>
                    {height > 40 && (
                      <div className="text-white/80 text-xs">
                        {format(taskStart, "HH:mm")} - {duration}min
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Current time indicator */}
              {isToday(day) && <CurrentTimeIndicator startHour={startHour} hourHeight={hourHeight} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Task Pill Component
interface TaskPillProps {
  task: Task;
  onClick?: () => void;
  compact?: boolean;
}

function TaskPill({ task, onClick, compact }: TaskPillProps) {
  return (
    <div
      className={cn(
        "rounded px-1.5 py-0.5 text-xs cursor-pointer truncate",
        "hover:ring-1 hover:ring-ring transition-shadow",
        STATUS_OPACITY[task.status] || ""
      )}
      style={{
        backgroundColor: `${PRIORITY_COLORS[task.priority] || "#3b82f6"}20`,
        borderLeft: `3px solid ${PRIORITY_COLORS[task.priority] || "#3b82f6"}`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <span className={cn(compact ? "text-[10px]" : "text-xs")}>
        {task.title}
      </span>
    </div>
  );
}

// Current Time Indicator
function CurrentTimeIndicator({
  startHour,
  hourHeight,
}: {
  startHour: number;
  hourHeight: number;
}) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (currentHour < startHour || currentHour >= 22) return null;

  const top = (currentHour - startHour) * hourHeight + (currentMinute / 60) * hourHeight;

  return (
    <div
      className="absolute left-0 right-0 flex items-center z-10 pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="h-2 w-2 rounded-full bg-red-500" />
      <div className="flex-1 h-0.5 bg-red-500" />
    </div>
  );
}
