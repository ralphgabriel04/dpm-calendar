"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/shared/lib/utils";
import type { CalendarEvent } from "@/lib/calendar/utils";

interface EventBlockProps {
  event: CalendarEvent;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (event: CalendarEvent) => void;
  compact?: boolean;
}

export function EventBlock({
  event,
  style,
  className,
  onClick,
  compact = false,
}: EventBlockProps) {
  const eventColor = event.color || event.calendar?.color || "#3B82F6";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(event);
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "group w-full text-left px-1.5 py-0.5 rounded text-xs truncate transition-opacity hover:opacity-80",
          className
        )}
        style={{
          backgroundColor: `${eventColor}20`,
          borderLeft: `3px solid ${eventColor}`,
          ...style,
        }}
      >
        <span className="font-medium" style={{ color: eventColor }}>
          {format(event.startAt, "HH:mm")}
        </span>{" "}
        <span className="text-foreground">{event.title}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "absolute w-full px-2 py-1 rounded-md text-left overflow-hidden transition-all",
        "hover:shadow-md hover:z-10 cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        className
      )}
      style={{
        backgroundColor: `${eventColor}E6`,
        color: getContrastColor(eventColor),
        ...style,
      }}
    >
      <div className="font-medium text-sm truncate">{event.title}</div>
      <div className="text-xs opacity-90">
        {format(event.startAt, "HH:mm", { locale: fr })} -{" "}
        {format(event.endAt, "HH:mm", { locale: fr })}
      </div>
    </button>
  );
}

// Helper to get contrasting text color
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#1a1a1a" : "#ffffff";
}

// All-day event block
interface AllDayEventBlockProps {
  event: CalendarEvent;
  className?: string;
  onClick?: (event: CalendarEvent) => void;
  span?: number; // number of days this event spans
}

export function AllDayEventBlock({
  event,
  className,
  onClick,
  span = 1,
}: AllDayEventBlockProps) {
  const eventColor = event.color || event.calendar?.color || "#3B82F6";

  return (
    <button
      onClick={() => onClick?.(event)}
      className={cn(
        "px-2 py-0.5 rounded text-xs font-medium truncate transition-opacity hover:opacity-80",
        "focus:outline-none focus:ring-2 focus:ring-ring",
        className
      )}
      style={{
        backgroundColor: eventColor,
        color: getContrastColor(eventColor),
        gridColumn: span > 1 ? `span ${span}` : undefined,
      }}
    >
      {event.title}
    </button>
  );
}
