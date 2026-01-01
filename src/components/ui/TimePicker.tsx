"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { format, setHours, setMinutes, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Button } from "./Button";
import { Input } from "./Input";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  step?: number; // minutes
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Heure",
  className,
  disabled,
  step = 15,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(
    value ? format(value, "HH:mm") : ""
  );
  const listRef = useRef<HTMLDivElement>(null);

  // Generate time options
  const timeOptions = useMemo(() => {
    const options: Date[] = [];
    const baseDate = value || new Date();
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += step) {
        options.push(setMinutes(setHours(baseDate, h), m));
      }
    }
    return options;
  }, [step, value]);

  // Scroll to selected time when opened
  useEffect(() => {
    if (open && listRef.current && value) {
      const selectedEl = listRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "center" });
      }
    }
  }, [open, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Try to parse time
    if (/^\d{1,2}:\d{2}$/.test(newValue)) {
      try {
        const parsed = parse(newValue, "HH:mm", value || new Date());
        if (!isNaN(parsed.getTime())) {
          onChange(parsed);
        }
      } catch {
        // Invalid time format
      }
    }
  };

  const handleSelect = (time: Date) => {
    onChange(time);
    setInputValue(format(time, "HH:mm"));
    setOpen(false);
  };

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
          <Clock className="mr-2 h-4 w-4" />
          {value ? format(value, "HH:mm") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="HH:mm"
            value={inputValue}
            onChange={handleInputChange}
            className="h-8"
          />
          <div
            ref={listRef}
            className="max-h-48 overflow-y-auto border rounded-md"
          >
            {timeOptions.map((time) => {
              const timeStr = format(time, "HH:mm");
              const isSelected = value && format(value, "HH:mm") === timeStr;
              return (
                <button
                  key={timeStr}
                  data-selected={isSelected}
                  onClick={() => handleSelect(time)}
                  className={cn(
                    "w-full px-3 py-1.5 text-sm text-left hover:bg-accent",
                    isSelected && "bg-primary text-primary-foreground"
                  )}
                >
                  {timeStr}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface TimePickerInlineProps {
  value?: Date;
  onChange: (date: Date) => void;
  className?: string;
  step?: number;
}

export function TimePickerInline({
  value,
  onChange,
  className,
  step = 15,
}: TimePickerInlineProps) {
  const [inputValue, setInputValue] = useState(
    value ? format(value, "HH:mm") : ""
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (/^\d{1,2}:\d{2}$/.test(newValue)) {
      try {
        const parsed = parse(newValue, "HH:mm", value || new Date());
        if (!isNaN(parsed.getTime())) {
          onChange(parsed);
        }
      } catch {
        // Invalid time format
      }
    }
  };

  return (
    <Input
      type="time"
      value={inputValue}
      onChange={handleInputChange}
      className={cn("w-24", className)}
      step={step * 60}
    />
  );
}
