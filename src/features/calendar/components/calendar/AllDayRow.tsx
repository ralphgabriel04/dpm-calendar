"use client";

import { cn } from "@/shared/lib/utils";
import { AllDayEventBlock } from "./EventBlock";
import { getAllDayEvents, type CalendarEvent } from "@/lib/calendar/utils";

interface AllDayRowProps {
  days: Date[];
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  className?: string;
}

export function AllDayRow({
  days,
  events,
  onEventClick,
  className,
}: AllDayRowProps) {
  // Get all-day events for each day
  const dayEvents = days.map((day) => getAllDayEvents(events, day));

  // Check if there are any all-day events
  const hasAllDayEvents = dayEvents.some((events) => events.length > 0);

  if (!hasAllDayEvents) {
    return null;
  }

  // Find max number of all-day events in any day
  const maxEvents = Math.max(...dayEvents.map((e) => e.length));

  return (
    <div className={cn("border-b", className)}>
      <div className="flex">
        {/* Time column placeholder */}
        <div className="w-16 flex-shrink-0 border-r px-2 py-1">
          <span className="text-xs text-muted-foreground">Journée</span>
        </div>

        {/* Day columns */}
        <div className="flex-1 flex">
          {days.map((day, dayIndex) => (
            <div
              key={day.toISOString()}
              className="flex-1 border-r last:border-r-0 p-1 space-y-0.5"
              style={{ minHeight: maxEvents * 24 + 8 }}
            >
              {dayEvents[dayIndex].map((event) => (
                <AllDayEventBlock
                  key={event.id}
                  event={event}
                  onClick={onEventClick}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
