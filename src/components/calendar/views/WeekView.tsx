"use client";

import { useRef, useEffect, useState } from "react";
import { startOfWeek, endOfWeek, eachDayOfInterval, isToday, addMinutes } from "date-fns";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { TimeColumn } from "../TimeColumn";
import { DayColumn } from "../DayColumn";
import { CalendarHeader } from "../CalendarHeader";
import { AllDayRow } from "../AllDayRow";
import { DraggableEventBlock } from "../DraggableEventBlock";
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
  onEventMove,
  onEventResize,
  onTaskDrop,
  className,
}: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  // Configure sensors for drag detection
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // Get days of the week
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Check if current week contains today
  const weekContainsToday = days.some(day => isToday(day));

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current && weekContainsToday) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();

      // Calculate scroll position (scroll to 1 hour before current time)
      const scrollHour = Math.max(startHour, currentHour - 1);
      const minutesFromStart = (scrollHour - startHour) * 60 + currentMinutes;
      const scrollPosition = (minutesFromStart / 60) * hourHeight;

      scrollRef.current.scrollTop = scrollPosition;
    }
  }, [date, startHour, hourHeight, weekContainsToday]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedEvent = active.data.current?.event as CalendarEvent | undefined;
    if (draggedEvent) {
      setActiveEvent(draggedEvent);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEvent(null);

    if (!over) return;

    const dragData = active.data.current;
    const dropData = over.data.current;

    if (!dropData || dropData.type !== "dayColumn") return;

    const { date: dropDate, startHour: dropStartHour, hourHeight: dropHourHeight } = dropData as {
      date: Date;
      startHour: number;
      hourHeight: number;
    };

    // Calculate drop position from the pointer position
    let newStart = new Date(dropDate);

    if (over.rect && event.activatorEvent) {
      const activatorEvent = event.activatorEvent as MouseEvent | TouchEvent;
      let clientY = 0;

      if ('clientY' in activatorEvent) {
        clientY = activatorEvent.clientY;
      } else if ('touches' in activatorEvent && activatorEvent.touches[0]) {
        clientY = activatorEvent.touches[0].clientY;
      }

      const finalY = clientY + (event.delta?.y || 0);
      const relativeY = finalY - over.rect.top;

      const totalMinutes = (relativeY / (dropHourHeight || 60)) * 60 + (dropStartHour || 0) * 60;
      const roundedMinutes = Math.round(totalMinutes / 15) * 15;

      const hours = Math.floor(roundedMinutes / 60);
      const minutes = roundedMinutes % 60;

      const clampedHours = Math.max(0, Math.min(23, hours));
      newStart.setHours(clampedHours, minutes >= 0 ? minutes : 0, 0, 0);
    } else {
      newStart.setHours(dropStartHour || startHour, 0, 0, 0);
    }

    // Handle task drop
    if (dragData?.type === "task" && onTaskDrop) {
      const task = dragData.task as Task;
      const duration = task.plannedDuration || 60;
      const newEnd = addMinutes(newStart, duration);

      onTaskDrop(task, newStart, newEnd);
      return;
    }

    // Handle event move (cross-day support)
    if (dragData?.event && onEventMove) {
      const draggedEvent = dragData.event as CalendarEvent;
      const duration = draggedEvent.endAt.getTime() - draggedEvent.startAt.getTime();
      const newEnd = new Date(newStart.getTime() + duration);

      onEventMove(draggedEvent, newStart, newEnd);
    }
  };

  const totalHeight = (endHour - startHour) * hourHeight;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("flex flex-col h-full", className)}>
        {/* Header */}
        <CalendarHeader days={days} />

        {/* All-day events */}
        <AllDayRow days={days} events={events} onEventClick={onEventClick} />

        {/* Time grid */}
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <div className="flex" style={{ minHeight: totalHeight + 12 }}>
            {/* Time column */}
            <TimeColumn
              startHour={startHour}
              endHour={endHour}
              hourHeight={hourHeight}
            />

            {/* Day columns */}
            <div className="flex-1 flex flex-col">
              {/* Top padding to align with TimeColumn */}
              <div className="h-3 flex-shrink-0" />
              <div className="flex flex-1">
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
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeEvent && (
          <DraggableEventBlock
            event={activeEvent}
            isDragging={true}
            style={{
              width: 200,
              height: 60,
            }}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
