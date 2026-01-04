"use client";

import { useMemo } from "react";
import { format, isToday, isSameDay, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/calendar/utils";

interface UpcomingEventsWidgetProps {
  events: CalendarEvent[];
  date?: Date;
  onEventClick?: (event: CalendarEvent) => void;
  onViewAll?: () => void;
  className?: string;
  maxEvents?: number;
}

export function UpcomingEventsWidget({
  events,
  date = new Date(),
  onEventClick,
  onViewAll,
  className,
  maxEvents = 5,
}: UpcomingEventsWidgetProps) {
  // Filter events for the specified day, sorted by start time
  const todayEvents = useMemo(() => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    return events
      .filter((event) => {
        const eventStart = new Date(event.startAt);
        return eventStart >= dayStart && eventStart <= dayEnd;
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, maxEvents);
  }, [events, date, maxEvents]);

  const formatTime = (dateTime: Date) => {
    return format(new Date(dateTime), "HH:mm");
  };

  const title = isToday(date)
    ? "Événements aujourd'hui"
    : `Événements - ${format(date, "d MMMM", { locale: fr })}`;

  return (
    <div className={cn("rounded-xl bg-card border p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {onViewAll && todayEvents.length > 0 && (
          <button
            onClick={onViewAll}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Voir tout
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Events list */}
      {todayEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucun événement
        </p>
      ) : (
        <div className="space-y-2">
          {todayEvents.map((event) => {
            const eventColor = event.color || event.calendar?.color || "#3b82f6";
            const isPast = new Date(event.endAt) < new Date();

            return (
              <div
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer",
                  "hover:bg-accent/50",
                  isPast && "opacity-60"
                )}
              >
                {/* Status indicator */}
                <div className="flex-shrink-0">
                  {isPast ? (
                    <CheckCircle2
                      className="h-5 w-5"
                      style={{ color: eventColor }}
                    />
                  ) : (
                    <Circle
                      className="h-5 w-5"
                      style={{ color: eventColor }}
                    />
                  )}
                </div>

                {/* Event info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      isPast && "line-through"
                    )}
                  >
                    {event.title}
                  </p>
                </div>

                {/* Time */}
                <div className="flex-shrink-0 text-xs text-muted-foreground">
                  {event.isAllDay ? (
                    "Toute la journée"
                  ) : (
                    `${formatTime(event.startAt)} - ${formatTime(event.endAt)}`
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show more indicator */}
      {events.filter((e) => isSameDay(new Date(e.startAt), date)).length > maxEvents && (
        <button
          onClick={onViewAll}
          className="w-full mt-2 pt-2 border-t text-xs text-muted-foreground hover:text-foreground text-center"
        >
          +{events.filter((e) => isSameDay(new Date(e.startAt), date)).length - maxEvents} autres
        </button>
      )}
    </div>
  );
}
