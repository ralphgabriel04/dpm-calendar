"use client";

import { useMemo, useRef } from "react";
import { format, startOfWeek, addDays, differenceInDays, isSameDay, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/shared/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

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

interface GanttViewProps {
  tasks: Task[];
  onTaskClick: (task: any) => void;
}

const priorityColors: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-green-500",
};

const statusColors: Record<string, string> = {
  TODO: "bg-slate-400",
  IN_PROGRESS: "bg-blue-500",
  DONE: "bg-emerald-500",
  CANCELLED: "bg-gray-400",
};

export function GanttView({ tasks, onTaskClick }: GanttViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  // Calculate the visible date range (4 weeks)
  const startDate = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const days = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => addDays(startDate, i));
  }, [startDate]);

  // Group tasks by their timeline
  const tasksWithDates = useMemo(() => {
    return tasks
      .filter((task) => task.dueAt || task.plannedStartAt)
      .map((task) => {
        const start = task.plannedStartAt || task.dueAt;
        const end = task.dueAt || task.plannedStartAt;
        return {
          ...task,
          startDate: start ? startOfDay(new Date(start)) : null,
          endDate: end ? endOfDay(new Date(end)) : null,
        };
      })
      .filter((task) => task.startDate && task.endDate);
  }, [tasks]);

  // Calculate task position and width
  const getTaskStyle = (task: { startDate: Date | null; endDate: Date | null }) => {
    if (!task.startDate || !task.endDate) return null;

    const dayStart = differenceInDays(task.startDate, startDate);
    const dayEnd = differenceInDays(task.endDate, startDate);
    const duration = dayEnd - dayStart + 1;

    // Don't show tasks outside the visible range
    if (dayEnd < 0 || dayStart > 27) return null;

    // Clamp to visible range
    const visibleStart = Math.max(0, dayStart);
    const visibleEnd = Math.min(27, dayEnd);
    const visibleDuration = visibleEnd - visibleStart + 1;

    return {
      left: `${(visibleStart / 28) * 100}%`,
      width: `${(visibleDuration / 28) * 100}%`,
    };
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
            Aujourd'hui
          </button>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="text-sm font-medium">
          {format(startDate, "MMMM yyyy", { locale: fr })}
        </div>
      </div>

      {/* Gantt chart */}
      <div className="flex-1 overflow-auto" ref={containerRef}>
        <div className="min-w-[1200px]">
          {/* Days header */}
          <div className="sticky top-0 z-10 bg-card border-b">
            <div className="flex">
              {/* Task name column */}
              <div className="w-64 flex-shrink-0 p-2 border-r font-medium text-sm bg-muted/50">
                Tâche
              </div>
              {/* Days columns */}
              <div className="flex-1 flex">
                {days.map((day, i) => {
                  const isToday = isSameDay(day, new Date());
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 text-center p-2 text-xs border-r",
                        isToday && "bg-primary/10",
                        isWeekend && "bg-muted/30"
                      )}
                    >
                      <div className="font-medium">
                        {format(day, "EEE", { locale: fr })}
                      </div>
                      <div className={cn("text-muted-foreground", isToday && "text-primary font-bold")}>
                        {format(day, "d")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Task rows */}
          <div>
            {tasksWithDates.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>Aucune tâche avec des dates planifiées</p>
                <p className="text-sm mt-1">
                  Ajoutez des dates de début ou d'échéance à vos tâches pour les voir ici
                </p>
              </div>
            ) : (
              tasksWithDates.map((task) => {
                const style = getTaskStyle(task);
                if (!style) return null;

                return (
                  <div
                    key={task.id}
                    className="flex border-b hover:bg-muted/30 transition-colors"
                  >
                    {/* Task name */}
                    <div
                      className="w-64 flex-shrink-0 p-2 border-r flex items-center gap-2 cursor-pointer hover:bg-muted/50"
                      onClick={() => onTaskClick(task)}
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          priorityColors[task.priority]
                        )}
                      />
                      <span className="text-sm truncate">{task.title}</span>
                    </div>

                    {/* Timeline */}
                    <div className="flex-1 relative h-12">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex">
                        {days.map((day, i) => {
                          const isToday = isSameDay(day, new Date());
                          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                          return (
                            <div
                              key={i}
                              className={cn(
                                "flex-1 border-r",
                                isToday && "bg-primary/5",
                                isWeekend && "bg-muted/20"
                              )}
                            />
                          );
                        })}
                      </div>

                      {/* Task bar */}
                      <div
                        className="absolute top-2 h-8 cursor-pointer group"
                        style={style}
                        onClick={() => onTaskClick(task)}
                      >
                        <div
                          className={cn(
                            "h-full rounded-md px-2 flex items-center text-white text-xs font-medium truncate shadow-sm",
                            "group-hover:ring-2 group-hover:ring-offset-1 group-hover:ring-primary/50 transition-all",
                            statusColors[task.status]
                          )}
                        >
                          {task.title}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
