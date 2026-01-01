"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import { Clock, MapPin, Calendar, Trash2, Pencil, X } from "lucide-react";
import type { CalendarEvent } from "@/lib/calendar/utils";

interface EventPopoverProps {
  event: CalendarEvent;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
}

export function EventPopover({
  event,
  children,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: EventPopoverProps) {
  const eventColor = event.color || event.calendar?.color || "#3B82F6";

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {/* Header with color */}
        <div
          className="h-2 rounded-t-md"
          style={{ backgroundColor: eventColor }}
        />

        <div className="p-4">
          {/* Title */}
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold pr-2">{event.title}</h3>
            <button
              onClick={() => onOpenChange?.(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {event.isAllDay ? (
              <span>
                {format(event.startAt, "EEEE d MMMM yyyy", { locale: fr })}
                {" — Toute la journée"}
              </span>
            ) : (
              <span>
                {format(event.startAt, "EEEE d MMMM", { locale: fr })}
                {" · "}
                {format(event.startAt, "HH:mm")} - {format(event.endAt, "HH:mm")}
              </span>
            )}
          </div>

          {/* Calendar */}
          {event.calendar && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <div className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: eventColor }}
                />
                <span>{event.calendar.name}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  onDelete(event);
                  onOpenChange?.(false);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit(event);
                  onOpenChange?.(false);
                }}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Modifier
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
