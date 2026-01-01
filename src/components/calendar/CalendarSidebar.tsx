"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MiniCalendar } from "./MiniCalendar";
import { cn } from "@/lib/utils";

interface Calendar {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  provider: string;
}

interface CalendarSidebarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  calendars: Calendar[];
  onToggleCalendar: (id: string) => void;
  onCreateEvent?: () => void;
  onCreateCalendar?: () => void;
  className?: string;
}

export function CalendarSidebar({
  currentDate,
  onDateChange,
  calendars,
  onToggleCalendar,
  onCreateEvent,
  onCreateCalendar,
  className,
}: CalendarSidebarProps) {
  const [isCalendarsExpanded, setIsCalendarsExpanded] = useState(true);

  // Group calendars by provider
  const localCalendars = calendars.filter((c) => c.provider === "LOCAL");
  const externalCalendars = calendars.filter((c) => c.provider !== "LOCAL");

  return (
    <div className={cn("flex flex-col h-full bg-card border-r", className)}>
      {/* Create event button */}
      {onCreateEvent && (
        <div className="p-3">
          <Button onClick={onCreateEvent} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Nouvel événement
          </Button>
        </div>
      )}

      {/* Mini calendar */}
      <div className="border-b">
        <MiniCalendar value={currentDate} onChange={onDateChange} />
      </div>

      {/* Calendars list */}
      <div className="flex-1 overflow-auto p-3">
        <button
          onClick={() => setIsCalendarsExpanded(!isCalendarsExpanded)}
          className="flex items-center gap-1 w-full text-sm font-medium mb-2 hover:text-primary transition-colors"
        >
          {isCalendarsExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Mes calendriers
        </button>

        {isCalendarsExpanded && (
          <div className="space-y-1">
            {/* Local calendars */}
            {localCalendars.map((calendar) => (
              <CalendarItem
                key={calendar.id}
                calendar={calendar}
                onToggle={() => onToggleCalendar(calendar.id)}
              />
            ))}

            {/* External calendars */}
            {externalCalendars.length > 0 && (
              <>
                <div className="text-xs text-muted-foreground mt-3 mb-1">
                  Calendriers externes
                </div>
                {externalCalendars.map((calendar) => (
                  <CalendarItem
                    key={calendar.id}
                    calendar={calendar}
                    onToggle={() => onToggleCalendar(calendar.id)}
                  />
                ))}
              </>
            )}

            {/* Add calendar button */}
            {onCreateCalendar && (
              <button
                onClick={onCreateCalendar}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
                Ajouter un calendrier
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface CalendarItemProps {
  calendar: Calendar;
  onToggle: () => void;
}

function CalendarItem({ calendar, onToggle }: CalendarItemProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/50 group">
      <button
        onClick={onToggle}
        className={cn(
          "h-4 w-4 rounded border-2 flex items-center justify-center transition-colors",
          calendar.isVisible
            ? "border-transparent"
            : "border-muted-foreground/30"
        )}
        style={{
          backgroundColor: calendar.isVisible ? calendar.color : "transparent",
        }}
      >
        {calendar.isVisible && (
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>
      <span
        className={cn(
          "flex-1 text-sm truncate",
          !calendar.isVisible && "text-muted-foreground"
        )}
      >
        {calendar.name}
      </span>
      <button
        onClick={onToggle}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
      >
        {calendar.isVisible ? (
          <Eye className="h-3.5 w-3.5" />
        ) : (
          <EyeOff className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
