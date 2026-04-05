"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { startOfDay, endOfDay, addMinutes, differenceInMinutes } from "date-fns";
import { cn } from "@/shared/lib/utils";
import { DraggableEventBlock } from "./DraggableEventBlock";
import { CurrentTimeIndicator } from "./CurrentTimeIndicator";
import {
  calculateEventPosition,
  groupOverlappingEvents,
  isToday,
  type CalendarEvent,
} from "@/lib/calendar/utils";

interface DayColumnProps {
  date: Date;
  events: CalendarEvent[];
  startHour?: number;
  endHour?: number;
  hourHeight?: number;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date, time: Date) => void;
  onEventMove?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onEventResize?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  className?: string;
  enableDragDrop?: boolean;
}

export function DayColumn({
  date,
  events,
  startHour = 0,
  endHour = 24,
  hourHeight = 60,
  onEventClick,
  onSlotClick,
  onEventMove,
  onEventResize,
  className,
  enableDragDrop = true,
}: DayColumnProps) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const totalHours = endHour - startHour;
  const totalHeight = totalHours * hourHeight;
  const columnRef = useRef<HTMLDivElement>(null);

  // Resize state
  const [resizing, setResizing] = useState<{
    event: CalendarEvent;
    edge: "top" | "bottom";
    startY: number;
    originalStart: Date;
    originalEnd: Date;
  } | null>(null);

  // Droppable setup
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${date.toISOString()}`,
    data: {
      type: "dayColumn",
      date,
      startHour,
      hourHeight,
    },
  });

  // Group overlapping events
  const { events: positionedEvents } = groupOverlappingEvents(events, date);

  // Handle click on empty slot
  const handleSlotClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSlotClick || resizing) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const totalMinutes = (y / hourHeight) * 60 + startHour * 60;
    const roundedMinutes = Math.round(totalMinutes / 15) * 15;

    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;

    const clickedTime = new Date(date);
    clickedTime.setHours(hours, minutes, 0, 0);

    onSlotClick(date, clickedTime);
  };

  // Handle resize start
  const handleResizeStart = useCallback((event: CalendarEvent, edge: "top" | "bottom") => {
    setResizing({
      event,
      edge,
      startY: 0,
      originalStart: event.startAt,
      originalEnd: event.endAt,
    });
  }, []);

  // Handle resize move and end
  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!columnRef.current) return;

      const rect = columnRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const totalMinutes = (y / hourHeight) * 60 + startHour * 60;
      const roundedMinutes = Math.round(totalMinutes / 15) * 15;

      const newTime = new Date(date);
      newTime.setHours(Math.floor(roundedMinutes / 60), roundedMinutes % 60, 0, 0);

      if (resizing.edge === "top") {
        // Ensure start is before end
        if (newTime < resizing.originalEnd) {
          const duration = differenceInMinutes(resizing.originalEnd, newTime);
          if (duration >= 15) {
            onEventResize?.(resizing.event, newTime, resizing.originalEnd);
          }
        }
      } else {
        // Ensure end is after start
        if (newTime > resizing.originalStart) {
          const duration = differenceInMinutes(newTime, resizing.originalStart);
          if (duration >= 15) {
            onEventResize?.(resizing.event, resizing.originalStart, newTime);
          }
        }
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, date, hourHeight, startHour, onEventResize]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (columnRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={cn(
        "relative flex-1 border-r last:border-r-0",
        isToday(date) && "bg-primary/5",
        isOver && "bg-primary/10",
        resizing && "cursor-ns-resize",
        className
      )}
      style={{ height: totalHeight }}
      onClick={handleSlotClick}
    >
      {/* Hour grid lines */}
      {Array.from({ length: totalHours }).map((_, i) => (
        <div
          key={i}
          className="absolute w-full border-b border-border/50"
          style={{ top: i * hourHeight, height: hourHeight }}
        >
          {/* Half-hour line */}
          <div
            className="absolute w-full border-b border-border/25"
            style={{ top: hourHeight / 2 }}
          />
        </div>
      ))}

      {/* Current time indicator */}
      {isToday(date) && (
        <CurrentTimeIndicator
          startHour={startHour}
          endHour={endHour}
          hourHeight={hourHeight}
        />
      )}

      {/* Events */}
      <div className="absolute inset-0 px-0.5">
        {positionedEvents.map(({ event, column, totalColumns }) => {
          const { top, height } = calculateEventPosition(
            event.startAt,
            event.endAt,
            dayStart,
            dayEnd,
            hourHeight,
            startHour
          );

          const width = 100 / totalColumns;
          const left = column * width;

          return enableDragDrop ? (
            <DraggableEventBlock
              key={event.id}
              event={event}
              onClick={onEventClick}
              onResizeStart={handleResizeStart}
              style={{
                top: `${top}px`,
                height: `${Math.max(height, 20)}px`,
                left: `${left}%`,
                width: `calc(${width}% - 2px)`,
              }}
            />
          ) : (
            <div
              key={event.id}
              className="absolute rounded-md px-2 py-1 text-sm cursor-pointer overflow-hidden"
              style={{
                top: `${top}px`,
                height: `${Math.max(height, 20)}px`,
                left: `${left}%`,
                width: `calc(${width}% - 2px)`,
                backgroundColor: `${event.color || "#3B82F6"}E6`,
                color: "#fff",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onEventClick?.(event);
              }}
            >
              <div className="font-medium truncate">{event.title}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
