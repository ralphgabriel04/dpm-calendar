"use client";

import { useRef } from "react";
import { startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { TimeColumn } from "../TimeColumn";
import { DayColumn } from "../DayColumn";
import { CalendarHeader } from "../CalendarHeader";
import { AllDayRow } from "../AllDayRow";
import type { CalendarEvent } from "@/lib/calendar/utils";

interface Task {
  id: string;
  title: string;
  plannedDuration?: number | null;
}

interface WeekViewProps {
  date: Date;
  events: CalendarEvent[];
  startHour?: number;
  endHour?: number;
  hourHeight?: number;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date, time: Date) => void;
  onEventMove?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onEventResize?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onTaskDrop?: (task: Task, startAt: Date, endAt: Date) => void;
  className?: string;
}

export function WeekView({
  date,
  events,
  startHour = 6,
  endHour = 22,
  hourHeight = 60,
  onEventClick,
  onSlotClick,
  onEventResize,
  className,
}: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get days of the week
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const totalHeight = (endHour - startHour) * hourHeight;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <CalendarHeader days={days} />

      {/* All-day events */}
      <AllDayRow days={days} events={events} onEventClick={onEventClick} />

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="flex" style={{ minHeight: totalHeight }}>
          {/* Time column */}
          <TimeColumn
            startHour={startHour}
            endHour={endHour}
            hourHeight={hourHeight}
          />

          {/* Day columns */}
          <div className="flex-1 flex">
            {days.map((day) => (
              <DayColumn
                key={day.toISOString()}
                date={day}
                events={events}
                startHour={startHour}
                endHour={endHour}
                hourHeight={hourHeight}
                onEventClick={onEventClick}
                onSlotClick={onSlotClick}
                onEventResize={onEventResize}
                enableDragDrop={true}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
