"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { EventBlock } from "../EventBlock";
import { MonthCalendarHeader } from "../CalendarHeader";
import { isToday, isEventOnDay, type CalendarEvent } from "@/lib/calendar/utils";

interface MonthViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: Date) => void;
  className?: string;
  maxEventsPerDay?: number;
}

export function MonthView({
  date,
  events,
  onEventClick,
  onDayClick,
  className,
  maxEventsPerDay = 3,
}: MonthViewProps) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group days into weeks
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  days.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // Get events for a specific day
  const getEventsForDay = (day: Date): CalendarEvent[] => {
    return events.filter((event) =>
      isEventOnDay(event.startAt, event.endAt, day)
    );
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <MonthCalendarHeader />

      {/* Calendar grid */}
      <div className="flex-1 grid grid-rows-6">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, date);
              const visibleEvents = dayEvents.slice(0, maxEventsPerDay);
              const hiddenCount = dayEvents.length - maxEventsPerDay;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[100px] p-1 border-r last:border-r-0 cursor-pointer",
                    "hover:bg-accent/50 transition-colors",
                    !isCurrentMonth && "bg-muted/30",
                    isToday(day) && "bg-primary/5"
                  )}
                  onClick={() => onDayClick?.(day)}
                >
                  {/* Day number */}
                  <div className="flex justify-end">
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

                  {/* Events */}
                  <div className="mt-1 space-y-0.5">
                    {visibleEvents.map((event) => (
                      <EventBlock
                        key={event.id}
                        event={event}
                        onClick={onEventClick}
                        compact
                      />
                    ))}
                    {hiddenCount > 0 && (
                      <button
                        className="w-full text-xs text-muted-foreground hover:text-foreground text-left px-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDayClick?.(day);
                        }}
                      >
                        +{hiddenCount} de plus
                      </button>
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
