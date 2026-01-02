"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import { Clock, MapPin, Calendar, Trash2, Pencil, X, MessageSquare, ChevronDown, ChevronUp, Repeat } from "lucide-react";
import { EventComments } from "./EventComments";
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
  const [showComments, setShowComments] = useState(false);
  const eventColor = event.color || event.calendar?.color || "#3B82F6";

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-96 p-0 max-h-[80vh] overflow-auto" align="start">
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
                {" — Toute la journee"}
              </span>
            ) : (
              <span>
                {format(event.startAt, "EEEE d MMMM", { locale: fr })}
                {" · "}
                {format(event.startAt, "HH:mm")} - {format(event.endAt, "HH:mm")}
              </span>
            )}
          </div>

          {/* Recurrence indicator */}
          {event.rrule && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Repeat className="h-4 w-4" />
              <span>Evenement recurrent</span>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}

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

          {/* Description */}
          {event.description && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
              {event.description}
            </div>
          )}

          {/* Comments toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Commentaires</span>
            {showComments ? (
              <ChevronUp className="h-4 w-4 ml-auto" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-auto" />
            )}
          </button>

          {/* Comments section */}
          {showComments && (
            <div className="mt-3 pt-3 border-t">
              <EventComments eventId={event.id} />
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
