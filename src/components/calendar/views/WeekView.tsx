"use client";

import { useRef, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { startOfWeek, endOfWeek, eachDayOfInterval, addMinutes, differenceInMinutes } from "date-fns";
import { useState } from "react";
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

  // Sensors for drag
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
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

  const totalHeight = (endHour - startHour) * hourHeight;

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const eventData = active.data.current?.event as CalendarEvent | undefined;
    if (eventData) {
      setActiveEvent(eventData);
    }
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveEvent(null);

      if (!over) return;

      const dragData = active.data.current;
      const dropData = over.data.current as {
        type: string;
        date: Date;
        startHour: number;
        hourHeight: number;
      } | undefined;

      if (!dropData || dropData.type !== "dayColumn") return;

      // Get the pointer position from the drag event
      const pointerEvent = event.activatorEvent as MouseEvent | TouchEvent;
      let pointerY: number;

      if ('touches' in pointerEvent) {
        pointerY = pointerEvent.touches[0]?.clientY ?? 0;
      } else {
        pointerY = pointerEvent.clientY;
      }

      // Get the scroll container and calculate position
      const scrollTop = scrollRef.current?.scrollTop || 0;
      const containerRect = scrollRef.current?.getBoundingClientRect();

      if (!containerRect) return;

      // Calculate relative position within the time grid
      const relativeY = pointerY - containerRect.top + scrollTop;

      // Calculate minutes from top
      const minutesFromTop = (relativeY / hourHeight) * 60;
      const roundedMinutes = Math.round(minutesFromTop / 15) * 15;
      const totalMinutes = startHour * 60 + roundedMinutes;

      const newHour = Math.min(Math.max(Math.floor(totalMinutes / 60), startHour), endHour - 1);
      const newMinute = totalMinutes % 60;

      // Handle task drop
      if (dragData?.type === "task" && onTaskDrop) {
        const task = dragData.task as Task;
        const duration = task.plannedDuration || 60; // Default to 1 hour

        const newStart = new Date(dropData.date);
        newStart.setHours(newHour, newMinute, 0, 0);
        const newEnd = addMinutes(newStart, duration);

        onTaskDrop(task, newStart, newEnd);
        return;
      }

      // Handle event move
      if (dragData?.event && onEventMove) {
        const eventData = dragData.event as CalendarEvent;
        const duration = differenceInMinutes(eventData.endAt, eventData.startAt);

        const newStart = new Date(dropData.date);
        newStart.setHours(newHour, newMinute, 0, 0);
        const newEnd = addMinutes(newStart, duration);

        onEventMove(eventData, newStart, newEnd);
      }
    },
    [onEventMove, onTaskDrop, hourHeight, startHour, endHour]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
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

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {activeEvent && (
          <div
            className="rounded-md px-2 py-1 shadow-xl opacity-90"
            style={{
              backgroundColor: activeEvent.color || "#3B82F6",
              color: "#fff",
              width: 150,
            }}
          >
            <div className="font-medium text-sm truncate">{activeEvent.title}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
