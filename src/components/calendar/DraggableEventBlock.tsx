"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { GripVertical } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { CalendarEvent } from "@/lib/calendar/utils";

interface DraggableEventBlockProps {
  event: CalendarEvent;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (event: CalendarEvent) => void;
  onResizeStart?: (event: CalendarEvent, edge: "top" | "bottom") => void;
  isDragging?: boolean;
}

export function DraggableEventBlock({
  event,
  style,
  className,
  onClick,
  onResizeStart,
  isDragging: externalDragging,
}: DraggableEventBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `event-${event.id}`,
    data: {
      type: "event",
      event,
    },
  });

  const eventColor = event.color || event.calendar?.color || "#3B82F6";
  const isCurrentlyDragging = isDragging || externalDragging;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      onClick?.(event);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, edge: "top" | "bottom") => {
    e.stopPropagation();
    e.preventDefault();
    onResizeStart?.(event, edge);
  };

  const draggableStyle: React.CSSProperties = {
    ...style,
    transform: CSS.Translate.toString(transform),
    opacity: isCurrentlyDragging ? 0.8 : 1,
    zIndex: isCurrentlyDragging ? 100 : undefined,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      className={cn(
        "group absolute w-full rounded-md text-left overflow-hidden transition-shadow select-none",
        "hover:shadow-md hover:z-10",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        isCurrentlyDragging && "shadow-xl ring-2 ring-primary",
        className
      )}
      style={{
        ...draggableStyle,
        backgroundColor: `${eventColor}E6`,
        color: getContrastColor(eventColor),
      }}
    >
      {/* Top resize handle */}
      <div
        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 hover:bg-black/10"
        onMouseDown={(e) => handleResizeMouseDown(e, "top")}
      />

      {/* Drag handle and content */}
      <div className="flex items-start h-full" {...attributes} {...listeners}>
        <div className="flex-shrink-0 pt-1 pl-0.5 opacity-0 group-hover:opacity-50">
          <GripVertical className="h-3 w-3" />
        </div>
        <div className="flex-1 min-w-0 px-1 py-1">
          <div className="font-medium text-sm truncate">{event.title}</div>
          <div className="text-xs opacity-90">
            {format(event.startAt, "HH:mm", { locale: fr })} -{" "}
            {format(event.endAt, "HH:mm", { locale: fr })}
          </div>
        </div>
      </div>

      {/* Bottom resize handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 hover:bg-black/10"
        onMouseDown={(e) => handleResizeMouseDown(e, "bottom")}
      />
    </div>
  );
}

// Helper to get contrasting text color
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1a1a1a" : "#ffffff";
}
