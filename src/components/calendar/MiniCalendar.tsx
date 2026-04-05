"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/utils";

interface MiniCalendarProps {
  value?: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function MiniCalendar({ value, onChange, className }: MiniCalendarProps) {
  // Initialize with value or null to avoid hydration mismatch
  const [viewDate, setViewDate] = useState<Date | null>(value || null);
  const [today, setToday] = useState<Date | null>(null);

  // Set today and viewDate on client mount to avoid hydration mismatch
  useEffect(() => {
    const now = new Date();
    setToday(now);
    if (!viewDate) {
      setViewDate(value || now);
    }
  }, []);

  // Sync viewDate when value changes from external source
  useEffect(() => {
    if (value && viewDate && !isSameMonth(value, viewDate)) {
      setViewDate(value);
    }
  }, [value]);

  // Don't render calendar grid until we have a viewDate
  if (!viewDate) {
    return <div className={cn("p-3 h-[280px]", className)} />;
  }

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));

  return (
    <div className={cn("p-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handlePrevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <button
          className="text-sm font-medium hover:text-primary transition-colors"
          onClick={() => {
            const today = new Date();
            setViewDate(today);
            onChange(today);
          }}
        >
          {format(viewDate, "MMMM yyyy", { locale: fr })}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day, i) => (
          <div
            key={i}
            className="text-center text-xs text-muted-foreground font-medium h-7 flex items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, viewDate);
          const isSelected = value && isSameDay(day, value);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              onClick={() => onChange(day)}
              className={cn(
                "h-7 w-7 text-xs rounded-full transition-colors flex items-center justify-center",
                "hover:bg-accent hover:text-accent-foreground",
                !isCurrentMonth && "text-muted-foreground opacity-50",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                isToday && !isSelected && "border border-primary font-bold"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
