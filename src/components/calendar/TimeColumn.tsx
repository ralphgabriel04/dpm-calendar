"use client";

import { format, setHours, setMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TimeColumnProps {
  startHour?: number;
  endHour?: number;
  hourHeight?: number;
  className?: string;
}

export function TimeColumn({
  startHour = 0,
  endHour = 24,
  hourHeight = 60,
  className,
}: TimeColumnProps) {
  const hours = [];
  // Use a fixed date to avoid hydration mismatch - only the time formatting matters
  const baseDate = new Date(2024, 0, 1, 0, 0, 0, 0);

  for (let h = startHour; h < endHour; h++) {
    hours.push(setMinutes(setHours(baseDate, h), 0));
  }

  return (
    <div className={cn("relative w-16 flex-shrink-0 border-r", className)}>
      {/* Top padding to ensure 00:00 label is visible */}
      <div className="h-3" />
      {hours.map((hour, index) => (
        <div
          key={index}
          className="relative border-b border-border/50"
          style={{ height: hourHeight }}
        >
          <span className="absolute -top-2.5 right-2 text-xs text-muted-foreground">
            {format(hour, "HH:mm", { locale: fr })}
          </span>
        </div>
      ))}
    </div>
  );
}
