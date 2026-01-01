"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableTimeSlotProps {
  id: string;
  date: Date;
  hour: number;
  minutes: number;
  hourHeight: number;
  children?: React.ReactNode;
}

export function DroppableTimeSlot({
  id,
  date,
  hour,
  minutes,
  hourHeight,
  children,
}: DroppableTimeSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: "timeSlot",
      date,
      hour,
      minutes,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute w-full transition-colors",
        isOver && "bg-primary/20"
      )}
      style={{
        top: (hour * 60 + minutes) * (hourHeight / 60),
        height: hourHeight / 4, // 15-minute slot
      }}
    >
      {children}
    </div>
  );
}
