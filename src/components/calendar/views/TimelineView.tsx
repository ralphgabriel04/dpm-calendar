"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import {
  format,
  startOfDay,
  endOfDay,
  addDays,
  addHours,
  differenceInMinutes,
  differenceInHours,
  isSameDay,
  isWithinInterval,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/calendar/utils";

interface TimelineViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  daysToShow?: number;
  className?: string;
}

interface TimelineRow {
  events: CalendarEvent[];
}

const HOUR_WIDTH = 60; // pixels per hour at zoom level 1
const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 60;
const TIME_HEADER_HEIGHT = 30;

export function TimelineView({
  events,
  currentDate,
  onDateChange,
  onEventClick,
  daysToShow = 7,
  className,
}: TimelineViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0);

  const startDate = startOfDay(currentDate);
  const endDate = endOfDay(addDays(startDate, daysToShow - 1));
  const totalHours = differenceInHours(endDate, startDate) + 24;
  const hourWidth = HOUR_WIDTH * zoomLevel;
  const totalWidth = totalHours * hourWidth;

  // Generate hours array for the header
  const hours = useMemo(() => {
    const result: Date[] = [];
    let current = startDate;
    while (current <= endDate) {
      for (let h = 0; h < 24; h++) {
        result.push(addHours(startOfDay(current), h));
      }
      current = addDays(current, 1);
    }
    return result;
  }, [startDate, endDate]);

  // Generate days array
  const days = useMemo(() => {
    const result: Date[] = [];
    let current = startDate;
    while (current <= endDate) {
      result.push(current);
      current = addDays(current, 1);
    }
    return result;
  }, [startDate, endDate]);

  // Filter and arrange events in rows (to prevent overlap)
  const rows = useMemo(() => {
    const filteredEvents = events.filter((event) => {
      const eventStart = new Date(event.startAt);
      const eventEnd = new Date(event.endAt);
      return eventStart <= endDate && eventEnd >= startDate;
    });

    // Sort by start time
    const sortedEvents = [...filteredEvents].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );

    // Arrange into rows
    const rows: TimelineRow[] = [];

    for (const event of sortedEvents) {
      const eventStart = new Date(event.startAt);
      const eventEnd = new Date(event.endAt);

      // Find a row where this event doesn't overlap
      let placed = false;
      for (const row of rows) {
        const hasOverlap = row.events.some((e) => {
          const eStart = new Date(e.startAt);
          const eEnd = new Date(e.endAt);
          return eventStart < eEnd && eventEnd > eStart;
        });

        if (!hasOverlap) {
          row.events.push(event);
          placed = true;
          break;
        }
      }

      if (!placed) {
        rows.push({ events: [event] });
      }
    }

    return rows;
  }, [events, startDate, endDate]);

  // Calculate event position and width
  const getEventStyle = (event: CalendarEvent) => {
    const eventStart = new Date(event.startAt);
    const eventEnd = new Date(event.endAt);

    // Clamp to visible range
    const clampedStart = eventStart < startDate ? startDate : eventStart;
    const clampedEnd = eventEnd > endDate ? endDate : eventEnd;

    const startOffset = differenceInMinutes(clampedStart, startDate);
    const duration = differenceInMinutes(clampedEnd, clampedStart);

    const left = (startOffset / 60) * hourWidth;
    const width = Math.max((duration / 60) * hourWidth, 30); // minimum 30px

    return { left, width };
  };

  // Handle zoom
  const handleZoom = (direction: "in" | "out") => {
    setZoomLevel((prev) => {
      if (direction === "in") return Math.min(prev * 1.5, 4);
      return Math.max(prev / 1.5, 0.25);
    });
  };

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  // Navigate
  const navigate = (direction: "prev" | "next") => {
    const days = direction === "next" ? daysToShow : -daysToShow;
    onDateChange(addDays(currentDate, days));
  };

  // Current time indicator position
  const now = new Date();
  const nowOffset = differenceInMinutes(now, startDate);
  const nowPosition = (nowOffset / 60) * hourWidth;
  const showNowLine = now >= startDate && now <= endDate;

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium ml-2">
            {format(startDate, "d MMM", { locale: fr })} - {format(endDate, "d MMM yyyy", { locale: fr })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleZoom("out")}
            disabled={zoomLevel <= 0.25}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleZoom("in")}
            disabled={zoomLevel >= 4}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
      >
        <div style={{ width: totalWidth, minHeight: "100%" }}>
          {/* Day headers */}
          <div
            className="sticky top-0 z-20 flex border-b bg-background"
            style={{ height: HEADER_HEIGHT }}
          >
            {days.map((day, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col items-center justify-center border-r",
                  isSameDay(day, new Date()) && "bg-primary/5"
                )}
                style={{ width: 24 * hourWidth }}
              >
                <span className="text-xs text-muted-foreground">
                  {format(day, "EEEE", { locale: fr })}
                </span>
                <span
                  className={cn(
                    "text-lg font-semibold",
                    isSameDay(day, new Date()) && "text-primary"
                  )}
                >
                  {format(day, "d MMM", { locale: fr })}
                </span>
              </div>
            ))}
          </div>

          {/* Hour headers */}
          <div
            className="sticky top-[60px] z-10 flex border-b bg-muted/50"
            style={{ height: TIME_HEADER_HEIGHT }}
          >
            {hours.map((hour, i) => (
              <div
                key={i}
                className="flex items-center justify-center border-r text-xs text-muted-foreground"
                style={{ width: hourWidth }}
              >
                {format(hour, "HH:mm")}
              </div>
            ))}
          </div>

          {/* Events area */}
          <div className="relative" style={{ minHeight: rows.length * ROW_HEIGHT + 100 }}>
            {/* Hour grid lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {hours.map((_, i) => (
                <div
                  key={i}
                  className="border-r border-border/30"
                  style={{ width: hourWidth }}
                />
              ))}
            </div>

            {/* Current time indicator */}
            {showNowLine && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30"
                style={{ left: nowPosition }}
              >
                <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
              </div>
            )}

            {/* Event rows */}
            {rows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="relative"
                style={{ height: ROW_HEIGHT }}
              >
                {row.events.map((event) => {
                  const { left, width } = getEventStyle(event);
                  const eventColor = event.color || event.calendar?.color || "#3b82f6";

                  return (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className={cn(
                        "absolute top-1 bottom-1 rounded-md px-2 py-1 overflow-hidden cursor-pointer",
                        "hover:ring-2 hover:ring-ring hover:ring-offset-1 transition-all",
                        "text-white text-xs font-medium truncate"
                      )}
                      style={{
                        left,
                        width,
                        backgroundColor: eventColor,
                      }}
                      title={`${event.title}\n${format(new Date(event.startAt), "HH:mm")} - ${format(new Date(event.endAt), "HH:mm")}`}
                    >
                      <span className="truncate">{event.title}</span>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Empty state */}
            {rows.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                Aucun evenement sur cette periode
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
