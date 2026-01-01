"use client";

import { useRef, useState } from "react";
import { format, addMinutes } from "date-fns";
import { fr } from "date-fns/locale";
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
import { AllDayRow } from "../AllDayRow";
import { DraggableEventBlock } from "../DraggableEventBlock";
import { isToday } from "@/lib/calendar/utils";
import type { CalendarEvent } from "@/lib/calendar/utils";

interface Task {
  id: string;
  title: string;
  plannedDuration?: number | null;
}

interface DayViewProps {
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

export function DayView({
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
}: DayViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const totalHeight = (endHour - startHour) * hourHeight;
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  // Configure sensors for drag detection
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10, // 10px of movement before drag starts
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

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

    if (!dropData || dropData.type !== "timeSlot") return;

    const { date: dropDate, hour, minutes } = dropData as {
      date: Date;
      hour: number;
      minutes: number;
    };

    // Calculate new start time
    const newStart = new Date(dropDate);
    newStart.setHours(hour, minutes, 0, 0);

    // Handle task drop
    if (dragData?.type === "task" && onTaskDrop) {
      const task = dragData.task as Task;
      const duration = task.plannedDuration || 60; // Default to 1 hour
      const newEnd = addMinutes(newStart, duration);

      onTaskDrop(task, newStart, newEnd);
      return;
    }

    // Handle event move
    if (dragData?.event && onEventMove) {
      const draggedEvent = dragData.event as CalendarEvent;
      const duration = draggedEvent.endAt.getTime() - draggedEvent.startAt.getTime();
      const newEnd = new Date(newStart.getTime() + duration);

      onEventMove(draggedEvent, newStart, newEnd);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("flex flex-col h-full", className)}>
        {/* Header */}
        <div className="flex border-b bg-card sticky top-0 z-10">
          <div className="w-16 flex-shrink-0 border-r" />
          <div
            className={cn(
              "flex-1 text-center py-3",
              isToday(date) && "bg-primary/5"
            )}
          >
            <div className="text-sm text-muted-foreground">
              {format(date, "EEEE", { locale: fr })}
            </div>
            <div
              className={cn(
                "text-2xl font-bold",
                isToday(date) &&
                  "bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center mx-auto"
              )}
            >
              {format(date, "d")}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(date, "MMMM yyyy", { locale: fr })}
            </div>
          </div>
        </div>

        {/* All-day events */}
        <AllDayRow days={[date]} events={events} onEventClick={onEventClick} />

        {/* Time grid */}
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <div className="flex" style={{ minHeight: totalHeight }}>
            {/* Time column */}
            <TimeColumn
              startHour={startHour}
              endHour={endHour}
              hourHeight={hourHeight}
            />

            {/* Day column */}
            <DayColumn
              date={date}
              events={events}
              startHour={startHour}
              endHour={endHour}
              hourHeight={hourHeight}
              onEventClick={onEventClick}
              onSlotClick={onSlotClick}
              onEventMove={onEventMove}
              onEventResize={onEventResize}
              enableDragDrop={true}
            />
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
