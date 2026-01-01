"use client";

import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { isToday } from "@/lib/calendar/utils";

interface CalendarHeaderProps {
  days: Date[];
  showTimeColumn?: boolean;
  className?: string;
}

export function CalendarHeader({
  days,
  showTimeColumn = true,
  className,
}: CalendarHeaderProps) {
  return (
    <div className={cn("flex border-b bg-card sticky top-0 z-10", className)}>
      {/* Time column placeholder */}
      {showTimeColumn && (
        <div className="w-16 flex-shrink-0 border-r" />
      )}

      {/* Day headers */}
      <div className="flex-1 flex">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "flex-1 text-center py-2 border-r last:border-r-0",
              isToday(day) && "bg-primary/5"
            )}
          >
            <div className="text-xs text-muted-foreground uppercase">
              {format(day, "EEE", { locale: fr })}
            </div>
            <div
              className={cn(
                "text-lg font-semibold",
                isToday(day) &&
                  "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto"
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MonthCalendarHeaderProps {
  className?: string;
}

export function MonthCalendarHeader({ className }: MonthCalendarHeaderProps) {
  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className={cn("grid grid-cols-7 border-b bg-card", className)}>
      {weekDays.map((day) => (
        <div
          key={day}
          className="py-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0"
        >
          {day}
        </div>
      ))}
    </div>
  );
}
