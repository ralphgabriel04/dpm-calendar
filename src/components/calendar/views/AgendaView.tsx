"use client";

import { useMemo } from "react";
import {
  format,
  startOfDay,
  endOfDay,
  addDays,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { isToday, isEventOnDay, type CalendarEvent } from "@/lib/calendar/utils";
import { Calendar, Clock, MapPin } from "lucide-react";

interface AgendaViewProps {
  date: Date;
  events: CalendarEvent[];
  daysToShow?: number;
  onEventClick?: (event: CalendarEvent) => void;
  className?: string;
}

export function AgendaView({
  date,
  events,
  daysToShow = 14,
  onEventClick,
  className,
}: AgendaViewProps) {
  // Get days to display
  const days = useMemo(() => {
    const start = startOfDay(date);
    const end = addDays(start, daysToShow - 1);
    return eachDayOfInterval({ start, end });
  }, [date, daysToShow]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();

    days.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      const dayEvents = events
        .filter((event) => isEventOnDay(event.startAt, event.endAt, day))
        .sort((a, b) => {
          // All-day events first, then by start time
          if (a.isAllDay && !b.isAllDay) return -1;
          if (!a.isAllDay && b.isAllDay) return 1;
          return a.startAt.getTime() - b.startAt.getTime();
        });

      if (dayEvents.length > 0) {
        grouped.set(dayKey, dayEvents);
      }
    });

    return grouped;
  }, [days, events]);

  // Check if there are any events
  const hasEvents = eventsByDay.size > 0;

  return (
    <div className={cn("flex flex-col h-full overflow-auto", className)}>
      {!hasEvents ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
          <Calendar className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">Aucun événement à venir</p>
          <p className="text-sm">
            Les événements des {daysToShow} prochains jours apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {days.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(dayKey);

            if (!dayEvents) return null;

            return (
              <div key={dayKey} className="p-4">
                {/* Day header */}
                <div
                  className={cn(
                    "flex items-center gap-2 mb-3",
                    isToday(day) && "text-primary"
                  )}
                >
                  <div
                    className={cn(
                      "text-2xl font-bold",
                      isToday(day) &&
                        "bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  <div>
                    <div className="font-medium">
                      {format(day, "EEEE", { locale: fr })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(day, "MMMM yyyy", { locale: fr })}
                    </div>
                  </div>
                </div>

                {/* Events */}
                <div className="space-y-2 ml-12">
                  {dayEvents.map((event) => (
                    <AgendaEventCard
                      key={event.id}
                      event={event}
                      onClick={() => onEventClick?.(event)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface AgendaEventCardProps {
  event: CalendarEvent;
  onClick?: () => void;
}

function AgendaEventCard({ event, onClick }: AgendaEventCardProps) {
  const eventColor = event.color || event.calendar?.color || "#3B82F6";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg border transition-all",
        "hover:shadow-md hover:border-primary/50",
        "focus:outline-none focus:ring-2 focus:ring-ring"
      )}
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: eventColor,
      }}
    >
      <div className="font-medium">{event.title}</div>

      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {event.isAllDay ? (
            <span>Toute la journée</span>
          ) : (
            <span>
              {format(event.startAt, "HH:mm")} - {format(event.endAt, "HH:mm")}
            </span>
          )}
        </div>

        {event.calendar && (
          <div className="flex items-center gap-1">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: eventColor }}
            />
            <span>{event.calendar.name}</span>
          </div>
        )}
      </div>
    </button>
  );
}
