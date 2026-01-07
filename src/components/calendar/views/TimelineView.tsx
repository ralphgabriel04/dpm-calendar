"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import {
  format,
  startOfDay,
  endOfDay,
  addDays,
  addHours,
  differenceInMinutes,
  differenceInHours,
  isSameDay,
  subDays,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, GripHorizontal, Calendar } from "lucide-react";
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

const HOUR_WIDTH = 40; // pixels per hour
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Initialize after mount to avoid hydration issues
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());

    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const startDate = startOfDay(currentDate);
  const endDate = endOfDay(addDays(startDate, daysToShow - 1));
  const totalHours = differenceInHours(endDate, startDate) + 24;
  const totalWidth = totalHours * HOUR_WIDTH;

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

    const left = (startOffset / 60) * HOUR_WIDTH;
    const width = Math.max((duration / 60) * HOUR_WIDTH, 30); // minimum 30px

    return { left, width };
  };

  // Navigate by days
  const navigate = (direction: "prev" | "next") => {
    const daysDelta = direction === "next" ? 1 : -1;
    onDateChange(addDays(currentDate, daysDelta));
  };

  // Jump to today
  const goToToday = () => {
    onDateChange(new Date());
  };

  // Drag to scroll handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.clientX);
    setScrollLeftStart(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = "grabbing";
    scrollContainerRef.current.style.userSelect = "none";
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const dx = e.clientX - startX;
    scrollContainerRef.current.scrollLeft = scrollLeftStart - dx;
  }, [isDragging, startX, scrollLeftStart]);

  const handleMouseUp = useCallback(() => {
    if (!scrollContainerRef.current) return;
    setIsDragging(false);
    scrollContainerRef.current.style.cursor = "grab";
    scrollContainerRef.current.style.userSelect = "auto";
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging && scrollContainerRef.current) {
      setIsDragging(false);
      scrollContainerRef.current.style.cursor = "grab";
      scrollContainerRef.current.style.userSelect = "auto";
    }
  }, [isDragging]);

  // Wheel scroll for horizontal navigation
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!scrollContainerRef.current) return;
    // Use shift+scroll or just scroll for horizontal navigation
    if (e.deltaX !== 0) {
      scrollContainerRef.current.scrollLeft += e.deltaX;
    } else {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  // Current time indicator position
  const nowPosition = useMemo(() => {
    if (!mounted || !currentTime) return null;
    const now = currentTime;
    if (now < startDate || now > endDate) return null;
    const nowOffset = differenceInMinutes(now, startDate);
    return (nowOffset / 60) * HOUR_WIDTH;
  }, [mounted, currentTime, startDate, endDate]);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (mounted && nowPosition !== null && scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      const scrollPosition = Math.max(0, nowPosition - containerWidth / 3);
      scrollContainerRef.current.scrollLeft = scrollPosition;
    }
  }, [mounted, nowPosition]);

  return (
    <div className={cn("flex flex-col h-full max-h-full overflow-hidden bg-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            <Calendar className="h-4 w-4 mr-2" />
            Aujourd'hui
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm font-medium ml-2">
            {format(startDate, "d MMM", { locale: fr })} - {format(endDate, "d MMM yyyy", { locale: fr })}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GripHorizontal className="h-4 w-4" />
          <span>Glissez pour naviguer</span>
        </div>
      </div>

      {/* Timeline container with drag support */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto cursor-grab select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      >
        <div ref={containerRef} style={{ width: totalWidth }}>
          {/* Day headers */}
          <div
            className="sticky top-0 z-20 flex border-b bg-background"
            style={{ height: HEADER_HEIGHT }}
          >
            {days.map((day, i) => {
              const isToday = mounted && currentTime && isSameDay(day, currentTime);
              return (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col items-center justify-center border-r",
                    isToday && "bg-primary/5"
                  )}
                  style={{ width: 24 * HOUR_WIDTH }}
                >
                  <span className="text-xs text-muted-foreground">
                    {format(day, "EEEE", { locale: fr })}
                  </span>
                  <span
                    className={cn(
                      "text-lg font-semibold",
                      isToday && "text-primary"
                    )}
                  >
                    {format(day, "d MMM", { locale: fr })}
                  </span>
                </div>
              );
            })}
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
                style={{ width: HOUR_WIDTH }}
              >
                {format(hour, "HH")}h
              </div>
            ))}
          </div>

          {/* Events area */}
          <div className="relative" style={{ minHeight: Math.max(rows.length * ROW_HEIGHT + 100, 200) }}>
            {/* Hour grid lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {hours.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "border-r",
                    i % 24 === 0 ? "border-border" : "border-border/30"
                  )}
                  style={{ width: HOUR_WIDTH }}
                />
              ))}
            </div>

            {/* Current time indicator */}
            {mounted && nowPosition !== null && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      className={cn(
                        "absolute top-1 bottom-1 rounded-md px-2 py-1 overflow-hidden cursor-pointer pointer-events-auto",
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
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
                Aucun evenement sur cette periode
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
