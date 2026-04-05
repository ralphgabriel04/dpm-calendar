"use client";

import { useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Button } from "./Button";
import { cn } from "@/shared/lib/utils";

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Sélectionner une date",
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const handleSelect = useCallback(
    (date: Date) => {
      onChange(date);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {value ? format(value, "d MMMM yyyy", { locale: fr }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewDate(subMonths(viewDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              {format(viewDate, "MMMM yyyy", { locale: fr })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewDate(addMonths(viewDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Week days */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs text-muted-foreground font-medium py-1"
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
                  onClick={() => handleSelect(day)}
                  className={cn(
                    "h-8 w-8 text-sm rounded-md transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    !isCurrentMonth && "text-muted-foreground opacity-50",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                    isToday && !isSelected && "border border-primary",
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Today button */}
          <div className="mt-2 pt-2 border-t">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                const today = new Date();
                setViewDate(today);
                handleSelect(today);
              }}
            >
              Aujourd&apos;hui
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface DatePickerInlineProps {
  value?: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function DatePickerInline({
  value,
  onChange,
  className,
}: DatePickerInlineProps) {
  const [viewDate, setViewDate] = useState(value || new Date());

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div className={cn("p-2", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setViewDate(subMonths(viewDate, 1))}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <div className="text-xs font-medium">
          {format(viewDate, "MMM yyyy", { locale: fr })}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setViewDate(addMonths(viewDate, 1))}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekDays.map((day, i) => (
          <div
            key={i}
            className="text-center text-[10px] text-muted-foreground font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, viewDate);
          const isSelected = value && isSameDay(day, value);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              onClick={() => onChange(day)}
              className={cn(
                "h-6 w-6 text-xs rounded-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                !isCurrentMonth && "text-muted-foreground opacity-40",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                isToday && !isSelected && "font-bold text-primary",
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
