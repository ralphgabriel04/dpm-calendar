"use client";

import { useMemo, useState } from "react";
import { format, isToday, isSameDay, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, Circle, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/calendar/utils";

type ViewType = "day" | "week" | "month" | "agenda" | "timeline" | "workload";
type EventFilter = "all" | "past" | "upcoming";

interface UpcomingEventsWidgetProps {
  events: CalendarEvent[];
  date?: Date;
  viewType?: ViewType;
  onEventClick?: (event: CalendarEvent) => void;
  onViewAll?: () => void;
  className?: string;
  maxEvents?: number;
}

export function UpcomingEventsWidget({
  events,
  date = new Date(),
  viewType = "day",
  onEventClick,
  onViewAll,
  className,
  maxEvents = 5,
}: UpcomingEventsWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filter, setFilter] = useState<EventFilter>("all");

  // Calculate date range based on view type
  const { rangeStart, rangeEnd } = useMemo(() => {
    switch (viewType) {
      case "day":
        return { rangeStart: startOfDay(date), rangeEnd: endOfDay(date) };
      case "week":
      case "timeline":
        return {
          rangeStart: startOfWeek(date, { weekStartsOn: 1 }),
          rangeEnd: endOfWeek(date, { weekStartsOn: 1 }),
        };
      case "month":
      case "workload":
        return {
          rangeStart: startOfMonth(date),
          rangeEnd: endOfMonth(date),
        };
      default:
        return { rangeStart: startOfDay(date), rangeEnd: endOfDay(date) };
    }
  }, [date, viewType]);

  // Filter events for the date range, sorted by start time
  const filteredEvents = useMemo(() => {
    const now = new Date();

    return events
      .filter((event) => {
        const eventStart = new Date(event.startAt);
        const eventEnd = new Date(event.endAt);

        // Check if event is in range
        const inRange = eventStart <= rangeEnd && eventEnd >= rangeStart;
        if (!inRange) return false;

        // Apply filter
        if (filter === "past") {
          return eventEnd < now;
        } else if (filter === "upcoming") {
          return eventStart >= now;
        }
        return true; // "all"
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, maxEvents);
  }, [events, rangeStart, rangeEnd, filter, maxEvents]);

  // Count total events in range
  const totalEventsInRange = useMemo(() => {
    return events.filter((event) => {
      const eventStart = new Date(event.startAt);
      const eventEnd = new Date(event.endAt);
      return eventStart <= rangeEnd && eventEnd >= rangeStart;
    }).length;
  }, [events, rangeStart, rangeEnd]);

  const formatTime = (dateTime: Date) => {
    return format(new Date(dateTime), "HH:mm");
  };

  const formatEventDate = (dateTime: Date) => {
    if (viewType === "day") {
      return formatTime(dateTime);
    }
    return format(new Date(dateTime), "d MMM HH:mm", { locale: fr });
  };

  // Generate title based on view type
  const title = useMemo(() => {
    switch (viewType) {
      case "day":
        return isToday(date)
          ? "Événements aujourd'hui"
          : `Événements - ${format(date, "d MMMM", { locale: fr })}`;
      case "week":
      case "timeline":
        return "Événements de la semaine";
      case "month":
      case "workload":
        return `Événements - ${format(date, "MMMM yyyy", { locale: fr })}`;
      default:
        return "Événements";
    }
  }, [date, viewType]);

  const filters: { value: EventFilter; label: string }[] = [
    { value: "all", label: "Tous" },
    { value: "past", label: "Passés" },
    { value: "upcoming", label: "À venir" },
  ];

  return (
    <div className={cn("rounded-xl bg-card border p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1 text-sm font-semibold hover:text-primary transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {title}
        </button>
        {onViewAll && filteredEvents.length > 0 && !isCollapsed && (
          <button
            onClick={onViewAll}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Voir tout
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Collapsible content */}
      {!isCollapsed && (
        <>
          {/* Filters */}
          <div className="flex gap-1 mb-3">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-colors",
                  filter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Events list */}
          {filteredEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun événement
            </p>
          ) : (
            <div className="space-y-2">
              {filteredEvents.map((event) => {
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
                      ) : viewType === "day" ? (
                        `${formatTime(event.startAt)} - ${formatTime(event.endAt)}`
                      ) : (
                        formatEventDate(event.startAt)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Show more indicator */}
          {totalEventsInRange > maxEvents && (
            <button
              onClick={onViewAll}
              className="w-full mt-2 pt-2 border-t text-xs text-muted-foreground hover:text-foreground text-center"
            >
              +{totalEventsInRange - maxEvents} autres
            </button>
          )}
        </>
      )}
    </div>
  );
}
